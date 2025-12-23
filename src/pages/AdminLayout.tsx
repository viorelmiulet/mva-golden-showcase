import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3, Lock, LogOut, Settings, Eye, EyeOff, Menu, X } from "lucide-react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_PASSWORD = "123456";

const getStoredPassword = () => {
  return localStorage.getItem("admin_password") || DEFAULT_PASSWORD;
};

const AdminHeader = ({ 
  onLogout, 
  isSettingsOpen, 
  setIsSettingsOpen,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  handleChangePassword,
  isMobile,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}: any) => {
  return (
    <header className="h-14 md:h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-20 flex items-center px-3 md:px-4 gap-2 md:gap-4">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex items-center gap-2 p-4 border-b border-border/40">
              <BarChart3 className="w-5 h-5 text-gold" />
              <span className="font-semibold">Panou Admin</span>
            </div>
            <AdminSidebar isMobileSheet onNavigate={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gold" />
        <h1 className="text-base md:text-lg font-semibold">
          <span className="text-foreground">Panou </span>
          <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
            Admin
          </span>
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size={isMobile ? "icon" : "default"}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Setări</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Schimbă Parola</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Parola curentă</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Introduceți parola curentă"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Parola nouă</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Introduceți parola nouă"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmă parola nouă</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmați parola nouă"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Anulează
                </Button>
                <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90 text-black">
                  Salvează
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Button 
          variant="ghost" 
          size={isMobile ? "icon" : "default"}
          onClick={onLogout}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Ieșire</span>}
        </Button>
        <Link to="/">
          <Button variant="ghost" size={isMobile ? "icon" : "default"} className="h-9">
            <ArrowLeft className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Site</span>}
          </Button>
        </Link>
      </div>
    </header>
  );
};

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === getStoredPassword()) {
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

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentPassword !== getStoredPassword()) {
      toast.error("Parola curentă este incorectă");
      return;
    }
    
    if (newPassword.length < 4) {
      toast.error("Parola nouă trebuie să aibă cel puțin 4 caractere");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Parolele noi nu coincid");
      return;
    }
    
    localStorage.setItem("admin_password", newPassword);
    toast.success("Parola a fost schimbată cu succes!");
    setIsSettingsOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            onLogout={handleLogout}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            handleChangePassword={handleChangePassword}
            isMobile={isMobile}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Main Content - fully responsive */}
          <main className="flex-1 p-3 md:p-6 overflow-x-hidden">
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
