import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Building2,
  Upload,
  CreditCard,
  Share2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Layers,
  Users,
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
  { title: "Proprietăți", url: "/admin", icon: Home, exact: true },
  { title: "Complexe", url: "/admin/complexe", icon: Layers },
  { title: "Utilizatori", url: "/admin/utilizatori", icon: Users },
  { title: "Import XML", url: "/admin/import", icon: Upload },
  { title: "Cărți de Vizită", url: "/admin/carti-vizita", icon: CreditCard },
  { title: "Facebook", url: "/admin/facebook", icon: Share2 },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const getNavCls = (isActive: boolean) =>
    isActive
      ? "bg-gold/20 text-gold hover:bg-gold/30"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-64"} bg-background/95 border-r border-gold/10`} collapsible="icon">
      <SidebarContent className="bg-background/95">
        {/* Toggle button at top */}
        <div className="p-2 border-b border-border/40">
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

        <SidebarGroup>
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

        {/* Logout button at bottom */}
        <div className="mt-auto p-4">
          <Button
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            onClick={onLogout}
            className="w-full border-gold/30 hover:bg-gold/10 hover:border-gold/50"
            title="Deconectare"
          >
            <Lock className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Deconectare</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
