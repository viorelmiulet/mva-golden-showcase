import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3, Lock, LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ADMIN_PASSWORD = "123456";

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Parolă incorectă");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    setPassword("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md border-gold/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <CardTitle className="text-xl">Panou Administrare</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Introduceți parola pentru acces
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Parolă"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
                {error && (
                  <p className="text-destructive text-sm mt-2 text-center">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black">
                Autentificare
              </Button>
              <Link to="/" className="block">
                <Button type="button" variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Înapoi la site
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Deconectare
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Înapoi la site
                </Button>
              </Link>
            </div>
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
