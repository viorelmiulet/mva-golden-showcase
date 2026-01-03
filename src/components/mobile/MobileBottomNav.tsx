import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { favorites } = useFavorites();
  const { language } = useLanguage();

  const navItems = [
    { path: "/app", icon: Home, label: language === 'ro' ? "Acasă" : "Home" },
    { path: "/app/cauta", icon: Search, label: language === 'ro' ? "Caută" : "Search" },
    { path: "/app/complexe", icon: Building2, label: language === 'ro' ? "Complexe" : "Complexes" },
    { path: "/app/favorite", icon: Heart, label: language === 'ro' ? "Favorite" : "Favorites", badge: favorites.length },
    { path: "/app/cont", icon: User, label: language === 'ro' ? "Cont" : "Account" },
  ];

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative transition-colors py-2",
                active ? "text-gold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-gold text-background text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1",
                active ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gold rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
