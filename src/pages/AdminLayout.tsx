import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Eye, EyeOff, ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_authenticated") === "true";
    setIsAuthenticated(isAuth);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "123456") {
      setIsAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      toast({
        title: "Acces autorizat",
        description: "Bine ai venit în panoul de administrare!",
      });
    } else {
      toast({
        title: "Parolă incorectă",
        description: "Te rog să introduci parola corectă",
        variant: "destructive",
      });
    }
    setPassword("");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    toast({
      title: "Deconectat",
      description: "Ai fost deconectat cu succes",
    });
    navigate("/");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <CardTitle className="text-2xl">Acces Administrare</CardTitle>
            <p className="text-muted-foreground">
              Introdu parola pentru a accesa panoul de administrare
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Parolă</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introdu parola"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!password}>
                <Lock className="w-4 h-4 mr-2" />
                Accesează Panoul
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
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
            <SidebarTrigger />
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
