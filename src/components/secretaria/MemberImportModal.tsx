import { useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, Download, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface MemberImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  existingMembers: { full_name: string; email: string | null; phone: string | null }[];
  onImportDone: () => void;
}

interface ParsedRow {
  full_name: string;
  email: string;
  phone: string;
  mobile: string;
  title: string;
  error?: string;
  isDuplicate?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

export function MemberImportModal({
  open,
  onOpenChange,
  churchId,
  existingMembers,
  onImportDone,
}: MemberImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome", "E-mail 1", "Telefone 1", "Celular 1", "Título"],
      ["João Silva", "joao@email.com", "(11) 3333-4444", "(11) 99999-8888", "Diácono"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Membros");
    XLSX.writeFile(wb, "modelo_importacao_membros.xlsx");
  };

  const parseFile = useCallback(async (file: File) => {
    setResult(null);
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const existingEmails = new Set(
      existingMembers.filter((m) => m.email).map((m) => m.email!.toLowerCase()),
    );
    const existingPhones = new Set(
      existingMembers.filter((m) => m.phone).map((m) => normalizePhone(m.phone!)),
    );
    const existingNames = new Set(
      existingMembers.map((m) => m.full_name.toLowerCase().trim()),
    );

    const parsed: ParsedRow[] = json.map((row) => {
      const full_name = String(row["Nome"] || row["nome"] || row["NOME"] || "").trim();
      const email = String(row["E-mail 1"] || row["email"] || row["Email"] || row["EMAIL"] || "").trim();
      const phone = String(row["Telefone 1"] || row["telefone"] || row["Telefone"] || "").trim();
      const mobile = String(row["Celular 1"] || row["celular"] || row["Celular"] || "").trim();
      const title = String(row["Título"] || row["titulo"] || row["Titulo"] || "").trim();

      let error = "";
      let isDuplicate = false;

      if (!full_name) {
        error = "Nome vazio";
      } else if (full_name.length < 2) {
        error = "Nome muito curto";
      }

      if (email && !EMAIL_REGEX.test(email)) {
        error = error ? `${error}; Email inválido` : "Email inválido";
      }

      if (email && existingEmails.has(email.toLowerCase())) {
        isDuplicate = true;
      } else if (phone && existingPhones.has(normalizePhone(phone))) {
        isDuplicate = true;
      } else if (mobile && existingPhones.has(normalizePhone(mobile))) {
        isDuplicate = true;
      } else if (full_name && existingNames.has(full_name.toLowerCase())) {
        isDuplicate = true;
      }

      return { full_name, email, phone, mobile, title, error, isDuplicate };
    });

    setRows(parsed);
  }, [existingMembers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      toast({ title: "Formato inválido", description: "Use CSV ou XLSX.", variant: "destructive" });
      return;
    }
    parseFile(file);
  };

  const validRows = rows.filter((r) => !r.error && !r.isDuplicate);
  const errorRows = rows.filter((r) => !!r.error);
  const duplicateRows = rows.filter((r) => r.isDuplicate && !r.error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    let imported = 0;
    let errors = 0;

    // Batch insert in chunks of 50
    const chunks: ParsedRow[][] = [];
    for (let i = 0; i < validRows.length; i += 50) {
      chunks.push(validRows.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const insertData = chunk.map((r) => ({
        church_id: churchId,
        full_name: r.full_name,
        email: r.email || null,
        phone: r.phone || r.mobile || null,
        notes: r.title ? `Título: ${r.title}` : null,
      }));

      const { data, error } = await supabase.from("members").insert(insertData).select("id");
      if (error) {
        console.error("Import chunk error:", error);
        errors += chunk.length;
      } else {
        imported += data.length;
      }
    }

    setResult({ imported, skipped: duplicateRows.length, errors: errors + errorRows.length });
    setImporting(false);

    if (imported > 0) {
      toast({ title: "Importação concluída", description: `${imported} membros importados.` });
      onImportDone();
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setRows([]);
      setResult(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Membros</DialogTitle>
          <DialogDescription>
            Importe membros em lote via arquivo CSV ou XLSX.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-lg font-semibold">Importação Finalizada</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">{result.imported}</p>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{result.skipped}</p>
                <p className="text-sm text-muted-foreground">Ignorados (duplicados)</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{result.errors}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Modelo
              </Button>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Clique ou arraste um arquivo CSV/XLSX
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-success/20 text-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                {validRows.length} válidos
              </Badge>
              <Badge variant="secondary" className="bg-muted">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {duplicateRows.length} duplicados
              </Badge>
              <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                <XCircle className="w-3 h-3 mr-1" />
                {errorRows.length} com erro
              </Badge>
            </div>

            {/* Preview table */}
            <div className="max-h-[40vh] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Título</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow
                      key={i}
                      className={r.error ? "bg-destructive/5" : r.isDuplicate ? "bg-muted/50 opacity-60" : ""}
                    >
                      <TableCell>
                        {r.error ? (
                          <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                        ) : r.isDuplicate ? (
                          <Badge variant="secondary" className="text-xs">Duplicado</Badge>
                        ) : (
                          <Badge className="bg-success/20 text-success text-xs">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>{r.full_name || "—"}</TableCell>
                      <TableCell className="text-sm">{r.email || "—"}</TableCell>
                      <TableCell className="text-sm">{r.phone || r.mobile || "—"}</TableCell>
                      <TableCell className="text-sm">{r.title || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result && rows.length > 0 && (
            <>
              <Button variant="outline" onClick={() => setRows([])}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {validRows.length} membros
              </Button>
            </>
          )}
          {result && (
            <Button onClick={() => handleClose(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
