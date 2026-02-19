import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Convite from "./pages/Convite";
import Dashboard from "./pages/Dashboard";
import Secretaria from "./pages/Secretaria";
import Ministerios from "./pages/Ministerios";
import Celulas from "./pages/Celulas";
import Ensino from "./pages/Ensino";
import Financeiro from "./pages/Financeiro";
import Eventos from "./pages/Eventos";
import MeuApp from "./pages/MeuApp";
import Configuracoes from "./pages/Configuracoes";
import Consolidacao from "./pages/Consolidacao";
import Discipulados from "./pages/Discipulados";
import Visitas from "./pages/Visitas";
import Gabinete from "./pages/Gabinete";
import Lembretes from "./pages/Lembretes";
import Instalar from "./pages/Instalar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/convite/:token" element={<Convite />} />
            <Route path="/instalar" element={<Instalar />} />
            
            {/* App Routes */}
            <Route path="/app" element={<Dashboard />} />
            <Route path="/secretaria" element={<Secretaria />} />
            <Route path="/ministerios" element={<Ministerios />} />
            <Route path="/celulas" element={<Celulas />} />
            <Route path="/ensino" element={<Ensino />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/consolidacao" element={<Consolidacao />} />
            <Route path="/discipulados" element={<Discipulados />} />
            <Route path="/visitas" element={<Visitas />} />
            <Route path="/gabinete" element={<Gabinete />} />
            <Route path="/lembretes" element={<Lembretes />} />
            <Route path="/meu-app" element={<MeuApp />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
