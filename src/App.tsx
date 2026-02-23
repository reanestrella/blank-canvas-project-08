import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { RequireAnyRole } from "@/components/guards/RequireAnyRole";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Convite from "./pages/Convite";
import InviteGate from "./pages/InviteGate";
import Dashboard from "./pages/Dashboard";
import Secretaria from "./pages/Secretaria";
import Ministerios from "./pages/Ministerios";
import Celulas from "./pages/Celulas";
import Ensino from "./pages/Ensino";
import Financeiro from "./pages/Financeiro";
import Eventos from "./pages/Eventos";
import MeuApp from "./pages/MeuApp";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import Consolidacao from "./pages/Consolidacao";
import Discipulados from "./pages/Discipulados";
import Visitas from "./pages/Visitas";
import Gabinete from "./pages/Gabinete";
import Lembretes from "./pages/Lembretes";
import Cadastrar from "./pages/Cadastrar";
import Instalar from "./pages/Instalar";
import DevAdmin from "./pages/DevAdmin";
import Assistente from "./pages/Assistente";
import NotFound from "./pages/NotFound";
import { AiChatFab } from "@/components/ai/AiChatFab";
import { queryClient } from "@/lib/queryClient";

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

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <UnhandledRejectionHandler />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AiChatFab />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/convite/:token" element={<Convite />} />
              <Route path="/accept-invite" element={<InviteGate />} />
              <Route path="/cadastrar" element={<Cadastrar />} />
              <Route path="/instalar" element={<Instalar />} />
              
              {/* Always accessible to any authenticated user */}
              <Route path="/app" element={<Dashboard />} />
              <Route path="/meu-app" element={<MeuApp />} />
              <Route path="/perfil" element={<Perfil />} />

              {/* Role-protected routes */}
              <Route path="/secretaria" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario", "consolidacao"]}>
                  <Secretaria />
                </RequireAnyRole>
              } />
              <Route path="/ministerios" element={
                <RequireAnyRole allowedRoles={["pastor", "lider_ministerio"]}>
                  <Ministerios />
                </RequireAnyRole>
              } />
              <Route path="/celulas" element={
                <RequireAnyRole allowedRoles={["pastor", "lider_celula", "consolidacao", "secretario"]}>
                  <Celulas />
                </RequireAnyRole>
              } />
              <Route path="/ensino" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario"]}>
                  <Ensino />
                </RequireAnyRole>
              } />
              <Route path="/financeiro" element={
                <RequireAnyRole allowedRoles={["pastor", "tesoureiro"]}>
                  <Financeiro />
                </RequireAnyRole>
              } />
              <Route path="/eventos" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario", "lider_ministerio"]}>
                  <Eventos />
                </RequireAnyRole>
              } />
              <Route path="/consolidacao" element={
                <RequireAnyRole allowedRoles={["pastor", "consolidacao"]}>
                  <Consolidacao />
                </RequireAnyRole>
              } />
              <Route path="/discipulados" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario"]}>
                  <Discipulados />
                </RequireAnyRole>
              } />
              <Route path="/visitas" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario"]}>
                  <Visitas />
                </RequireAnyRole>
              } />
              <Route path="/gabinete" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario"]}>
                  <Gabinete />
                </RequireAnyRole>
              } />
              <Route path="/lembretes" element={
                <RequireAnyRole allowedRoles={["pastor", "secretario"]}>
                  <Lembretes />
                </RequireAnyRole>
              } />
              <Route path="/configuracoes" element={
                <RequireAnyRole allowedRoles={["pastor"]}>
                  <Configuracoes />
                </RequireAnyRole>
              } />
              <Route path="/assistente" element={
                <RequireAnyRole allowedRoles={["pastor", "lider_celula", "lider_ministerio"]}>
                  <Assistente />
                </RequireAnyRole>
              } />
              <Route path="/dev-admin" element={<DevAdmin />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
