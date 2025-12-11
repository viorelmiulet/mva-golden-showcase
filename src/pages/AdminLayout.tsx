import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-background via-background to-secondary/10">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-4 gap-4">
            <SidebarTrigger className="hover:bg-gold/10 hover:text-gold transition-colors" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold" />
              <h1 className="text-lg font-semibold">
                <span className="text-foreground">Panou </span>
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Administrare
                </span>
              </h1>
            </div>
            <Link to="/" className="ml-auto">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Înapoi la site
              </Button>
            </Link>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
