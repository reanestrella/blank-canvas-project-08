import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("GlobalErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Ocorreu um erro inesperado</h1>
            <p className="text-sm text-muted-foreground">
              Algo deu errado. Clique no botão abaixo para recarregar a página.
            </p>
            <pre className="text-xs text-muted-foreground bg-muted p-3 rounded max-w-full overflow-auto whitespace-pre-wrap">
              {this.state.error?.message || "Erro desconhecido"}
            </pre>
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
