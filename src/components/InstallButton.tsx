import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const check = () => setCanInstall(!!(window as any).deferredPrompt);
    check();
    window.addEventListener("beforeinstallprompt", () => check());
    return () => window.removeEventListener("beforeinstallprompt", check);
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).deferredPrompt;
    if (!prompt) return;

    prompt.prompt();
    const choice = await prompt.userChoice;
    console.log("Escolha do usuário:", choice.outcome);
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <Button
      onClick={handleInstall}
      className="fixed bottom-5 right-5 z-[9999] gap-2 shadow-lg"
      size="lg"
    >
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  );
}
