// Dashboard Page - Admin Panel
import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, AnimatedSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, CalendarCheck, Euro, TrendingUp, TrendingDown,
  Home, Clock, CheckCircle, XCircle, Users, Target, DollarSign,
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, Percent,
  Layers, Plus, FileSpreadsheet, Coins, ArrowRight, Mail,
  MailOpen, Calendar, RefreshCw, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays, startOfYear, subYears, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ro } from "date-fns/locale";
import { motion, useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";

const COLORS = ['hsl(45, 100%, 58%)', 'hsl(152, 69%, 53%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(258, 90%, 66%)'];

type PeriodFilter = '7d' | '30d' | 'month' | 'year';

const DashboardPage = () => {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const reduceMotion = shouldReduceMotion || isMobile;
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    date: string;
    totalEUR: number;
    totalRON: number;
    transactions: { amount: number; currency: string; type: string }[];
  } | null>(null);

  const periodRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case '7d': return { start: subDays(now, 7), end: now, label: 'Ultimele 7 zile' };
      case '30d': return { start: subDays(now, 30), end: now, label: 'Ultimele 30 zile' };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: ro }) };
      case 'year': return { start: startOfYear(now), end: now, label: format(now, 'yyyy') };
    }
  }, [period]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile,
  });

  const handleSparklineClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const payload = data.activePayload[0].payload;
      setSelectedDayDetails({
        date: payload.fullDate,
        totalEUR: payload.value || 0,
        totalRON: payload.valueRON || 0,
        transactions: payload.transactions || []
      });
    }
  };

  // Fetch properties
  const { data: propertiesData, isLoading: loadingProperties } = useQuery({
    queryKey: ['dashboard', 'properties'],
    queryFn: async () => {
      const { data: properties, error } = await supabase
        .from('catalog_offers')
        .select('id, availability_status, project_id, rooms, price_min, created_at, transaction_type')
        .is('project_id', null);
      if (error) throw error;
      const total = properties?.length || 0;
      const available = properties?.filter(p => p.availability_status === 'available').length || 0;
      const sold = properties?.filter(p => p.availability_status === 'sold').length || 0;
      const reserved = properties?.filter(p => p.availability_status === 'reserved').length || 0;
      const pricesEUR = properties?.filter(p => p.price_min && p.price_min > 0).map(p => p.price_min!) || [];
      const avgPrice = pricesEUR.length > 0 ? Math.round(pricesEUR.reduce((a, b) => a + b, 0) / pricesEUR.length) : 0;
      const minPrice = pricesEUR.length > 0 ? Math.min(...pricesEUR) : 0;
      const maxPrice = pricesEUR.length > 0 ? Math.max(...pricesEUR) : 0;
      const thisMonth = startOfMonth(new Date());
      const newThisMonth = properties?.filter(p => p.created_at && parseISO(p.created_at) >= thisMonth).length || 0;
      return { total, available, sold, reserved, avgPrice, minPrice, maxPrice, newThisMonth };
    }
  });

  // Fetch complexes
  const { data: complexesData, isLoading: loadingComplexes } = useQuery({
    queryKey: ['dashboard', 'complexes'],
    queryFn: async () => {
      const { data: projects, error: projectsError } = await supabase.from('real_estate_projects').select('id, name, status');
      if (projectsError) throw projectsError;
      const { data: apartments, error: apartmentsError } = await supabase.from('catalog_offers')
        .select('id, project_id, availability_status, price_min, rooms').not('project_id', 'is', null);
      if (apartmentsError) throw apartmentsError;
      const totalProjects = projects?.length || 0;
      const totalApartments = apartments?.length || 0;
      const availableApartments = apartments?.filter(a => a.availability_status === 'available').length || 0;
      const soldApartments = apartments?.filter(a => a.availability_status === 'sold').length || 0;
      const complexBreakdown = projects?.map(project => {
        const projectApts = apartments?.filter(a => a.project_id === project.id) || [];
        return {
          name: project.name,
          total: projectApts.length,
          available: projectApts.filter(a => a.availability_status === 'available').length,
          sold: projectApts.filter(a => a.availability_status === 'sold').length,
          reserved: projectApts.filter(a => a.availability_status === 'reserved').length,
        };
      }).sort((a, b) => b.total - a.total).slice(0, 6) || [];
      const overallSalesRate = totalApartments > 0 ? Math.round((soldApartments / totalApartments) * 100) : 0;
      return { totalProjects, totalApartments, availableApartments, soldApartments, complexBreakdown, overallSalesRate };
    }
  });

  // Fetch viewings
  const { data: viewingsData, isLoading: loadingViewings } = useQuery({
    queryKey: ['dashboard', 'viewings'],
    queryFn: async () => {
      const result = await adminApi.select<{ status: string; created_at: string; preferred_date: string }>('viewing_appointments', { orderBy: 'created_at', ascending: true });
      if (!result.success) throw new Error(result.error);
      const data = result.data || [];
      const pending = data.filter(v => v.status === 'pending').length;
      const confirmed = data.filter(v => v.status === 'confirmed').length;
      const completed = data.filter(v => v.status === 'completed').length;
      const total = data.length;
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthCount = data.filter(v => v.created_at && parseISO(v.created_at) >= thisMonthStart).length;
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const lastMonthCount = data.filter(v => {
        if (!v.created_at) return false;
        const date = parseISO(v.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).length;
      const monthlyGrowth = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0;
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const monthData = data.filter(v => {
          if (!v.created_at) return false;
          const date = parseISO(v.created_at);
          return date >= mStart && date <= mEnd;
        });
        monthlyTrend.push({
          month: format(monthDate, 'MMM', { locale: ro }),
          total: monthData.length,
          completed: monthData.filter(v => v.status === 'completed').length,
        });
      }
      return { total, pending, confirmed, completed, thisMonthCount, monthlyGrowth, monthlyTrend };
    }
  });

  // Fetch commissions
  const { data: commissionsData, isLoading: loadingCommissions } = useQuery({
    queryKey: ['dashboard', 'commissions'],
    queryFn: async () => {
      const result = await adminApi.select<{ amount: number; currency: string; date: string; transaction_type: string; invoice_number: string | null }>('commissions', { orderBy: 'date', ascending: true });
      if (!result.success) throw new Error(result.error);
      const data = result.data || [];
      const now = new Date();
      const totalEUR = data.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const totalRON = data.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const currentMonthData = data.filter(c => { const d = parseISO(c.date); return d >= monthStart && d <= monthEnd; });
      const lastMonthData = data.filter(c => { const d = parseISO(c.date); return d >= lastMonthStart && d <= lastMonthEnd; });
      const currentMonthEUR = currentMonthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const currentMonthRON = currentMonthData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      const lastMonthEUR = lastMonthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const monthlyGrowth = lastMonthEUR > 0 ? Math.round(((currentMonthEUR - lastMonthEUR) / lastMonthEUR) * 100) : 0;
      // Daily trend current month
      const daysInMonth = differenceInDays(now, monthStart) + 1;
      const currentMonthDailyTrend = [];
      for (let i = 0; i < daysInMonth; i++) {
        const day = subDays(now, daysInMonth - 1 - i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = data.filter(c => c.date === dayStr);
        currentMonthDailyTrend.push({
          day: format(day, 'dd'),
          fullDate: dayStr,
          value: dayData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0),
          valueRON: dayData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0),
          transactions: dayData.map(c => ({ amount: Number(c.amount), currency: c.currency, type: c.transaction_type }))
        });
      }
      // YTD
      const yearStart = startOfYear(now);
      const ytdData = data.filter(c => parseISO(c.date) >= yearStart);
      const ytdEUR = ytdData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const ytdRON = ytdData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      // Daily average
      const daysSinceYearStart = differenceInDays(now, yearStart) + 1;
      const dailyAvgEUR = daysSinceYearStart > 0 ? Math.round(ytdEUR / daysSinceYearStart) : 0;
      const lastYearStart = startOfYear(subYears(now, 1));
      const lastYearSameDay = subYears(now, 1);
      const lastYearYtdData = data.filter(c => { const d = parseISO(c.date); return d >= lastYearStart && d <= lastYearSameDay; });
      const lastYearYtdEUR = lastYearYtdData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const lastYearDays = differenceInDays(lastYearSameDay, lastYearStart) + 1;
      const lastYearDailyAvgEUR = lastYearDays > 0 ? Math.round(lastYearYtdEUR / lastYearDays) : 0;
      const dailyAvgGrowth = lastYearDailyAvgEUR > 0 ? Math.round(((dailyAvgEUR - lastYearDailyAvgEUR) / lastYearDailyAvgEUR) * 100) : 0;
      // 30 day daily trend
      const dailyTrend30 = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = data.filter(c => c.date === dayStr);
        dailyTrend30.push({
          day: format(day, 'dd/MM'),
          fullDate: dayStr,
          value: dayData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0),
          valueRON: dayData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0),
          transactions: dayData.map(c => ({ amount: Number(c.amount), currency: c.currency, type: c.transaction_type }))
        });
      }
      // Monthly trend 12 months
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const monthData = data.filter(c => { const d = parseISO(c.date); return d >= mStart && d <= mEnd; });
        monthlyTrend.push({
          month: format(monthDate, 'MMM yy', { locale: ro }),
          EUR: monthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0),
          RON: monthData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0),
          count: monthData.length
        });
      }
      // Type distribution
      const typeDistribution = [
        { name: 'Vânzare', count: data.filter(c => c.transaction_type === 'vânzare').length, value: data.filter(c => c.transaction_type === 'vânzare').reduce((sum, c) => sum + (c.currency === 'EUR' ? Number(c.amount) : Number(c.amount) / 5), 0) },
        { name: 'Chirie', count: data.filter(c => c.transaction_type === 'chirie').length, value: data.filter(c => c.transaction_type === 'chirie').reduce((sum, c) => sum + (c.currency === 'EUR' ? Number(c.amount) : Number(c.amount) / 5), 0) },
        { name: 'Colaborare', count: data.filter(c => c.transaction_type === 'colaborare vânzare').length, value: data.filter(c => c.transaction_type === 'colaborare vânzare').reduce((sum, c) => sum + (c.currency === 'EUR' ? Number(c.amount) : Number(c.amount) / 5), 0) },
      ].filter(t => t.count > 0);
      const avgCommissionEUR = data.filter(c => c.currency === 'EUR').length;
      const avgEUR = avgCommissionEUR > 0 ? Math.round(totalEUR / avgCommissionEUR) : 0;
      const withInvoice = data.filter(c => (c.invoice_number || '').trim().toLowerCase() === 'da').length;
      const withoutInvoice = data.length - withInvoice;
      return { totalEUR, totalRON, currentMonthEUR, currentMonthRON, lastMonthEUR, monthlyGrowth, ytdEUR, ytdRON, avgEUR, dailyAvgEUR, dailyAvgGrowth, lastYearDailyAvgEUR, dailyTrend30, currentMonthDailyTrend, monthlyTrend, typeDistribution, count: data.length, withInvoice, withoutInvoice };
    }
  });

  // Fetch unread emails
  const { data: emailsData, isLoading: loadingEmails } = useQuery({
    queryKey: ['dashboard', 'emails'],
    queryFn: async () => {
      const result = await adminApi.select<{ is_read: boolean; is_deleted: boolean }>('received_emails');
      if (!result.success) throw new Error(result.error);
      const data = result.data || [];
      const nonDeleted = data.filter(e => !e.is_deleted);
      const unread = nonDeleted.filter(e => !e.is_read).length;
      return { unread, total: nonDeleted.length };
    }
  });

  // Fetch clients
  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['dashboard', 'clients'],
    queryFn: async () => {
      const result = await adminApi.select<{ id: string; created_at: string }>('clients');
      if (!result.success) throw new Error(result.error);
      const data = result.data || [];
      const total = data.length;
      const thisMonth = startOfMonth(new Date());
      const newThisMonth = data.filter(c => c.created_at && parseISO(c.created_at) >= thisMonth).length;
      return { total, newThisMonth };
    }
  });

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    color: 'hsl(var(--foreground))',
    fontSize: isMobile ? '10px' : '12px',
    boxShadow: '0 10px 40px -10px hsla(220, 30%, 4%, 0.5)'
  };

  return (
    <div ref={containerRef}>
      {isMobile && (
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />
      )}
      <motion.div 
        className="space-y-5 md:space-y-6"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold">Dashboard</h1>
              <p className="text-[11px] md:text-sm text-muted-foreground">Statistici în timp real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="h-8 text-xs w-[140px] bg-secondary/50 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimele 7 zile</SelectItem>
                <SelectItem value="30d">Ultimele 30 zile</SelectItem>
                <SelectItem value="month">Luna curentă</SelectItem>
                <SelectItem value="year">Anul curent</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-medium">Live</span>
            </div>
            <Badge variant="secondary" className="text-[10px] md:text-xs px-2.5 py-1 rounded-full bg-secondary/50 border-border/20">
              {format(new Date(), isMobile ? 'dd MMM' : 'dd MMMM yyyy', { locale: ro })}
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { to: '/admin/proprietati', icon: Plus, label: 'Proprietate', desc: 'Adaugă proprietate nouă', color: 'emerald' },
            { to: '/admin/import-xml', icon: FileSpreadsheet, label: 'Import', desc: 'Import din XML/Excel', color: 'blue' },
            { to: '/admin/comisioane', icon: Coins, label: 'Comisioane', desc: 'Gestionare venituri', color: 'gold' },
          ].map(({ to, icon: Icon, label, desc, color }) => (
            <Link 
              key={to}
              to={to} 
              className={`flex flex-col md:flex-row items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl border transition-all hover:shadow-lg group
                ${color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30' : ''}
                ${color === 'blue' ? 'bg-blue-500/5 border-blue-500/15 hover:border-blue-500/30' : ''}
                ${color === 'gold' ? 'bg-primary/5 border-primary/15 hover:border-primary/30' : ''}
              `}
            >
              <div className={`p-2 rounded-xl shadow-lg
                ${color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : ''}
                ${color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : ''}
                ${color === 'gold' ? 'bg-gradient-to-br from-primary to-yellow-600' : ''}
              `}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-center md:text-left flex-1">
                <p className="text-[11px] md:text-sm font-semibold">{label}</p>
                <p className="hidden md:block text-xs text-muted-foreground">{desc}</p>
              </div>
              <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {/* Properties */}
          <StatCard
            title="Proprietăți"
            value={propertiesData?.total || 0}
            subtitle={`${propertiesData?.available || 0} disponibile`}
            icon={Home}
            loading={loadingProperties}
            badge={propertiesData?.newThisMonth ? `+${propertiesData.newThisMonth}` : undefined}
          />
          {/* Complex Apartments */}
          <StatCard
            title="Apt. Complexe"
            value={complexesData?.totalApartments || 0}
            subtitle={`${complexesData?.totalProjects || 0} complexe`}
            icon={Building2}
            loading={loadingComplexes}
            trend={complexesData?.overallSalesRate ? { value: complexesData.overallSalesRate, positive: true, label: 'vândute' } : undefined}
          />
          {/* Monthly Commission */}
          <div className="admin-glass-card relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
            <div className="p-3 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Comisioane Lună</span>
                <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Euro className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                </div>
              </div>
              {loadingCommissions ? (
                <AnimatedSkeleton className="h-7 w-24" />
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold">{(commissionsData?.currentMonthEUR || 0).toLocaleString()} €</div>
                  {commissionsData?.currentMonthRON && !isMobile ? (
                    <p className="text-[10px] text-muted-foreground mt-1">+ {commissionsData.currentMonthRON.toLocaleString()} RON</p>
                  ) : null}
                  {commissionsData?.monthlyGrowth !== undefined && (
                    <TrendBadge value={commissionsData.monthlyGrowth} />
                  )}
                  {!isMobile && commissionsData?.currentMonthDailyTrend && commissionsData.currentMonthDailyTrend.length > 0 && (
                    <div className="mt-3 h-[40px] cursor-pointer rounded-lg overflow-hidden" title="Click pentru detalii">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={commissionsData.currentMonthDailyTrend} onClick={handleSparklineClick}>
                          <defs>
                            <linearGradient id="sparkMonth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(152, 69%, 53%)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(152, 69%, 53%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} €`, '']} labelFormatter={(l) => `Ziua ${l}`} />
                          <Area type="monotone" dataKey="value" stroke="hsl(152, 69%, 53%)" strokeWidth={1.5} fill="url(#sparkMonth)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Daily Average */}
          <div className="admin-glass-card relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
            <div className="p-3 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Medie/Zi</span>
                <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                </div>
              </div>
              {loadingCommissions ? (
                <AnimatedSkeleton className="h-7 w-24" />
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold">{(commissionsData?.dailyAvgEUR || 0).toLocaleString()} €</div>
                  {!isMobile && commissionsData?.lastYearDailyAvgEUR ? (
                    <p className="text-[10px] text-muted-foreground mt-1">An trecut: {commissionsData.lastYearDailyAvgEUR.toLocaleString()} €</p>
                  ) : null}
                  {commissionsData?.dailyAvgGrowth !== undefined && (commissionsData?.lastYearDailyAvgEUR || 0) > 0 && (
                    <TrendBadge value={commissionsData.dailyAvgGrowth} />
                  )}
                  {!isMobile && commissionsData?.dailyTrend30 && commissionsData.dailyTrend30.length > 0 && (
                    <div className="mt-3 h-[40px] cursor-pointer rounded-lg overflow-hidden" title="Click pentru detalii">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={commissionsData.dailyTrend30} onClick={handleSparklineClick}>
                          <defs>
                            <linearGradient id="spark30" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(45, 100%, 58%)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(45, 100%, 58%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} €`, '']} labelFormatter={(l) => l as string} />
                          <Area type="monotone" dataKey="value" stroke="hsl(45, 100%, 58%)" strokeWidth={1.5} fill="url(#spark30)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <MiniCard icon={DollarSign} label="Comision Mediu" value={`${(commissionsData?.avgEUR || 0).toLocaleString()} €`} color="bg-yellow-500" loading={loadingCommissions} />
          <MiniCard icon={BarChart3} label="YTD Comisioane" value={`${(commissionsData?.ytdEUR || 0).toLocaleString()} €`} color="bg-blue-500" loading={loadingCommissions} />
          <Link to="/admin/inbox">
            <MiniCard icon={Mail} label="Email-uri necitite" value={emailsData?.unread || 0} color="bg-red-500" loading={loadingEmails} highlight={!!emailsData?.unread && emailsData.unread > 0} />
          </Link>
          <MiniCard icon={Users} label="Clienți" value={clientsData?.total || 0} color="bg-purple-500" loading={loadingClients} badge={clientsData?.newThisMonth ? `+${clientsData.newThisMonth}` : undefined} />
        </div>

        {/* Viewings Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <MiniCard icon={Calendar} label="Vizionări Total" value={viewingsData?.total || 0} color="bg-indigo-500" loading={loadingViewings} />
          <MiniCard icon={Clock} label="În Așteptare" value={viewingsData?.pending || 0} color="bg-orange-500" loading={loadingViewings} />
          <MiniCard icon={CheckCircle} label="Confirmate" value={viewingsData?.confirmed || 0} color="bg-emerald-500" loading={loadingViewings} />
          <MiniCard icon={Eye} label="Luna Aceasta" value={viewingsData?.thisMonthCount || 0} color="bg-cyan-500" loading={loadingViewings} trend={viewingsData?.monthlyGrowth} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Commission Trend */}
          <div className="admin-glass-card lg:col-span-2">
            <div className="p-4 md:p-5 pb-2">
              <div className="flex items-center gap-2.5 mb-0.5">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/15">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm md:text-base font-semibold">
                  {isMobile ? "Comisioane" : "Evoluție Comisioane (12 luni)"}
                </h3>
              </div>
              {!isMobile && <p className="text-xs text-muted-foreground ml-9">Trend lunar EUR și număr tranzacții</p>}
            </div>
            <div className="px-2 md:px-5 pb-4">
              <div className="h-[180px] md:h-[300px] w-full">
                {loadingCommissions ? (
                  <ChartSkeleton />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={isMobile ? commissionsData?.monthlyTrend?.slice(-6) || [] : commissionsData?.monthlyTrend || []} margin={isMobile ? { left: -20, right: 5 } : { left: 0, right: 10 }}>
                      <defs>
                        <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(45, 100%, 58%)" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="hsl(45, 100%, 58%)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: isMobile ? 9 : 11 }} interval={0} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 9 : 11 }} width={isMobile ? 40 : 60} tickLine={false} axisLine={false} tickFormatter={(v) => isMobile ? `${(v/1000).toFixed(0)}k` : v.toLocaleString()} />
                      {!isMobile && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={40} />}
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} €`, 'Comisioane']} />
                      {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                      <Area yAxisId="left" type="monotone" dataKey="EUR" stroke="hsl(45, 100%, 58%)" strokeWidth={2} fillOpacity={1} fill="url(#colorEUR)" name="Comisioane (€)" />
                      {!isMobile && <Line yAxisId="right" type="monotone" dataKey="count" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(217, 91%, 60%)', r: 3 }} name="Nr. Tranzacții" />}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Distribution Pie */}
          <div className="admin-glass-card">
            <div className="p-4 md:p-5 pb-2">
              <div className="flex items-center gap-2.5 mb-0.5">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/15">
                  <Layers className="h-4 w-4 text-purple-500" />
                </div>
                <h3 className="text-sm md:text-base font-semibold">Distribuție</h3>
              </div>
              {!isMobile && <p className="text-xs text-muted-foreground ml-9">Pe tip tranzacție</p>}
            </div>
            <div className="px-2 md:px-5 pb-4">
              <div className="h-[180px] md:h-[300px] w-full">
                {loadingCommissions ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-4 border-muted animate-pulse" />
                  </div>
                ) : commissionsData?.typeDistribution && commissionsData.typeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={commissionsData.typeDistribution} cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 55 : 80} paddingAngle={3} dataKey="value">
                        {commissionsData.typeDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${Math.round(v).toLocaleString()} €`, 'Valoare']} />
                      <Legend verticalAlign="bottom" height={isMobile ? 30 : 36} wrapperStyle={{ fontSize: isMobile ? '10px' : '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Nu există date</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complex Breakdown */}
        <div className="admin-glass-card">
          <div className="p-4 md:p-5 pb-2">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                <Building2 className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="text-sm md:text-base font-semibold">{isMobile ? "Complexe" : "Apartamente pe Complex"}</h3>
            </div>
            {!isMobile && <p className="text-xs text-muted-foreground ml-9">Distribuție și rată de vânzare</p>}
          </div>
          <div className="px-2 md:px-5 pb-4">
            <div className="h-[200px] md:h-[260px] w-full">
              {loadingComplexes ? (
                <ChartSkeleton />
              ) : complexesData?.complexBreakdown && complexesData.complexBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={isMobile ? complexesData.complexBreakdown.slice(0, 4) : complexesData.complexBreakdown} margin={isMobile ? { left: -10, right: 5, bottom: 40 } : { left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: isMobile ? 9 : 11 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 60 : 30} interval={0} tickFormatter={(v) => isMobile && v.length > 12 ? v.substring(0, 12) + '...' : v} />
                    <YAxis tick={{ fontSize: isMobile ? 9 : 11 }} width={isMobile ? 30 : 40} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, key: string) => {
                      const labels: Record<string, string> = { available: 'Disponibile', sold: 'Vândute', reserved: 'Rezervate' };
                      return [v, labels[key] ?? key];
                    }} />
                    {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                    <Bar dataKey="available" stackId="a" fill="hsl(152, 69%, 53%)" name="Disponibile" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="sold" stackId="a" fill="hsl(45, 100%, 58%)" name="Vândute" />
                    <Bar dataKey="reserved" stackId="a" fill="hsl(217, 91%, 60%)" name="Rezervate" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Nu există complexe</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Price Stats */}
          <div className="admin-glass-card">
            <div className="p-4 md:p-5 pb-2">
              <h3 className="text-sm font-semibold">Statistici Prețuri</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">Proprietăți individuale</p>
            </div>
            <div className="p-4 pt-0 md:p-5 md:pt-0">
              {loadingProperties ? (
                <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-secondary/50 border border-border/20">
                      <p className="text-sm md:text-base font-bold">{(propertiesData?.minPrice || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Min €</p>
                    </div>
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm md:text-base font-bold text-primary">{(propertiesData?.avgPrice || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Mediu €</p>
                    </div>
                    <div className="p-2 rounded-xl bg-secondary/50 border border-border/20">
                      <p className="text-sm md:text-base font-bold">{(propertiesData?.maxPrice || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">Max €</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Noi luna aceasta:</span>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">+{propertiesData?.newThisMonth || 0}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Status */}
          <div className="admin-glass-card">
            <div className="p-4 md:p-5 pb-2">
              <h3 className="text-sm font-semibold">Status Facturi</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">Comisioane facturate</p>
            </div>
            <div className="p-4 pt-0 md:p-5 md:pt-0">
              {loadingCommissions ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-8 rounded-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>Cu factură</span>
                      <span className="font-medium">{commissionsData?.withInvoice || 0}</span>
                    </div>
                    <Progress value={commissionsData?.count ? ((commissionsData.withInvoice || 0) / commissionsData.count) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>Fără factură</span>
                      <span className="font-medium">{commissionsData?.withoutInvoice || 0}</span>
                    </div>
                    <Progress value={commissionsData?.count ? ((commissionsData.withoutInvoice || 0) / commissionsData.count) * 100 : 0} className="h-2 [&>div]:bg-destructive" />
                  </div>
                  <div className="pt-2 border-t border-border/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total tranzacții:</span>
                      <span className="font-bold">{commissionsData?.count || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day Details Dialog */}
        <Dialog open={!!selectedDayDetails} onOpenChange={() => setSelectedDayDetails(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Detalii Comisioane - {selectedDayDetails?.date ? format(parseISO(selectedDayDetails.date), 'dd MMMM yyyy', { locale: ro }) : ''}
              </DialogTitle>
              <DialogDescription>Comisioanele înregistrate în această zi</DialogDescription>
            </DialogHeader>
            {selectedDayDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-2xl font-bold text-primary">{selectedDayDetails.totalEUR.toLocaleString()} €</p>
                    <p className="text-xs text-muted-foreground">Total EUR</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-500">{selectedDayDetails.totalRON.toLocaleString()} RON</p>
                    <p className="text-xs text-muted-foreground">Total RON</p>
                  </div>
                </div>
                {selectedDayDetails.transactions.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tip</TableHead>
                          <TableHead className="text-right">Sumă</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDayDetails.transactions.map((tx, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="capitalize">{tx.type || 'N/A'}</TableCell>
                            <TableCell className="text-right font-medium">{tx.amount.toLocaleString()} {tx.currency}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">Nu există comisioane în această zi</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

// --- Sub-components ---

const TrendBadge = ({ value, label }: { value: number; label?: string }) => (
  <div className={`text-[10px] md:text-xs mt-1.5 flex items-center gap-1 ${value >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
    <span className={`p-0.5 rounded-full ${value >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
      {value >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
    </span>
    <span className="font-medium">{Math.abs(value)}%{label ? ` ${label}` : ''}</span>
  </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, loading, trend, badge }: {
  title: string; value: string | number; subtitle?: string; icon: any; loading: boolean;
  trend?: { value: number; positive: boolean; label?: string }; badge?: string;
}) => (
  <div className="admin-glass-card relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
    <div className="p-3 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">{title}</span>
        <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
        </div>
      </div>
      {loading ? (
        <AnimatedSkeleton className="h-7 w-20" />
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-lg md:text-2xl font-bold">{value}</span>
            {badge && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{badge}</Badge>}
          </div>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
          {trend && <TrendBadge value={trend.value} label={trend.label} />}
        </>
      )}
    </div>
  </div>
);

const MiniCard = ({ icon: Icon, label, value, color, loading, badge, highlight, trend }: {
  icon: any; label: string; value: string | number; color: string; loading: boolean;
  badge?: string; highlight?: boolean; trend?: number;
}) => (
  <div className={`admin-glass-card hover:scale-[1.01] transition-all duration-200 ${highlight ? 'ring-1 ring-destructive/30' : ''}`}>
    <div className="p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
      <div className={`p-1.5 md:p-2 rounded-lg ${color} shadow-lg shrink-0`}>
        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <AnimatedSkeleton className="h-5 w-12" />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <p className="text-base md:text-lg font-bold truncate">{value}</p>
            {badge && <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-500">{badge}</Badge>}
          </div>
        )}
        <p className="text-[9px] md:text-[11px] text-muted-foreground truncate">{label}</p>
        {trend !== undefined && trend !== 0 && <TrendBadge value={trend} />}
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-full w-full flex items-end justify-around gap-1.5 p-4">
    {[40, 65, 45, 80, 55, 70].map((h, i) => (
      <div key={i} className="bg-muted/30 rounded-t w-full animate-pulse" style={{ height: `${h}%` }} />
    ))}
  </div>
);

export default DashboardPage;
