import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    try {
      const deferred = (window as any)?.deferredPrompt;

      if (deferred) {
        setPrompt(deferred);
      }
    } catch (error) {
      console.log("Erro ao capturar deferredPrompt:", error);
    }
  }, []);

  const instalar = async () => {
    try {
      const deferred = (window as any)?.deferredPrompt;

      if (!deferred) {
        console.log("Prompt não disponível");
        return;
      }

      deferred.prompt();
      await deferred.userChoice;

      (window as any).deferredPrompt = null;
      setPrompt(null);
    } catch (error) {
      console.log("Erro ao instalar:", error);
    }
  };

  // 🔥 PROTEÇÃO TOTAL (IMPEDIR QUEBRAR REACT)
  if (!prompt) return null;

  return (
    <div style={{ padding: 16 }}>
      <Button onClick={instalar}>
        Instalar App
      </Button>
    </div>
  );
}
