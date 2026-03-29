import { Outlet, NavLink, useLocation } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Home, Users, UserCheck, Zap, Calendar, FileText, Package, Wrench, TicketCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

const rentalMenuItems = [
  { title: "Dashboard", url: "/admin/gestiune-chirii", icon: LayoutDashboard, exact: true },
  { title: "Proprietăți", url: "/admin/gestiune-chirii/proprietati", icon: Home },
  { title: "Proprietari", url: "/admin/gestiune-chirii/proprietari", icon: Users },
  { title: "Chiriași", url: "/admin/gestiune-chirii/chiriasi", icon: UserCheck },
  { title: "Utilități", url: "/admin/gestiune-chirii/utilitati", icon: Zap },
  { title: "Calendar", url: "/admin/gestiune-chirii/calendar", icon: Calendar },
  { title: "Raport", url: "/admin/gestiune-chirii/raport", icon: FileText },
  { title: "Inventar", url: "/admin/gestiune-chirii/inventar", icon: Package },
  { title: "Servicii", url: "/admin/gestiune-chirii/servicii", icon: Wrench },
  { title: "Tichete", url: "/admin/gestiune-chirii/tichete", icon: TicketCheck },
];

const RentalLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  const getNavCls = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-gradient-to-r from-gold/15 to-gold/5 text-gold"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/admin">
            <Button variant="ghost" size="sm" className="hover:bg-gold/10 hover:text-gold">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </NavLink>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5">
              <Home className="h-5 w-5 text-gold" />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Gestiune Chirii
            </h1>
          </div>
        </div>
        <NavLink to="/admin/gestiune-chirii/proprietati/adauga">
          <Button size="sm" className="bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold">
            <Plus className="h-4 w-4 mr-1" />
            {!isMobile && "Adaugă Proprietate"}
          </Button>
        </NavLink>
      </div>

      <div className={cn("flex gap-6", isMobile && "flex-col")}>
        {/* Sidebar Navigation */}
        {isMobile ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {rentalMenuItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.url
                : location.pathname.startsWith(item.url) && !item.exact;
              return (
                <NavLink key={item.url} to={item.url} end={item.exact}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "shrink-0 text-xs",
                      isActive && "bg-gold text-gold-foreground hover:bg-gold/90"
                    )}
                  >
                    <item.icon className="h-3 w-3 mr-1" />
                    {item.title}
                  </Button>
                </NavLink>
              );
            })}
          </div>
        ) : (
          <div className="w-52 shrink-0">
            <nav className="admin-glass-card rounded-xl p-2 space-y-1 sticky top-4">
              {rentalMenuItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url) && !item.exact;
                return (
                  <NavLink key={item.url} to={item.url} end={item.exact}>
                    <div className={getNavCls(isActive)}>
                      <item.icon className={cn("h-4 w-4", isActive && "text-gold")} />
                      <span>{item.title}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default RentalLayout;
