import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Share, PlusSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    ("standalone" in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function InstallButton() {
  const { church } = useAuth();
  const [canInstall, setCanInstall] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIosDevice] = useState(isIos);
  const [alreadyInstalled] = useState(isInStandaloneMode);

  useEffect(() => {
    if (alreadyInstalled) return;

    // Wait for the dynamic manifest to be picked up by Chrome
    const timer = setTimeout(() => {
      const check = () => setCanInstall(!!(window as any).deferredPrompt);
      check();

      const handler = (e: Event) => {
        e.preventDefault();
        (window as any).deferredPrompt = e;
        setCanInstall(true);
      };
      window.addEventListener("beforeinstallprompt", handler);

      return () => window.removeEventListener("beforeinstallprompt", handler);
    }, 2000);

    return () => clearTimeout(timer);
  }, [alreadyInstalled, church]);

  const handleInstall = async () => {
    if (isIosDevice) {
      setShowIosGuide(true);
      return;
    }

    const prompt = (window as any).deferredPrompt;
    if (!prompt) return;

    prompt.prompt();
    const choice = await prompt.userChoice;
    console.log("Escolha do usuário:", choice.outcome);
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };

  if (alreadyInstalled) return null;
  if (!canInstall && !isIosDevice) return null;

  return (
    <>
      <Button
        onClick={handleInstall}
        variant="outline"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        size="sm"
      >
        <Download className="h-4 w-4" />
        Instalar App
      </Button>

      <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para adicionar o app à tela inicial:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Toque no ícone <Share className="inline h-4 w-4 text-primary" /> de compartilhar
                </p>
                <p className="text-xs text-muted-foreground">
                  Na barra inferior do Safari (ou no topo, no iPad)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Toque em <PlusSquare className="inline h-4 w-4 text-primary" /> "Adicionar à Tela de Início"
                </p>
                <p className="text-xs text-muted-foreground">
                  Role para baixo no menu se necessário
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                3
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Toque em "Adicionar"
                </p>
                <p className="text-xs text-muted-foreground">
                  O app será adicionado com o ícone da sua igreja
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={() => setShowIosGuide(false)} className="w-full">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
