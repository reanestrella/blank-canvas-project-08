import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { Download, Printer, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Member } from "@/hooks/useMembers";

interface CertificateGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
}

type CertType = "apresentacao_crianca" | "batismo" | "diaconal";

const certLabels: Record<CertType, string> = {
  apresentacao_crianca: "Apresentação de Criança",
  batismo: "Batismo",
  diaconal: "Consagração Diaconal",
};

const certDescriptions: Record<CertType, string> = {
  apresentacao_crianca: "Certificamos que a criança abaixo foi apresentada ao Senhor nesta igreja, conforme as Escrituras Sagradas.",
  batismo: "Certificamos que o(a) irmão(ã) abaixo foi batizado(a) nas águas nesta igreja, conforme as Escrituras Sagradas, em obediência ao mandamento do Senhor Jesus Cristo.",
  diaconal: "Certificamos que o(a) irmão(ã) abaixo foi consagrado(a) ao ministério diaconal nesta igreja, conforme as Escrituras Sagradas.",
};

export function CertificateGenerator({ open, onOpenChange, members }: CertificateGeneratorProps) {
  const { church } = useAuth();
  const [certType, setCertType] = useState<CertType>("batismo");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [customName, setCustomName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [pastorName, setPastorName] = useState("");
  const [extraInfo, setExtraInfo] = useState("");

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const memberName = selectedMember?.full_name || customName || "";

  const handlePrint = () => {
    if (!memberName.trim()) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const churchName = church?.name || "Igreja";
    const dateFormatted = new Date(eventDate + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric", month: "long", year: "numeric",
    });

    const parentInfo = certType === "apresentacao_crianca" && extraInfo
      ? `<p style="font-size:14px;margin-top:12px;color:#555;">Pais/Responsáveis: <strong>${extraInfo}</strong></p>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Certificado - ${certLabels[certType]}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: landscape; margin: 0; }
    body { 
      width: 297mm; height: 210mm; 
      font-family: 'Lora', serif;
      display: flex; align-items: center; justify-content: center;
      background: #fff;
    }
    .certificate {
      width: 277mm; height: 190mm;
      border: 3px solid #8B6914;
      border-radius: 8px;
      padding: 40px 50px;
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      background: linear-gradient(135deg, #fffdf5 0%, #fff9e6 100%);
    }
    .certificate::before {
      content: '';
      position: absolute; inset: 8px;
      border: 1px solid #C9A84C;
      border-radius: 4px;
      pointer-events: none;
    }
    .church-name { font-size: 16px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #8B6914; margin-bottom: 20px; }
    .description { font-size: 14px; color: #555; max-width: 500px; line-height: 1.6; margin-bottom: 24px; }
    .member-name { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #333; margin-bottom: 8px; border-bottom: 2px solid #C9A84C; padding-bottom: 8px; display: inline-block; }
    .date { font-size: 14px; color: #666; margin-top: 16px; margin-bottom: 32px; }
    .signatures { display: flex; justify-content: center; gap: 80px; margin-top: auto; }
    .sig-line { text-align: center; }
    .sig-line .line { width: 180px; border-top: 1px solid #999; margin-bottom: 4px; }
    .sig-line .label { font-size: 12px; color: #666; }
    .ornament { font-size: 24px; color: #C9A84C; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="church-name">${churchName}</div>
    <div class="ornament">✦</div>
    <div class="title">Certificado de ${certLabels[certType]}</div>
    <div class="description">${certDescriptions[certType]}</div>
    <div class="member-name">${memberName}</div>
    ${parentInfo}
    <div class="date">${dateFormatted}</div>
    <div class="signatures">
      <div class="sig-line">
        <div class="line"></div>
        <div class="label">${pastorName || "Pastor(a)"}</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="label">Secretário(a)</div>
      </div>
    </div>
  </div>
  <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Certificado
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo, o membro e gere o certificado para impressão ou download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Tipo de Certificado</Label>
            <Select value={certType} onValueChange={(v) => setCertType(v as CertType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apresentacao_crianca">Apresentação de Criança</SelectItem>
                <SelectItem value="batismo">Batismo</SelectItem>
                <SelectItem value="diaconal">Consagração Diaconal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Membro (selecione ou digite)</Label>
            <MemberAutocomplete
              members={members.map((m) => ({ id: m.id, full_name: m.full_name }))}
              value={selectedMemberId}
              onChange={(id) => {
                setSelectedMemberId(id);
                setCustomName("");
              }}
              placeholder="Buscar membro..."
            />
            <p className="text-xs text-muted-foreground mt-1">Ou digite manualmente:</p>
            <Input
              placeholder="Nome completo"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSelectedMemberId("");
              }}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Data do Evento</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>

          <div>
            <Label>Nome do Pastor(a)</Label>
            <Input
              placeholder="Nome que aparecerá na assinatura"
              value={pastorName}
              onChange={(e) => setPastorName(e.target.value)}
            />
          </div>

          {certType === "apresentacao_crianca" && (
            <div>
              <Label>Pais/Responsáveis</Label>
              <Input
                placeholder="Nome dos pais ou responsáveis"
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handlePrint} disabled={!memberName.trim()}>
            <Printer className="w-4 h-4 mr-2" />
            Gerar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
