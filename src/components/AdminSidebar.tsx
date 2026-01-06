import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Upload,
  CreditCard,
  Share2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Users,
  CalendarCheck,
  Euro,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Sparkles,
  UserCheck,
  ScrollText,
  Package,
  Smartphone,
  History,
  Hotel,
  Chrome,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Proprietăți", url: "/admin/proprietati", icon: Home },
  { title: "Complexe", url: "/admin/complexe", icon: Layers },
  { title: "Regim Hotelier", url: "/admin/regim-hotelier", icon: Hotel },
  { title: "Comisioane", url: "/admin/comisioane", icon: Euro },
  { title: "Vizionări", url: "/admin/vizionari", icon: CalendarCheck },
  { title: "Clienți CRM", url: "/admin/clienti", icon: UserCheck },
  { title: "Utilizatori", url: "/admin/utilizatori", icon: Users },
  { title: "Contracte", url: "/admin/contracte", icon: ScrollText },
  { title: "Inventar", url: "/admin/inventar-presetat", icon: Package },
  { title: "Virtual Staging", url: "/admin/virtual-staging", icon: Sparkles },
  { title: "Import XML", url: "/admin/import", icon: Upload },
  { title: "Rapoarte", url: "/admin/rapoarte", icon: FileText },
  { title: "Istoric", url: "/admin/istoric", icon: History },
  { title: "Cărți Vizită", url: "/admin/carti-vizita", icon: CreditCard },
  { title: "Facebook", url: "/admin/facebook", icon: Share2 },
  { title: "Setări", url: "/admin/setari", icon: Settings },
  { title: "Instalează App", url: "/admin/instaleaza", icon: Smartphone },
  { title: "Extensie Chrome", url: "/admin/extensie-chrome", icon: Chrome },
];

interface AdminSidebarProps {
  isMobileSheet?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ isMobileSheet, onNavigate }: AdminSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = !isMobileSheet && state === "collapsed";

  const getNavCls = (isActive: boolean) =>
    isActive
      ? "bg-gold/20 text-gold hover:bg-gold/30"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  // For mobile sheet, render a simpler version with better scrolling
  if (isMobileSheet) {
    return (
      <nav className="flex-1 overflow-y-auto overscroll-contain p-2 pb-8">
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = item.exact
              ? currentPath === item.url
              : currentPath.startsWith(item.url);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.exact}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation active:scale-[0.98] ${getNavCls(isActive)}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </div>
        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    );
  }

  return (
    <Sidebar 
      className={`
        ${collapsed ? "w-14" : "w-64"} 
        bg-background/95 border-r border-gold/10
        transition-all duration-200 shrink-0
        hidden md:flex
      `} 
      collapsible="icon"
    >
      <SidebarContent className="bg-background/95 h-full">
        <div className="p-2 border-b border-border/40 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center hover:bg-gold/10 hover:text-gold"
            title={collapsed ? "Extinde sidebar" : "Restrânge sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <SidebarGroup className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
          <SidebarGroupLabel className={collapsed ? "justify-center" : ""}>
            {!collapsed && "Administrare"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = item.exact
                  ? currentPath === item.url
                  : currentPath.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.exact}
                        className={getNavCls(isActive)}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
