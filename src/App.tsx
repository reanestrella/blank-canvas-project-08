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
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

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
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

                  {/* Públicas */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/registro" element={<Registro />} />
                  <Route path="/convite/:token" element={<Convite />} />
                  <Route path="/accept-invite" element={<InviteGate />} />
                  <Route path="/cadastrar" element={<Cadastrar />} />
                  <Route path="/cadastro" element={<Cadastrar />} />
                  <Route path="/instalar" element={<Instalar />} />

                  {/* Admin */}
                  <Route path="/master" element={<Master />} />
                  <Route path="/dev-admin" element={<Master />} />

                  {/* Rede */}
                  <Route path="/rede" element={<NetworkDashboard />} />
                  <Route
                    path="/gestao-app"
                    element={
                      <RequireAnyRole allowedRoles={["pastor"]}>
                        <GestaoApp />
                      </RequireAnyRole>
                    }
                  />

                  {/* Usuário */}
                  <Route path="/app" element={<Dashboard />} />
                  <Route path="/meu-app" element={<MeuApp />} />
                  <Route path="/perfil" element={<Perfil />} />

                  {/* Protegidas */}
                  <Route
                    path="/secretaria"
                    element={
                      <RequireAnyRole allowedRoles={["pastor", "secretario", "consolidacao"]}>
                        <Secretaria />
                      </RequireAnyRole>
                    }
                  />

                  <Route
                    path="/ministerios"
                    element={
                      <RequireAnyRole allowedRoles={["pastor", "lider_ministerio"]}>
                        <Ministerios />
                      </RequireAnyRole>
                    }
                  />

                  <Route
                    path="/celulas"
                    element={
                      <RequireAnyRole allowedRoles={["pastor", "lider_celula", "consolidacao", "secretario"]}>
                        <Celulas />
                      </RequireAnyRole>
                    }
                  />

                  <Route
                    path="/financeiro"
                    element={
                      <RequireAnyRole allowedRoles={["pastor", "tesoureiro"]}>
                        <Financeiro />
                      </RequireAnyRole>
                    }
                  />

                  <Route
                    path="/configuracoes"
                    element={
                      <RequireAnyRole allowedRoles={["pastor"]}>
                        <Configuracoes />
                      </RequireAnyRole>
                    }
                  />

                  {/* 404 */}
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
