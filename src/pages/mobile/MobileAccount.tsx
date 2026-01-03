import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MobileHeader from "@/components/mobile/MobileHeader";
import { LanguageToggle } from "@/components/LanguageToggle";
import { 
  User, 
  Heart, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Phone, 
  Mail,
  Globe,
  Info,
  FileText
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const MobileAccount = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(language === 'ro' ? 'Te-ai deconectat cu succes' : 'Successfully logged out');
    navigate('/app');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <MobileHeader title={language === 'ro' ? 'Contul meu' : 'My Account'} />
        <div className="pt-14 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-gold">
            {language === 'ro' ? 'Se încarcă...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <MobileHeader title={language === 'ro' ? 'Contul meu' : 'My Account'} />
        <div className="pt-14 px-4 pb-4">
          {/* Login prompt */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ro' ? 'Bine ai venit!' : 'Welcome!'}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              {language === 'ro' 
                ? 'Autentifică-te pentru a salva proprietăți favorite și a primi notificări personalizate'
                : 'Sign in to save favorite properties and receive personalized notifications'}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link to="/auth">
                <Button variant="luxury" className="w-full">
                  {language === 'ro' ? 'Autentificare' : 'Sign In'}
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  {language === 'ro' ? 'Creează cont' : 'Create Account'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Settings without account */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {language === 'ro' ? 'Setări' : 'Settings'}
            </h3>
            <Card>
              <CardContent className="p-0 divide-y divide-border/50">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">
                      {language === 'ro' ? 'Limbă' : 'Language'}
                    </span>
                  </div>
                  <LanguageToggle />
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <h3 className="text-sm font-medium text-muted-foreground px-1 pt-4">
              {language === 'ro' ? 'Contact' : 'Contact'}
            </h3>
            <Card>
              <CardContent className="p-0 divide-y divide-border/50">
                <a href="tel:0767941512" className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">0767 941 512</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="mailto:contact@mvaimobiliare.ro" className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">contact@mvaimobiliare.ro</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Logged in user view
  return (
    <div className="min-h-screen">
      <MobileHeader title={language === 'ro' ? 'Contul meu' : 'My Account'} />
      
      <div className="pt-14 px-4 pb-4">
        {/* User profile card */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gold/10 text-gold text-xl">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu items */}
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              <Link to="/app/favorite" className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{language === 'ro' ? 'Favorite' : 'Favorites'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          <h3 className="text-sm font-medium text-muted-foreground px-1 pt-2">
            {language === 'ro' ? 'Setări' : 'Settings'}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{language === 'ro' ? 'Limbă' : 'Language'}</span>
                </div>
                <LanguageToggle />
              </div>
            </CardContent>
          </Card>

          <h3 className="text-sm font-medium text-muted-foreground px-1 pt-2">
            {language === 'ro' ? 'Contact' : 'Contact'}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              <a href="tel:0767941512" className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">0767 941 512</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a href="mailto:contact@mvaimobiliare.ro" className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">contact@mvaimobiliare.ro</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button 
            variant="outline" 
            className="w-full mt-6 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {language === 'ro' ? 'Deconectare' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileAccount;
