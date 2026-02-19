import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CellReportErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("CellReportErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            Erro crítico detectado:
          </p>
          <pre className="text-xs text-muted-foreground bg-muted p-3 rounded max-w-full overflow-auto whitespace-pre-wrap">
            {this.state.error?.message || "Erro desconhecido"}
          </pre>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
