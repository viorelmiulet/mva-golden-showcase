import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Lock, ArrowLeft, BarChart3, Loader2, ShieldX } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";

const AdminLayout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useUserRoles();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Deconectat",
      description: "Ai fost deconectat cu succes",
    });
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Se verifică accesul...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <CardTitle className="text-2xl">Autentificare necesară</CardTitle>
            <p className="text-muted-foreground">
              Trebuie să fii autentificat pentru a accesa panoul de administrare
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/auth")} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Autentifică-te
            </Button>
            <div className="pt-4 border-t">
              <Link
                to="/"
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi la site
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acces restricționat</CardTitle>
            <p className="text-muted-foreground">
              Nu ai permisiunea de a accesa panoul de administrare. Contactează un administrator pentru acces.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Deconectează-te
            </Button>
            <div className="pt-4 border-t">
              <Link
                to="/"
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi la site
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-background via-background to-secondary/10">
        <AdminSidebar onLogout={handleLogout} />

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
