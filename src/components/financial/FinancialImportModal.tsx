import { useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import type { FinancialCategory } from "@/hooks/useFinancial";

interface FinancialImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  categories: FinancialCategory[];
  accounts: { id: string; name: string }[];
  onImportDone: () => void;
}

interface ParsedTx {
  date: string;
  description: string;
  type: "receita" | "despesa";
  amount: number;
  category: string;
  error?: string;
}

export function FinancialImportModal({
  open, onOpenChange, churchId, categories, accounts, onImportDone,
}: FinancialImportModalProps) {
  const [rows, setRows] = useState<ParsedTx[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [targetAccountId, setTargetAccountId] = useState("");
  const { toast } = useToast();

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Data", "Descrição", "Tipo", "Valor", "Categoria"],
      ["01/01/2025", "Dízimo João Silva", "Entrada", "500.00", "Dízimos"],
      ["02/01/2025", "Conta de Luz", "Saída", "350.00", "Energia"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, "modelo_importacao_financeira.xlsx");
  };

  const parseDate = (val: any): string => {
    if (!val) return "";
    // Handle Excel serial numbers
    if (typeof val === "number") {
      const d = XLSX.SSF.parse_date_code(val);
      if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    const s = String(val).trim();
    // DD/MM/YYYY
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    // YYYY-MM-DD
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m2) return s;
    return "";
  };

  const parseAmount = (val: any): number => {
    if (typeof val === "number") return Math.abs(val);
    const s = String(val).replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.abs(n);
  };

  const detectType = (val: any): "receita" | "despesa" => {
    const s = String(val).toLowerCase().trim();
    if (["entrada", "receita", "crédito", "credito", "credit", "income", "c"].includes(s)) return "receita";
    if (["saída", "saida", "despesa", "débito", "debito", "debit", "expense", "d"].includes(s)) return "despesa";
    // Check if amount is negative
    if (typeof val === "number" && val < 0) return "despesa";
    return "receita";
  };

  const parseFile = useCallback(async (file: File) => {
    setResult(null);
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const parsed: ParsedTx[] = json.map((row) => {
      const rawDate = row["Data"] || row["data"] || row["DATE"] || "";
      const description = String(row["Descrição"] || row["descricao"] || row["Descriçao"] || row["DESCRIÇÃO"] || row["Description"] || "").trim();
      const rawType = row["Tipo"] || row["tipo"] || row["TYPE"] || "";
      const rawAmount = row["Valor"] || row["valor"] || row["VALUE"] || row["Amount"] || 0;
      const category = String(row["Categoria"] || row["categoria"] || row["CATEGORIA"] || row["Category"] || "").trim();

      const date = parseDate(rawDate);
      const amount = parseAmount(rawAmount);
      const type = detectType(rawType);

      let error = "";
      if (!date) error = "Data inválida";
      if (!description) error = error ? `${error}; Descrição vazia` : "Descrição vazia";
      if (amount <= 0) error = error ? `${error}; Valor inválido` : "Valor inválido";

      return { date, description, type, amount, category, error };
    });

    setRows(parsed);
  }, []);

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

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => !!r.error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    let imported = 0;
    let errors = 0;

    // Build category lookup
    const catLookup = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    const chunks: ParsedTx[][] = [];
    for (let i = 0; i < validRows.length; i += 50) {
      chunks.push(validRows.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const insertData = chunk.map((r) => ({
        church_id: churchId,
        transaction_date: r.date,
        description: r.description,
        type: r.type,
        amount: r.amount,
        category_id: catLookup.get(r.category.toLowerCase()) || null,
        account_id: targetAccountId || null,
      }));

      const { data, error } = await supabase.from("financial_transactions").insert(insertData).select("id");
      if (error) {
        console.error("Import chunk error:", error);
        errors += chunk.length;
      } else {
        imported += data.length;
      }
    }

    setResult({ imported, errors: errors + errorRows.length });
    setImporting(false);

    if (imported > 0) {
      toast({ title: "Importação concluída", description: `${imported} lançamentos importados.` });
      onImportDone();
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setRows([]);
      setResult(null);
      setTargetAccountId("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Lançamentos Financeiros</DialogTitle>
          <DialogDescription>
            Importe transações de outro sistema via arquivo CSV ou XLSX.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-lg font-semibold">Importação Finalizada</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">{result.imported}</p>
                <p className="text-sm text-muted-foreground">Importados</p>
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
              <span className="text-xs text-muted-foreground mt-1">
                Colunas: Data, Descrição, Tipo (Entrada/Saída), Valor, Categoria
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
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <Badge variant="secondary" className="bg-success/20 text-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                {validRows.length} válidos
              </Badge>
              <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                <XCircle className="w-3 h-3 mr-1" />
                {errorRows.length} com erro
              </Badge>
            </div>

            {accounts.length > 0 && (
              <div>
                <Label>Conta destino (opcional)</Label>
                <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="max-h-[40vh] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                      <TableCell>
                        {r.error ? (
                          <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                        ) : (
                          <Badge className="bg-success/20 text-success text-xs">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{r.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          r.type === "receita" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        }>
                          {r.type === "receita" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        R$ {r.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm">{r.category || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 100 && (
                <p className="text-xs text-muted-foreground text-center p-2">
                  Mostrando 100 de {rows.length} linhas
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!result && rows.length > 0 && (
            <>
              <Button variant="outline" onClick={() => setRows([])}>Voltar</Button>
              <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {validRows.length} lançamentos
              </Button>
            </>
          )}
          {result && <Button onClick={() => handleClose(false)}>Fechar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
