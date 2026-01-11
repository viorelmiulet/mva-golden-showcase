import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Upload,
  CreditCard,
  Share2,
  ChevronLeft,
  ChevronRight,
  Layers,
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

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
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Inbox", url: "/admin/inbox", icon: Inbox },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Proprietăți", url: "/admin/proprietati", icon: Home },
  { title: "Complexe", url: "/admin/complexe", icon: Layers },
  { title: "Regim Hotelier", url: "/admin/regim-hotelier", icon: Hotel },
  { title: "Comisioane", url: "/admin/comisioane", icon: Euro },
  
  { title: "Contracte", url: "/admin/contracte", icon: ScrollText },
  { title: "Virtual Staging", url: "/admin/virtual-staging", icon: Sparkles },
  { title: "Watermark", url: "/admin/watermark", icon: Stamp },
  { title: "Rapoarte", url: "/admin/rapoarte", icon: FileText },
  { title: "Cărți Vizită", url: "/admin/carti-vizita", icon: CreditCard },
  { title: "Marketing AI", url: "/admin/marketing-ai", icon: Sparkles },
  { title: "Setări", url: "/admin/setari", icon: Settings },
  { title: "Extensie Chrome", url: "/admin/extensie-chrome", icon: Chrome },
];

// Animation variants
const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const iconHoverVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.15, 
    rotate: [0, -5, 5, 0],
    transition: { 
      rotate: { duration: 0.4 },
      scale: { type: "spring" as const, stiffness: 400, damping: 17 }
    }
  },
};

interface AdminSidebarProps {
  isMobileSheet?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ isMobileSheet, onNavigate }: AdminSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = !isMobileSheet && state === "collapsed";
  const { playNotificationSound } = useNotificationSound();
  const { requestPermission, showNewEmailNotification, permission } = useBrowserNotifications();
  const notifiedEmailIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const hasRequestedPermissionRef = useRef(false);

  // Fetch unread emails with IDs to track which ones we've notified about
  const { data: unreadEmails = [] } = useQuery({
    queryKey: ['unread-emails-for-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('received_emails')
        .select('id, sender, subject')
        .eq('is_read', false)
        .eq('is_archived', false)
        .order('received_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure refetch on invalidation
  });

  // Request notification permission on first user interaction
  useEffect(() => {
    if (permission === 'default' && !hasRequestedPermissionRef.current) {
      const handleInteraction = () => {
        hasRequestedPermissionRef.current = true;
        requestPermission();
        document.removeEventListener('click', handleInteraction);
      };
      document.addEventListener('click', handleInteraction);
      return () => document.removeEventListener('click', handleInteraction);
    }
  }, [permission, requestPermission]);

  // Play notification sound and show browser notification only for truly new emails
  useEffect(() => {
    // Skip the first render (initial load) - just record existing emails
    if (isInitialLoadRef.current) {
      unreadEmails.forEach(email => notifiedEmailIdsRef.current.add(email.id));
      isInitialLoadRef.current = false;
      return;
    }

    // Find emails we haven't notified about yet
    const newEmails = unreadEmails.filter(email => !notifiedEmailIdsRef.current.has(email.id));
    
    if (newEmails.length > 0) {
      // Mark these as notified
      newEmails.forEach(email => notifiedEmailIdsRef.current.add(email.id));
      
      // Play sound and show notification
      playNotificationSound();
      showNewEmailNotification(newEmails.map(e => ({ sender: e.sender, subject: e.subject })));
    }

    // Clean up notified IDs that are no longer in unread list (they were read/archived)
    const currentUnreadIds = new Set(unreadEmails.map(e => e.id));
    notifiedEmailIdsRef.current.forEach(id => {
      if (!currentUnreadIds.has(id)) {
        notifiedEmailIdsRef.current.delete(id);
      }
    });
  }, [unreadEmails, playNotificationSound, showNewEmailNotification]);

  // Derive unread count from the emails data
  const unreadCount = unreadEmails.length;

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
        <motion.div 
          className="space-y-1"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
          {menuItems.map((item, index) => {
            const isActive = item.exact
              ? currentPath === item.url
              : currentPath.startsWith(item.url);
            const showBadge = item.title === "Inbox" && unreadCount > 0;
            return (
              <motion.div
                key={item.title}
                variants={menuItemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <NavLink
                  to={item.url}
                  end={item.exact}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${getNavCls(isActive)}`}
                >
                  <div className="relative">
                    <motion.div 
                      className={`p-1.5 rounded-md ${isActive ? 'bg-gold/20' : 'bg-white/5'}`}
                      variants={iconHoverVariants}
                      initial="rest"
                      whileHover="hover"
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-gold' : ''}`} />
                    </motion.div>
                    {showBadge && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] bg-gold text-black border-0 flex items-center justify-center"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  <span>{item.title}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </motion.div>
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
        hidden md:flex flex-col
      `} 
      collapsible="icon"
    >
      <SidebarContent className="h-full bg-transparent">
        {/* Logo/Toggle Area */}
        <div className={`p-3 border-b border-white/5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Layers className="h-4 w-4 text-gold" />
              </motion.div>
              <span className="font-semibold text-sm bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                MVA Admin
              </span>
            </motion.div>
          )}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-gold transition-colors"
              title={collapsed ? "Extinde sidebar" : "Restrânge sidebar"}
            >
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </motion.div>
            </Button>
          </motion.div>
        </div>

        <SidebarGroup className={`flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] py-4 ${collapsed ? 'px-1' : 'px-2'}`}>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2 px-3">
              Meniu Principal
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <motion.div
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
              >
                {menuItems.map((item, index) => {
                  const isActive = item.exact
                    ? currentPath === item.url
                    : currentPath.startsWith(item.url);
                  const showBadge = item.title === "Inbox" && unreadCount > 0;
                  return (
                    <motion.div
                      key={item.title}
                      variants={menuItemVariants}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <motion.div
                            whileHover={{ x: collapsed ? 0 : 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <NavLink
                              to={item.url}
                              end={item.exact}
                              className={`
                                flex items-center rounded-lg text-sm font-medium
                                transition-all duration-200 group
                                ${collapsed 
                                  ? 'justify-center p-2 mx-auto w-10 h-10' 
                                  : 'gap-3 px-3 py-2'
                                }
                                ${isActive 
                                  ? collapsed 
                                    ? 'bg-gold/20 text-gold' 
                                    : 'bg-gradient-to-r from-gold/15 to-transparent text-gold border-l-2 border-gold' 
                                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-2 border-transparent'
                                }
                                ${collapsed ? '' : 'ml-0'}
                              `}
                              title={collapsed ? item.title : undefined}
                            >
                              <div className="relative">
                                <motion.div 
                                  className={`
                                    ${collapsed ? '' : 'p-1.5'} rounded-md transition-colors
                                    ${isActive && !collapsed ? 'bg-gold/20' : !collapsed ? 'bg-white/5 group-hover:bg-white/10' : ''}
                                  `}
                                  variants={iconHoverVariants}
                                  initial="rest"
                                  whileHover="hover"
                                >
                                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-gold' : 'group-hover:text-foreground'}`} />
                                </motion.div>
                                {showBadge && (
                                  <Badge 
                                    className={`absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] bg-gold text-black border-0 flex items-center justify-center ${collapsed ? '-top-1 -right-1 h-3.5 min-w-3.5 text-[9px]' : ''}`}
                                  >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </Badge>
                                )}
                              </div>
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </motion.div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  );
                })}
              </motion.div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!collapsed && (
          <motion.div 
            className="p-3 border-t border-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-[10px] text-muted-foreground/50 text-center">
              © 2024 MVA Imobiliare
            </div>
          </motion.div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
