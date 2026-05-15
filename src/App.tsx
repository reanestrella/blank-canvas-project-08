import AcceptInvite from "./pages/AcceptInvite";
import { lazy, Suspense, useEffect } from "react";
import { initOneSignal } from "@/lib/onesignal";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { RequireAnyRole } from "@/components/guards/RequireAnyRole";
import { RequireSubscription } from "@/components/guards/RequireSubscription";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const Convite = lazy(() => import("./pages/Convite"));
const InviteGate = lazy(() => import("./pages/InviteGate"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Secretaria = lazy(() => import("./pages/Secretaria"));
const Ministerios = lazy(() => import("./pages/Ministerios"));
const Celulas = lazy(() => import("./pages/Celulas"));
const Ensino = lazy(() => import("./pages/Ensino"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Eventos = lazy(() => import("./pages/Eventos"));
const MeuApp = lazy(() => import("./pages/MeuApp"));
const Contribuicao = lazy(() => import("./pages/Contribuicao"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Consolidacao = lazy(() => import("./pages/Consolidacao"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const Discipulados = lazy(() => import("./pages/Discipulados"));
const Visitas = lazy(() => import("./pages/Visitas"));
const Gabinete = lazy(() => import("./pages/Gabinete"));
const GestaoPastoral = lazy(() => import("./pages/GestaoPastoral"));
const Lembretes = lazy(() => import("./pages/Lembretes"));
const Cadastrar = lazy(() => import("./pages/Cadastrar"));
const Instalar = lazy(() => import("./pages/Instalar"));
const Master = lazy(() => import("./pages/Master"));
const Assistente = lazy(() => import("./pages/Assistente"));
const NetworkDashboard = lazy(() => import("./pages/NetworkDashboard"));
const GestaoApp = lazy(() => import("./pages/GestaoApp"));
const Patrimonio = lazy(() => import("./pages/Patrimonio"));
const Planos = lazy(() => import("./pages/Planos"));
const Sucesso = lazy(() => import("./pages/Sucesso"));
const Cancelado = lazy(() => import("./pages/Cancelado"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
        <img src={APP_BRAND_LOGO} alt={APP_BRAND_NAME} className="h-12 w-auto max-w-[200px] object-contain" />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">Carregando seu app...</p>
        <p className="text-xs text-muted-foreground">
          desenvolvido por <span className="font-semibold text-primary">{APP_BRAND_NAME.toLowerCase()}</span>
        </p>
      </div>
    </div>
  );
}

function UnhandledRejectionHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return null;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <RequireSubscription>{children}</RequireSubscription>;
}

const App = () => {

  // 🔔 OneSignal
  useEffect(() => {
    const iniciar = async () => {
      try {
        await initOneSignal();
      } catch (e) {
        console.log("OneSignal erro:", e);
      }
    };
    void iniciar();
  }, []);

  // 🍎 ÍCONE DINÂMICO PARA IPHONE (FUNCIONANDO DE VERDADE)
  useEffect(() => {

    function setAppleIcon(url: string) {
      const existing = document.querySelector("link[rel='apple-touch-icon']");
      if (existing) existing.remove();

      const link = document.createElement("link");
      link.rel = "apple-touch-icon";
      link.sizes = "180x180";
      link.href = url + (url.includes("?") ? "&" : "?") + "v=" + Date.now();

      document.head.appendChild(link);
      console.log("🍎 Apple icon atualizado:", link.href);
    }

    // fallback imediato
    setAppleIcon(APP_BRAND_LOGO);

    // 🔥 Observa quando a logo da igreja aparece na tela
    const observer = new MutationObserver(() => {
      const img = document.querySelector("img");

      if (img && img.src && !img.src.includes("placeholder")) {
        setAppleIcon(img.src);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // segurança extra (caso já esteja carregado)
    setTimeout(() => {
      const img = document.querySelector("img");
      if (img?.src) {
        setAppleIcon(img.src);
      }
    }, 2000);

    return () => observer.disconnect();

  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <UnhandledRejectionHandler />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>

                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/registro" element={<Registro />} />
                  <Route path="/convite/:token" element={<Convite />} />
                  <Route path="/accept-invite" element={<InviteGate />} />
                  <Route path="/cadastrar" element={<Cadastrar />} />
                  <Route path="/cadastro" element={<Cadastrar />} />
                  <Route path="/instalar" element={<Instalar />} />
                  <Route path="/planos" element={<Planos />} />
                  <Route path="/sucesso" element={<Sucesso />} />
                  <Route path="/cancelado" element={<Cancelado />} />
                  <Route path="/master" element={<Master />} />
                  <Route path="/dev-admin" element={<Master />} />

                  <Route path="/rede" element={<Sub><NetworkDashboard /></Sub>} />
                  <Route
                    path="/gestao-app"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor"]}>
                          <GestaoApp />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

              <Route path="/app" element={<Dashboard />} />
                  <Route path="/meu-app" element={<Sub><MeuApp /></Sub>} />
                  <Route path="/perfil" element={<Sub><Perfil /></Sub>} />

                  <Route
                    path="/secretaria"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor", "secretario", "consolidacao"]}>
                          <Secretaria />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/ministerios"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor", "lider_ministerio"]}>
                          <Ministerios />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/celulas"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor", "lider_celula", "consolidacao", "secretario"]}>
                          <Celulas />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/financeiro"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor", "tesoureiro"]}>
                          <Financeiro />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/consolidacao"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor", "consolidacao"]}>
                          <Consolidacao />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/auditoria"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor"]}>
                          <Auditoria />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/configuracoes"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor"]}>
                          <Configuracoes />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/gestao-pastoral"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor"]}>
                          <GestaoPastoral />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/ensino"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor"]}>
                          <Ensino />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route
                    path="/lembretes"
                    element={
                      <Sub>
                        <RequireAnyRole allowedRoles={["pastor"]}>
                          <Lembretes />
                        </RequireAnyRole>
                      </Sub>
                    }
                  />

                  <Route path="/eventos" element={<Sub><Eventos /></Sub>} />
                  <Route path="/contribuicao" element={<Sub><Contribuicao /></Sub>} />
                  <Route path="/discipulados" element={<Sub><Discipulados /></Sub>} />
                  <Route path="/visitas" element={<Sub><Visitas /></Sub>} />
                  <Route path="/gabinete" element={<Sub><Gabinete /></Sub>} />
                  <Route path="/patrimonio" element={<Sub><Patrimonio /></Sub>} />
                  <Route path="/assistente" element={<Sub><Assistente /></Sub>} />

                  <Route path="*" element={<NotFound />} />

                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
