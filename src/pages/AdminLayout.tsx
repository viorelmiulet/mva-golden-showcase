// Admin Layout with authentication and sidebar navigation
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
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
import AdminPWAInstallBanner from "@/components/AdminPWAInstallBanner";
import { motion, AnimatePresence } from "framer-motion";

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
    <header className="admin-header-modern h-14 md:h-16 sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3 md:gap-4 safe-area-inset-top">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-10 w-10 touch-manipulation active:scale-95 rounded-xl hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[85vw] max-w-[320px] p-0 flex flex-col h-[100dvh] overflow-hidden bg-gradient-to-b from-background to-background/95 border-r border-white/10"
          >
            <div className="flex items-center gap-3 p-4 border-b border-white/5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-gold" />
              </div>
              <div>
                <span className="font-semibold text-sm">MVA Admin</span>
                <p className="text-[10px] text-muted-foreground">Panou de control</p>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
              <AdminSidebar isMobileSheet onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden md:flex w-9 h-9 rounded-xl bg-gradient-to-br from-gold/15 to-gold/5 items-center justify-center">
          <BarChart3 className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-semibold truncate">
            <span className="text-foreground">Panou </span>
            <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
              Admin
            </span>
          </h1>
          <p className="text-[10px] text-muted-foreground hidden md:block">Administrare & Statistici</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground touch-manipulation active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md mx-2">
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
          size="icon"
          onClick={onLogout}
          className="h-10 w-10 text-muted-foreground hover:text-foreground touch-manipulation active:scale-95"
          title="Ieșire"
        >
          <LogOut className="w-4 h-4" />
        </Button>
        <Link to="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 touch-manipulation active:scale-95 rounded-xl hover:bg-white/5"
            title="Înapoi la site"
          >
            <ArrowLeft className="w-4 h-4" />
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
  const location = useLocation();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
        </div>
        
        <Card className="w-full max-w-md admin-glass-card border-0 relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mb-6 admin-glow">
              <Lock className="w-7 h-7 text-gold" />
            </div>
            <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Panou Admin
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Introduceți parola pentru acces securizat
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg tracking-[0.3em] h-12 bg-white/5 border-white/10 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                  autoFocus
                />
                {error && (
                  <p className="text-destructive text-sm mt-3 text-center">{error}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-black font-semibold rounded-xl transition-all duration-300 admin-glow"
              >
                Autentificare
              </Button>
              <Link to="/" className="block">
                <Button type="button" variant="ghost" className="w-full gap-2 rounded-xl hover:bg-white/5">
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-background/95">
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

          {/* Main Content - fully responsive with safe area support */}
          <main className="flex-1 p-4 md:p-8 overflow-auto bg-gradient-to-br from-transparent to-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.25, 
                  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
                }}
                className="max-w-7xl mx-auto pb-safe"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* PWA Install Banner for Admin */}
          <AdminPWAInstallBanner />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
