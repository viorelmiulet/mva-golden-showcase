import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/app", icon: Home, label: t.mobile?.home || "Acasă" },
    { path: "/app/cauta", icon: Search, label: t.mobile?.search || "Caută" },
    { path: "/app/complexe", icon: Building2, label: t.mobile?.complexes || "Complexe" },
    { path: "/app/cont", icon: User, label: t.mobile?.account || "Cont" },
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