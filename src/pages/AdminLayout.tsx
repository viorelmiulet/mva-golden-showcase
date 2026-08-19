// Admin Layout with authentication and sidebar navigation
import { useState, useEffect, useMemo, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "@/lib/router-compat";

const PAGE_TITLES: Record<string, string> = {
  "/admin/inbox": "Inbox",
  "/admin/proprietati": "Proprietăți",
  "/admin/complexe": "Ansambluri Rezidențiale",
  "/admin/vizionari": "Vizionări",
  "/admin/vizualizari-proprietati": "Vizualizări Proprietăți",
  "/admin/virtual-staging": "Virtual Staging",
  "/admin/watermark": "Watermark",
  "/admin/clienti": "Clienți / Lead-uri",
  "/admin/comisioane": "Comisioane",
  "/admin/contracte": "Contracte",
  "/admin/gestiune-chirii": "Gestiune Chirii",
  "/admin/blog": "Blog",
  "/admin/news": "News",
  "/admin/marketing-ai": "Marketing AI",
  "/admin/facebook-queue": "Coadă Facebook",
  "/admin/facebook-groups": "Grupuri Facebook",
  "/admin/carti-vizita": "Cărți Vizită",
  "/admin/agent-vocal": "Agent Vocal AI",
  "/admin/rapoarte": "Rapoarte",
  "/admin/immoflux-codes": "Coduri ImmoFlux",
  "/admin/immoflux": "ImmoFlux Sync",
  "/admin/monitorizare-email": "Monitorizare Email",
  "/admin/setari": "Setări",
  "/admin/istoric": "Istoric",
  "/admin/instaleaza": "Instalează Aplicația",
  "/admin/inventar-presetat": "Inventar Presetat",
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3, Lock, LogOut, Settings, Eye, EyeOff, Menu, X, Search, Bell } from "lucide-react";
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
import "@/styles/admin.css";
import { setAdminPassword, clearAdminPassword } from "@/lib/adminDb";
import { adminChangePasswordFn, adminVerifyPasswordFn } from "@/lib/adminWrite.functions";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);


  const pageTitle = useMemo(() => {
    const path = location.pathname.replace(/\/$/, "");
    if (path === "/admin" || path === "") return "Dashboard";
    const match = Object.keys(PAGE_TITLES)
      .filter((key) => path.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];
    return match ? PAGE_TITLES[match] : "Panou Admin";
  }, [location.pathname]);

  const onSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/admin/proprietati?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="admin-header-modern h-14 md:h-16 sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3 md:gap-4 safe-area-inset-top">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-md touch-manipulation active:scale-95"
              aria-label="Deschide meniul"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[86vw] max-w-[300px] p-0 flex flex-col h-[100dvh] overflow-hidden border-r-0 bg-ink"
          >
            <div className="flex h-16 items-center gap-3 border-b border-paper/10 px-4 shrink-0">
              <div>
                <p className="font-display text-[15px] leading-tight text-paper">MVA</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brass">Imobiliare</p>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y bg-ink">
              <AdminSidebar isMobileSheet onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {mobileSearchOpen && isMobile ? (
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={onSearchSubmit}
            placeholder="Caută..."
            className="h-10 rounded-md border-border bg-card pl-9 pr-9 text-sm"
          />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Închide căutarea"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[17px] leading-tight md:text-lg text-foreground truncate">{pageTitle}</h1>
        </div>

      )}

      <div className="relative ml-auto hidden lg:block w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={onSearchSubmit}
          placeholder="Caută în sistem..."
          className="h-9 rounded-md border-border bg-card pl-9 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 lg:ml-2">
        {isMobile && !mobileSearchOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(true)}
            className="h-10 w-10 rounded-md text-muted-foreground hover:text-foreground touch-manipulation active:scale-95"
            aria-label="Caută"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
        <Link to="/admin/inbox">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-md text-muted-foreground hover:text-foreground" title="Notificări" aria-label="Notificări">
            <Bell className="w-4 h-4" />
          </Button>
        </Link>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground touch-manipulation active:scale-95"
              aria-label="Setări"
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
                    aria-label={showCurrentPassword ? "Ascunde parola curentă" : "Afișează parola curentă"}
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
                    aria-label={showNewPassword ? "Ascunde parola nouă" : "Afișează parola nouă"}
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
                <Button type="submit" className="flex-1 bg-brass hover:bg-brass/90 text-black">
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
          aria-label="Ieșire"
        >
          <LogOut className="w-4 h-4" />
        </Button>
        <Link to="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 touch-manipulation active:scale-95 rounded-xl hover:bg-white/5"
            title="Înapoi la site"
            aria-label="Înapoi la site"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => typeof window !== "undefined" && sessionStorage.getItem("admin_auth") === "true");
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


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== getStoredPassword()) {
      setError("Parolă incorectă");
      return;
    }
    const { ok } = await adminVerifyPasswordFn({ data: { password } });
    if (!ok) {
      setError("Parolă incorectă");
      return;
    }
    sessionStorage.setItem("admin_auth", "true");
    setAdminPassword(password);
    setIsAuthenticated(true);
    setError("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    clearAdminPassword();
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
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

    const result = await adminChangePasswordFn({
      data: { currentPassword, newPassword },
    });
    if (!result?.success) {
      toast.error(result?.error || "Parola nu a putut fi schimbată");
      return;
    }

    localStorage.setItem("admin_password", newPassword);
    setAdminPassword(newPassword);
    toast.success("Parola a fost schimbată cu succes!");
    setIsSettingsOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md admin-glass-card relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 border border-brass/40 rounded flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-brass" />
            </div>
            <CardTitle className="text-display-md text-foreground">
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
                  className="text-center text-lg tracking-[0.3em] h-12 bg-background border-border focus:border-brass/60"
                  autoFocus
                />
                {error && (
                  <p className="text-destructive text-sm mt-3 text-center">{error}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-brass text-primary-foreground hover:bg-brass-dark font-semibold"
              >
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
      <div className="admin-theme min-h-screen flex w-full bg-background">

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
          <main className="flex-1 p-4 md:p-8 overflow-auto bg-background">
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
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-24">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
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
