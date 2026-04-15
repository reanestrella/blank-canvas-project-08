import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, QrCode, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Congregation {
  id: string;
  name: string;
}

interface RegistrationQrCodeProps {
  compact?: boolean;
  churchId?: string;
  congregations?: Congregation[];
}

export function RegistrationQrCode({ compact, churchId, congregations }: RegistrationQrCodeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedCongregation, setSelectedCongregation] = useState<string>("");

  // Use published URL or env var, never preview URL
  const baseUrl = getAppUrl();
  const registrationUrl = churchId
    ? `${baseUrl}/cadastro?church=${churchId}${selectedCongregation ? `&congregation=${selectedCongregation}` : ""}`
    : `${baseUrl}/cadastro`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("registration-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = "qrcode-cadastro.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <QrCode className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Link de Autocadastro</p>
          <p className="text-xs text-muted-foreground truncate">{registrationUrl}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Link e QR Code de Autocadastro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {congregations && congregations.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Congregação (opcional)</label>
            <Select value={selectedCongregation} onValueChange={setSelectedCongregation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas / Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas / Sede</SelectItem>
                {congregations.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
          <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <code className="text-sm flex-1 truncate">{registrationUrl}</code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-white rounded-xl border">
            <QRCodeSVG
              id="registration-qr-svg"
              value={registrationUrl}
              size={200}
              level="M"
              includeMargin
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadQR}>
            <Download className="w-4 h-4 mr-1" /> Baixar QR Code
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Envie este link ou QR Code para que as pessoas se cadastrem. O cadastro ficará pendente de aprovação.
        </p>
      </CardContent>
    </Card>
  );
}
