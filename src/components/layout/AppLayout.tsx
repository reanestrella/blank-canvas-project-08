import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NoChurchScreen } from "./NoChurchScreen";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, hasNoChurch } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hasNoChurch) {
    return <NoChurchScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn("md:ml-64 transition-all duration-300")}>
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
