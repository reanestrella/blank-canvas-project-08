import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    if ((window as any).deferredPrompt) {
      setPrompt((window as any).deferredPrompt);
    }
  }, []);

  const instalar = async () => {
    const deferred = (window as any).deferredPrompt;

    if (!deferred) {
      alert("Instalação não disponível");
      return;
    }

    deferred.prompt();

    await deferred.userChoice;

    (window as any).deferredPrompt = null;
    setPrompt(null);
  };

  if (!prompt) return null;

  return (
    <div style={{ padding: 16 }}>
      <Button onClick={instalar}>
        Instalar App
      </Button>
    </div>
  );
}
