import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, ImageIcon, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { setDynamicManifest } from "@/lib/setDynamicManifest";

interface ChurchLogoUploadProps {
  churchId: string;
  currentLogoUrl: string | null;
  onLogoUpdated: () => void;
}

async function processLogo(file: File): Promise<Blob> {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  const size = 180;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  // White background — removes transparency
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  // Scale to 80% with aspect ratio
  const scale = Math.min(size / img.width, size / img.height) * 0.8;
  const newWidth = img.width * scale;
  const newHeight = img.height * scale;
  const x = (size - newWidth) / 2;
  const y = (size - newHeight) / 2;

  ctx.drawImage(img, x, y, newWidth, newHeight);

  URL.revokeObjectURL(img.src);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao processar imagem"));
    }, "image/png");
  });
}

export function ChurchLogoUpload({ churchId, currentLogoUrl, onLogoUpdated }: ChurchLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie uma imagem PNG ou JPG.", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);

      // 1. Process image
      const processedBlob = await processLogo(file);
      setPreview(URL.createObjectURL(processedBlob));

      // 2. Upload to Supabase Storage
      const filePath = `${churchId}/logo.png`;
      const { error: uploadError } = await supabase.storage
        .from("church-logos")
        .upload(filePath, processedBlob, {
          contentType: "image/png",
          upsert: true,
          cacheControl: "0",
        });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from("church-logos")
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;

      // 4. Save URL to church record
      const { error: dbError } = await supabase
        .from("churches")
        .update({ logo_url: logoUrl })
        .eq("id", churchId);

      if (dbError) throw dbError;

      // 5. Update PWA assets
      setDynamicManifest(churchId, logoUrl);

      toast({ title: "Logo atualizada!", description: "A logo foi processada e salva com sucesso." });
      onLogoUpdated();
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast({ title: "Erro no upload", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayUrl = preview || (currentLogoUrl ? `${currentLogoUrl}?v=${Date.now()}` : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Logo da Igreja
        </CardTitle>
        <CardDescription>
          A logo será usada como ícone do aplicativo (PWA) e no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted">
            {displayUrl ? (
              <img src={displayUrl} alt="Logo da igreja" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Logo
                </>
              )}
            </Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground/80 mb-1">Para melhor resultado no aplicativo:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Use uma logo centralizada</li>
                  <li>Evite textos muito pequenos</li>
                  <li>Evite logos totalmente brancas</li>
                  <li>A imagem será ajustada automaticamente (180×180px, fundo branco)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
