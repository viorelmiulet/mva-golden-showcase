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
  Euro,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Sparkles,
  ScrollText,
  Package,
  Hotel,
  Chrome,
  Stamp,
  Inbox,
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
  { title: "Inbox", url: "/admin/inbox", icon: Inbox },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Proprietăți", url: "/admin/proprietati", icon: Home },
  { title: "Complexe", url: "/admin/complexe", icon: Layers },
  { title: "Regim Hotelier", url: "/admin/regim-hotelier", icon: Hotel },
  { title: "Comisioane", url: "/admin/comisioane", icon: Euro },
  { title: "Utilizatori", url: "/admin/utilizatori", icon: Users },
  { title: "Contracte", url: "/admin/contracte", icon: ScrollText },
  { title: "Inventar", url: "/admin/inventar-presetat", icon: Package },
  { title: "Virtual Staging", url: "/admin/virtual-staging", icon: Sparkles },
  { title: "Watermark", url: "/admin/watermark", icon: Stamp },
  { title: "Import XML", url: "/admin/import", icon: Upload },
  { title: "Rapoarte", url: "/admin/rapoarte", icon: FileText },
  { title: "Cărți Vizită", url: "/admin/carti-vizita", icon: CreditCard },
  { title: "Facebook", url: "/admin/facebook", icon: Share2 },
  { title: "Setări", url: "/admin/setari", icon: Settings },
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
      ? "bg-gradient-to-r from-gold/15 to-gold/5 text-gold border-l-2 border-gold pl-[10px]"
      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-2 border-transparent pl-[10px]";

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  // For mobile sheet, render a simpler version with better scrolling
  if (isMobileSheet) {
    return (
      <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-8 admin-sidebar-modern">
        <div className="space-y-1">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation active:scale-[0.98] ${getNavCls(isActive)}`}
              >
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-gold/20' : 'bg-white/5'}`}>
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-gold' : ''}`} />
                </div>
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
        ${collapsed ? "w-16" : "w-64"} 
        admin-sidebar-modern
        transition-all duration-300 ease-out shrink-0
        hidden md:flex
      `} 
      collapsible="icon"
    >
      <SidebarContent className="h-full bg-transparent">
        {/* Logo/Toggle Area */}
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                <Layers className="h-4 w-4 text-gold" />
              </div>
              <span className="font-semibold text-sm bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                MVA Admin
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`h-8 w-8 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-gold transition-colors ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? "Extinde sidebar" : "Restrânge sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <SidebarGroup className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] py-4 px-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2 px-3">
              Meniu Principal
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                          transition-all duration-200 group
                          ${isActive 
                            ? 'bg-gradient-to-r from-gold/15 to-transparent text-gold border-l-2 border-gold ml-0' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-2 border-transparent'
                          }
                          ${collapsed ? 'justify-center px-0' : ''}
                        `}
                        title={collapsed ? item.title : undefined}
                      >
                        <div className={`
                          p-1.5 rounded-md transition-colors
                          ${isActive ? 'bg-gold/20' : 'bg-white/5 group-hover:bg-white/10'}
                        `}>
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-gold' : 'group-hover:text-foreground'}`} />
                        </div>
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-white/5">
            <div className="text-[10px] text-muted-foreground/50 text-center">
              © 2024 MVA Imobiliare
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
