import { NavLink, useLocation } from "@/lib/router-compat";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Building2,
  Building,
  CalendarCheck,
  Sofa,
  Stamp,
  Eye,
  Users,
  Euro,
  FileSignature,
  Package,
  FileText,
  Newspaper,
  Sparkles,
  Facebook,
  CreditCard,
  PhoneCall,
  ChartNoAxesCombined,
  RefreshCw,
  Database,
  MailWarning,
  Settings,
  Plug,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Item = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

type Section = { label: string; items: Item[]; collapsible?: boolean };

const sections: Section[] = [
  {
    label: "Panou",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
      { title: "Inbox", url: "/admin/inbox", icon: Inbox },
    ],
  },
  {
    label: "Proprietăți",
    items: [
      { title: "Proprietăți", url: "/admin/proprietati", icon: Building2 },
      { title: "Ansambluri Rezidențiale", url: "/admin/complexe", icon: Building },
      { title: "Vizionări", url: "/admin/vizionari", icon: CalendarCheck },
      { title: "Vizualizări Proprietăți", url: "/admin/vizualizari-proprietati", icon: Eye },
      { title: "Virtual Staging", url: "/admin/virtual-staging", icon: Sofa },
      { title: "Watermark", url: "/admin/watermark", icon: Stamp },
    ],
  },
  {
    label: "Clienți & Vânzări",
    items: [
      { title: "Clienți / Lead-uri", url: "/admin/clienti", icon: Users },
      { title: "Comisioane", url: "/admin/comisioane", icon: Euro },
      { title: "Contracte", url: "/admin/contracte", icon: FileSignature },
      { title: "Gestiune Chirii", url: "/admin/gestiune-chirii", icon: Package },
    ],
  },
  {
    label: "Marketing",
    collapsible: true,
    items: [
      { title: "Blog", url: "/admin/blog", icon: FileText },
      { title: "News", url: "/admin/news", icon: Newspaper },
      { title: "Marketing AI", url: "/admin/marketing-ai", icon: Sparkles },
      { title: "Coadă Facebook", url: "/admin/facebook-queue", icon: Facebook },
      { title: "Grupuri Facebook", url: "/admin/facebook-groups", icon: Facebook },
      { title: "Cărți Vizită", url: "/admin/carti-vizita", icon: CreditCard },
    ],
  },
  {
    label: "Instrumente",
    collapsible: true,
    items: [
      { title: "Agent Vocal AI", url: "/admin/agent-vocal", icon: PhoneCall },
      { title: "Rapoarte", url: "/admin/rapoarte", icon: ChartNoAxesCombined },
      { title: "ImmoFlux Sync", url: "/admin/immoflux", icon: RefreshCw },
      { title: "Coduri ImmoFlux", url: "/admin/immoflux-codes", icon: Database },
      { title: "Monitorizare Email", url: "/admin/monitorizare-email", icon: MailWarning },
    ],
  },
  {
    label: "Administrare",
    collapsible: true,
    items: [{ title: "Setări", url: "/admin/setari", icon: Settings }],
  },
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
  const { playNotificationSound } = useNotificationSound();
  const { requestPermission, showNewEmailNotification, permission } = useBrowserNotifications();
  const notifiedEmailIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const hasRequestedPermissionRef = useRef(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const { data: unreadEmails = [] } = useQuery({
    queryKey: ["unread-emails-for-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("received_emails")
        .select("id, sender, subject")
        .eq("is_read", false)
        .eq("is_archived", false)
        .order("received_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (permission === "default" && !hasRequestedPermissionRef.current) {
      const handleInteraction = () => {
        hasRequestedPermissionRef.current = true;
        requestPermission();
        document.removeEventListener("click", handleInteraction);
      };
      document.addEventListener("click", handleInteraction);
      return () => document.removeEventListener("click", handleInteraction);
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      unreadEmails.forEach((email) => notifiedEmailIdsRef.current.add(email.id));
      isInitialLoadRef.current = false;
      return;
    }

    const newEmails = unreadEmails.filter((email) => !notifiedEmailIdsRef.current.has(email.id));

    if (newEmails.length > 0) {
      newEmails.forEach((email) => notifiedEmailIdsRef.current.add(email.id));
      playNotificationSound();
      showNewEmailNotification(newEmails.map((e) => ({ sender: e.sender, subject: e.subject })));
    }

    const currentUnreadIds = new Set(unreadEmails.map((e) => e.id));
    notifiedEmailIdsRef.current.forEach((id) => {
      if (!currentUnreadIds.has(id)) {
        notifiedEmailIdsRef.current.delete(id);
      }
    });
  }, [unreadEmails, playNotificationSound, showNewEmailNotification]);

  const unreadCount = unreadEmails.length;

  const isItemActive = (item: Item) =>
    item.exact ? currentPath === item.url : currentPath.startsWith(item.url);

  const renderItem = (item: Item) => {
    const active = isItemActive(item);
    const showBadge = item.title === "Inbox" && unreadCount > 0;

    const link = (
      <NavLink
        to={item.url}
        end={item.exact}
        onClick={onNavigate}
        title={collapsed ? item.title : undefined}
        className={[
          "group relative flex items-center rounded-md text-[13px] font-medium transition-colors duration-200",
          collapsed ? "justify-center h-10 w-10 mx-auto" : isMobileSheet ? "gap-3 px-3 py-3 min-h-[48px] text-sm" : "gap-3 px-3 py-2",
          active
            ? "bg-graphite text-paper"
            : "text-paper/65 hover:text-paper hover:bg-graphite/70",
        ].join(" ")}
      >
        {active && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brass" />
        )}
        <span className="relative flex items-center justify-center">
          <item.icon
            className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brass" : "text-paper/60 group-hover:text-paper"}`}
          />
          {showBadge && collapsed && (
            <span className="absolute -top-1.5 -right-1.5 h-2 w-2 rounded-full bg-brass" />
          )}
        </span>
        {!collapsed && <span className="truncate">{item.title}</span>}
        {!collapsed && showBadge && (
          <Badge className="ml-auto h-5 min-w-5 justify-center border-0 bg-brass px-1.5 text-[10px] font-semibold text-ink">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </NavLink>
    );

    if (!collapsed) return <div key={item.title}>{link}</div>;

    return (
      <Tooltip key={item.title} delayDuration={80}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  };

  const nav = (
    <TooltipProvider>
      <div className={`space-y-5 ${collapsed ? "px-2" : "px-3"} py-4`}>
        {sections.map((section) => {
          const hasActive = section.items.some(isItemActive);
          const isOpen = collapsed || !section.collapsible || (openSections[section.label] ?? hasActive);
          return (
            <div key={section.label} className="space-y-1">
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-paper/10" />
              ) : section.collapsible ? (
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections((prev) => ({
                      ...prev,
                      [section.label]: !(prev[section.label] ?? hasActive),
                    }))
                  }
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35 transition-colors hover:text-paper/70"
                >
                  <span>{section.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">
                  {section.label}
                </p>
              )}
              {isOpen && section.items.map(renderItem)}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );

  if (isMobileSheet) {
    return (
      <nav className="admin-sidebar-modern flex-1 overflow-y-auto overscroll-contain pb-8">
        {nav}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    );
  }

  return (
    <Sidebar
      className={`${collapsed ? "w-[72px]" : "w-[252px]"} admin-sidebar-modern hidden shrink-0 flex-col transition-[width] duration-300 ease-out md:flex`}
      collapsible="icon"
    >
      <SidebarContent className="h-full bg-transparent">
        <div
          className={`flex h-16 shrink-0 items-center border-b border-paper/10 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}
        >
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-[15px] leading-tight text-paper">MVA</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-brass">Imobiliare</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md text-paper/60 hover:bg-graphite hover:text-brass"
            title={collapsed ? "Extinde meniul" : "Restrânge meniul"}
            aria-label={collapsed ? "Extinde meniul" : "Restrânge meniul"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {nav}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
