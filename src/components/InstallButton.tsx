import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const instalar = async () => {
    if (!prompt) return;

    prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("✅ App instalado");
    }

    setPrompt(null);
  };

  if (!prompt) return null;

  return (
    <Button onClick={instalar}>
      Instalar App
    </Button>
  );
}
