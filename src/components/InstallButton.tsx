import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    // 🔥 PEGA O EVENTO GLOBAL
    if ((window as any).deferredPrompt) {
      setPrompt((window as any).deferredPrompt);
    }
  }, []);

  const instalar = async () => {
    const deferred = (window as any).deferredPrompt;

    if (!deferred) {
      alert("Instalação não disponível ainda");
      return;
    }

    deferred.prompt();

    const choice = await deferred.userChoice;

    if (choice.outcome === "accepted") {
      console.log("✅ Instalado");
    }

    (window as any).deferredPrompt = null;
    setPrompt(null);
  };

  if (!prompt) return null;

  return (
    <Button onClick={instalar}>
      Instalar App
    </Button>
  );
}
