import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, AnimatedSkeleton, FadeInSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  CalendarCheck, 
  Euro, 
  TrendingUp, 
  TrendingDown,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Target,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers,
  Plus,
  FileSpreadsheet,
  Coins,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays, startOfYear, subYears, subDays } from "date-fns";
import { ro } from "date-fns/locale";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ['#DAA520', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

import { useIsMobile } from "@/hooks/use-mobile";

// Check for reduced motion preference
const useOptimizedMotion = () => {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  
  // Reduce animations on mobile or when user prefers reduced motion
  return shouldReduceMotion || isMobile;
};

// Animation variants - optimized for performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const chartContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const chartCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

const chartSlideLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
};

const chartSlideRightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
};

const DashboardPage = () => {
  const isMobile = useIsMobile();
  const reduceMotion = useOptimizedMotion();
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    date: string;
    totalEUR: number;
    totalRON: number;
    transactions: { amount: number; currency: string; type: string }[];
  } | null>(null);
  
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
  // Fetch properties count with more details
  const { data: propertiesData, isLoading: loadingProperties } = useQuery({
    queryKey: ['dashboard-properties-detailed'],
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
      
      // Price analysis
      const pricesEUR = properties?.filter(p => p.price_min && p.price_min > 0).map(p => p.price_min) || [];
      const avgPrice = pricesEUR.length > 0 ? Math.round(pricesEUR.reduce((a, b) => a + b, 0) / pricesEUR.length) : 0;
      const minPrice = pricesEUR.length > 0 ? Math.min(...pricesEUR) : 0;
      const maxPrice = pricesEUR.length > 0 ? Math.max(...pricesEUR) : 0;
      
      // Rooms distribution
      const roomsDistribution = [1, 2, 3, 4].map(rooms => ({
        name: `${rooms} cam`,
        value: properties?.filter(p => p.rooms === rooms).length || 0
      })).filter(r => r.value > 0);
      
      // Transaction type
      const forSale = properties?.filter(p => p.transaction_type === 'sale' || !p.transaction_type).length || 0;
      const forRent = properties?.filter(p => p.transaction_type === 'rent').length || 0;
      
      // New this month
      const thisMonth = startOfMonth(new Date());
      const newThisMonth = properties?.filter(p => p.created_at && parseISO(p.created_at) >= thisMonth).length || 0;
      
      return { 
        total, available, sold, reserved, 
        avgPrice, minPrice, maxPrice,
        roomsDistribution,
        forSale, forRent,
        newThisMonth,
        availabilityRate: total > 0 ? Math.round((available / total) * 100) : 0
      };
    }
  });

  // Fetch complexes with apartments details
  const { data: complexesData, isLoading: loadingComplexes } = useQuery({
    queryKey: ['dashboard-complexes-detailed'],
    queryFn: async () => {
      const { data: projects, error: projectsError } = await supabase
        .from('real_estate_projects')
        .select('id, name, status');
      
      if (projectsError) throw projectsError;
      
      const { data: apartments, error: apartmentsError } = await supabase
        .from('catalog_offers')
        .select('id, project_id, availability_status, price_min, rooms')
        .not('project_id', 'is', null);
      
      if (apartmentsError) throw apartmentsError;
      
      const totalProjects = projects?.length || 0;
      const totalApartments = apartments?.length || 0;
      const availableApartments = apartments?.filter(a => a.availability_status === 'available').length || 0;
      const soldApartments = apartments?.filter(a => a.availability_status === 'sold').length || 0;
      
      const complexBreakdown = projects?.map(project => {
        const projectApts = apartments?.filter(a => a.project_id === project.id) || [];
        const available = projectApts.filter(a => a.availability_status === 'available').length;
        const sold = projectApts.filter(a => a.availability_status === 'sold').length;
        const reserved = projectApts.filter(a => a.availability_status === 'reserved').length;
        const total = projectApts.length;
        return {
          name: project.name,
          fullName: project.name,
          total,
          available,
          sold,
          reserved,
          salesRate: total > 0 ? Math.round((sold / total) * 100) : 0
        };
      }).sort((a, b) => b.total - a.total).slice(0, 6) || [];
      
      // Overall sales rate
      const overallSalesRate = totalApartments > 0 ? Math.round((soldApartments / totalApartments) * 100) : 0;
      
      return { 
        totalProjects, 
        totalApartments, 
        availableApartments, 
        soldApartments,
        complexBreakdown,
        overallSalesRate
      };
    }
  });

  // Fetch viewing appointments with trend analysis
  const { data: viewingsData, isLoading: loadingViewings } = useQuery({
    queryKey: ['dashboard-viewings-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viewing_appointments')
        .select('status, created_at, preferred_date')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const pending = data?.filter(v => v.status === 'pending').length || 0;
      const confirmed = data?.filter(v => v.status === 'confirmed').length || 0;
      const completed = data?.filter(v => v.status === 'completed').length || 0;
      const cancelled = data?.filter(v => v.status === 'cancelled').length || 0;
      const total = data?.length || 0;
      
      // Conversion rate (completed / total)
      const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // This month vs last month
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      
      const thisMonthCount = data?.filter(v => v.created_at && parseISO(v.created_at) >= thisMonthStart).length || 0;
      const lastMonthCount = data?.filter(v => {
        if (!v.created_at) return false;
        const date = parseISO(v.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).length || 0;
      
      const monthlyGrowth = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0;
      
      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        
        const monthData = data?.filter(v => {
          if (!v.created_at) return false;
          const date = parseISO(v.created_at);
          return date >= mStart && date <= mEnd;
        }) || [];
        
        monthlyTrend.push({
          month: format(monthDate, 'MMM', { locale: ro }),
          total: monthData.length,
          completed: monthData.filter(v => v.status === 'completed').length,
          cancelled: monthData.filter(v => v.status === 'cancelled').length
        });
      }
      
      // Avg response time (simulated based on created vs preferred date)
      const avgDaysToViewing = data?.filter(v => v.created_at && v.preferred_date)
        .map(v => differenceInDays(parseISO(v.preferred_date), parseISO(v.created_at)))
        .filter(d => d >= 0) || [];
      const avgResponseDays = avgDaysToViewing.length > 0 
        ? Math.round(avgDaysToViewing.reduce((a, b) => a + b, 0) / avgDaysToViewing.length) 
        : 0;
      
      return { 
        total, pending, confirmed, completed, cancelled,
        conversionRate,
        thisMonthCount, lastMonthCount, monthlyGrowth,
        monthlyTrend,
        avgResponseDays
      };
    }
  });

  // Fetch commissions data with more analytics
  const { data: commissionsData, isLoading: loadingCommissions } = useQuery({
    queryKey: ['dashboard-commissions-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('amount, currency, date, transaction_type, invoice_number')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Calculate totals
      const totalEUR = data?.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalRON = data?.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      
      // Current month totals
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      
      const currentMonthData = data?.filter(c => {
        const date = parseISO(c.date);
        return date >= monthStart && date <= monthEnd;
      }) || [];
      
      const lastMonthData = data?.filter(c => {
        const date = parseISO(c.date);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }) || [];
      
      const currentMonthEUR = currentMonthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const currentMonthRON = currentMonthData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      const lastMonthEUR = lastMonthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      
      const monthlyGrowth = lastMonthEUR > 0 ? Math.round(((currentMonthEUR - lastMonthEUR) / lastMonthEUR) * 100) : 0;
      
      // Daily trend for current month (for sparkline)
      const daysInCurrentMonth = differenceInDays(now, monthStart) + 1;
      const currentMonthDailyTrend = [];
      for (let i = 0; i < daysInCurrentMonth; i++) {
        const day = subDays(now, daysInCurrentMonth - 1 - i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = data?.filter(c => c.date === dayStr) || [];
        const dayTotalEUR = dayData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
        const dayTotalRON = dayData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
        currentMonthDailyTrend.push({
          day: format(day, 'dd'),
          fullDate: dayStr,
          value: dayTotalEUR,
          valueRON: dayTotalRON,
          transactions: dayData.map(c => ({
            amount: Number(c.amount),
            currency: c.currency,
            type: c.transaction_type
          }))
        });
      }
      
      // YTD
      const yearStart = startOfYear(now);
      const ytdData = data?.filter(c => parseISO(c.date) >= yearStart) || [];
      const ytdEUR = ytdData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const ytdRON = ytdData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      
      // Average commission per transaction
      const avgCommissionEUR = data?.filter(c => c.currency === 'EUR').length || 0;
      const avgEUR = avgCommissionEUR > 0 ? Math.round(totalEUR / avgCommissionEUR) : 0;
      
      // Daily average commission (YTD)
      const daysSinceYearStart = differenceInDays(now, yearStart) + 1;
      const dailyAvgEUR = daysSinceYearStart > 0 ? Math.round(ytdEUR / daysSinceYearStart) : 0;
      
      // Last year same period for comparison
      const lastYearStart = startOfYear(subYears(now, 1));
      const lastYearSameDay = subYears(now, 1);
      const lastYearYtdData = data?.filter(c => {
        const date = parseISO(c.date);
        return date >= lastYearStart && date <= lastYearSameDay;
      }) || [];
      const lastYearYtdEUR = lastYearYtdData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const lastYearDays = differenceInDays(lastYearSameDay, lastYearStart) + 1;
      const lastYearDailyAvgEUR = lastYearDays > 0 ? Math.round(lastYearYtdEUR / lastYearDays) : 0;
      
      // Daily average growth YoY
      const dailyAvgGrowth = lastYearDailyAvgEUR > 0 ? Math.round(((dailyAvgEUR - lastYearDailyAvgEUR) / lastYearDailyAvgEUR) * 100) : 0;
      
      // Daily trend for last 30 days (for sparkline)
      const dailyTrend30 = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = data?.filter(c => c.date === dayStr) || [];
        const dayTotalEUR = dayData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
        const dayTotalRON = dayData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
        dailyTrend30.push({
          day: format(day, 'dd/MM'),
          fullDate: dayStr,
          value: dayTotalEUR,
          valueRON: dayTotalRON,
          transactions: dayData.map(c => ({
            amount: Number(c.amount),
            currency: c.currency,
            type: c.transaction_type
          }))
        });
      }
      
      // Monthly trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        
        const monthData = data?.filter(c => {
          const date = parseISO(c.date);
          return date >= mStart && date <= mEnd;
        }) || [];
        
        const eurTotal = monthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
        const ronTotal = monthData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
        
        monthlyTrend.push({
          month: format(monthDate, 'MMM yy', { locale: ro }),
          EUR: eurTotal,
          RON: ronTotal,
          count: monthData.length
        });
      }
      
      // Transaction type distribution with amounts
      const saleCommissions = data?.filter(c => c.transaction_type === 'vânzare') || [];
      const rentCommissions = data?.filter(c => c.transaction_type === 'chirie') || [];
      const collabCommissions = data?.filter(c => c.transaction_type === 'colaborare vânzare') || [];
      
      const typeDistribution = [
        { name: 'Vânzare', count: saleCommissions.length, value: saleCommissions.reduce((sum, c) => sum + (c.currency === 'EUR' ? Number(c.amount) : Number(c.amount) / 5), 0) },
        { name: 'Chirie', count: rentCommissions.length, value: rentCommissions.reduce((sum, c) => sum + (c.currency === 'EUR' ? Number(c.amount) : Number(c.amount) / 5), 0) },
        { name: 'Colaborare', count: collabCommissions.length, value: collabCommissions.reduce((sum, c) => sum + (c.currency === 'EUR' ? Number(c.amount) : Number(c.amount) / 5), 0) },
      ].filter(t => t.count > 0);
      
      // Invoice status - derive "fără factură" din total pentru consistență
      const withInvoice = data?.filter(c => (c.invoice_number || '').trim().toLowerCase() === 'da').length || 0;
      const withoutInvoice = (data?.length || 0) - withInvoice;
      
      return { 
        totalEUR, 
        totalRON, 
        currentMonthEUR, 
        currentMonthRON,
        lastMonthEUR,
        monthlyGrowth,
        ytdEUR,
        ytdRON,
        avgEUR,
        dailyAvgEUR,
        dailyAvgGrowth,
        lastYearDailyAvgEUR,
        dailyTrend30,
        currentMonthDailyTrend,
        monthlyTrend,
        typeDistribution,
        count: data?.length || 0,
        withInvoice,
        withoutInvoice
      };
    }
  });

  // Fetch clients count
  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, created_at');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const thisMonth = startOfMonth(new Date());
      const newThisMonth = data?.filter(c => c.created_at && parseISO(c.created_at) >= thisMonth).length || 0;
      
      return { total, newThisMonth };
    }
  });

  // Fetch users count
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      return { total: count || 0 };
    }
  });

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend,
    loading,
    color = "gold"
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: any;
    trend?: { value: number; positive: boolean };
    loading: boolean;
    color?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-${color}/5 rounded-full -translate-y-1/2 translate-x-1/2`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">{title}</CardTitle>
        <div className={`p-1.5 md:p-2 rounded-lg bg-${color}/10 shrink-0`}>
          <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        {loading ? (
          <AnimatedSkeleton className="h-6 md:h-8 w-20 md:w-24" />
        ) : (
          <>
            <div className="text-lg md:text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
            )}
            {trend && (
              <div className={`text-[10px] md:text-xs mt-1.5 md:mt-2 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? (
                  <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                )}
                <span className="truncate">{Math.abs(trend.value)}% față de luna trecută</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const MiniStatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-muted/50">
      <div className={`p-1.5 md:p-2 rounded-lg ${color} shrink-0`}>
        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-base md:text-lg font-bold truncate">{value}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      className="space-y-4 md:space-y-6"
      initial={reduceMotion ? undefined : "hidden"}
      animate={reduceMotion ? undefined : "visible"}
      variants={reduceMotion ? undefined : containerVariants}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4"
        variants={reduceMotion ? undefined : fadeInVariants}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Statistici complete și analize</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground text-[10px] md:text-xs px-2 py-0.5">
            <Activity className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
            Live
          </Badge>
          <Badge variant="secondary" className="text-[10px] md:text-xs px-2 py-0.5">
            {format(new Date(), isMobile ? 'dd MMM' : 'dd MMMM yyyy', { locale: ro })}
          </Badge>
        </div>
      </motion.div>

      {/* Quick Actions Card */}
      <motion.div variants={reduceMotion ? undefined : fadeInVariants}>
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-gold" />
              Acțiuni Rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link 
                  to="/admin/proprietati" 
                  className="flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 md:p-4 rounded-lg bg-card border border-border/50 hover:border-gold/40 hover:bg-gold/5 transition-all group h-full"
                >
                  <div className="p-1.5 md:p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Plus className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-medium group-hover:text-gold transition-colors">Proprietate</p>
                    <p className="hidden md:block text-xs text-muted-foreground">Proprietate nouă</p>
                  </div>
                  <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link 
                  to="/admin/import-xml" 
                  className="flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 md:p-4 rounded-lg bg-card border border-border/50 hover:border-gold/40 hover:bg-gold/5 transition-all group h-full"
                >
                  <div className="p-1.5 md:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileSpreadsheet className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-medium group-hover:text-gold transition-colors">Import</p>
                    <p className="hidden md:block text-xs text-muted-foreground">Import proprietăți</p>
                  </div>
                  <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link 
                  to="/admin/comisioane" 
                  className="flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 md:p-4 rounded-lg bg-card border border-border/50 hover:border-gold/40 hover:bg-gold/5 transition-all group h-full"
                >
                  <div className="p-1.5 md:p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Coins className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-medium group-hover:text-gold transition-colors">Comisioane</p>
                    <p className="hidden md:block text-xs text-muted-foreground">Gestionare</p>
                  </div>
                  <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Stats Grid - Row 1 */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4"
        variants={reduceMotion ? undefined : containerVariants}
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <StatCard
            title="Proprietăți"
            value={propertiesData?.total || 0}
            subtitle={isMobile ? `${propertiesData?.available || 0} disp.` : `${propertiesData?.available || 0} disponibile • ${propertiesData?.sold || 0} vândute`}
            icon={Home}
            loading={loadingProperties}
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <StatCard
            title="Apt. Complexe"
            value={complexesData?.totalApartments || 0}
            subtitle={`${complexesData?.totalProjects || 0} complexe`}
            icon={Building2}
            trend={complexesData?.overallSalesRate ? { value: complexesData.overallSalesRate, positive: true } : undefined}
            loading={loadingComplexes}
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <Card className="relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">Comisioane Lună</CardTitle>
              <div className="p-1.5 md:p-2 rounded-lg bg-gold/10 shrink-0">
                <Euro className="h-3.5 w-3.5 md:h-4 md:w-4 text-gold" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {loadingCommissions ? (
                <AnimatedSkeleton className="h-6 md:h-8 w-20 md:w-24" />
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold">{(commissionsData?.currentMonthEUR || 0).toLocaleString()} €</div>
                  {commissionsData?.currentMonthRON && !isMobile ? (
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">+ {commissionsData.currentMonthRON.toLocaleString()} RON</p>
                  ) : null}
                  {commissionsData?.monthlyGrowth !== undefined && (
                    <div className={`text-[10px] md:text-xs mt-1.5 md:mt-2 flex items-center gap-1 ${commissionsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {commissionsData.monthlyGrowth >= 0 ? (
                        <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    )}
                    {Math.abs(commissionsData.monthlyGrowth)}%
                  </div>
                )}
                {/* Sparkline - only on desktop */}
                {!isMobile && commissionsData?.currentMonthDailyTrend && commissionsData.currentMonthDailyTrend.length > 0 && (
                  <div className="mt-3 h-[40px] cursor-pointer" title="Click pentru detalii">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={commissionsData.currentMonthDailyTrend} onClick={handleSparklineClick}>
                        <defs>
                          <linearGradient id="sparklineGradientMonth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '11px',
                            padding: '4px 8px'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} €`, '']}
                          labelFormatter={(label) => `Ziua ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={1.5}
                          fill="url(#sparklineGradientMonth)"
                          style={{ cursor: 'pointer' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
        <Card className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">Medie/Zi</CardTitle>
            <div className="p-1.5 md:p-2 rounded-lg bg-gold/10 shrink-0">
              <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-gold" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {loadingCommissions ? (
              <AnimatedSkeleton className="h-6 md:h-8 w-20 md:w-24" />
            ) : (
              <>
                <div className="text-lg md:text-2xl font-bold">{(commissionsData?.dailyAvgEUR || 0).toLocaleString()} €</div>
                {!isMobile && (
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    {commissionsData?.lastYearDailyAvgEUR ? `An trecut: ${commissionsData.lastYearDailyAvgEUR.toLocaleString()} €` : "Media zilnică YTD"}
                  </p>
                )}
                {commissionsData?.dailyAvgGrowth !== undefined && commissionsData?.lastYearDailyAvgEUR > 0 && (
                  <div className={`text-[10px] md:text-xs mt-1.5 md:mt-2 flex items-center gap-1 ${commissionsData.dailyAvgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {commissionsData.dailyAvgGrowth >= 0 ? (
                      <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    )}
                    {Math.abs(commissionsData.dailyAvgGrowth)}%
                  </div>
                )}
                {/* Sparkline - only on desktop */}
                {!isMobile && commissionsData?.dailyTrend30 && commissionsData.dailyTrend30.length > 0 && (
                  <div className="mt-3 h-[40px] cursor-pointer" title="Click pentru detalii">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={commissionsData.dailyTrend30} onClick={handleSparklineClick}>
                        <defs>
                          <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#DAA520" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#DAA520" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '11px',
                            padding: '4px 8px'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} €`, '']}
                          labelFormatter={(label) => label}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#DAA520" 
                          strokeWidth={1.5}
                          fill="url(#sparklineGradient)"
                          style={{ cursor: 'pointer' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>

      {/* Stats Row 2 - KPIs */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">Comision Mediu</p>
                <p className="text-lg md:text-2xl font-bold">{(commissionsData?.avgEUR || 0).toLocaleString()} €</p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20 shrink-0 ml-2">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3">Per tranzacție EUR</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">YTD Comisioane</p>
                <p className="text-lg md:text-2xl font-bold">{(commissionsData?.ytdEUR || 0).toLocaleString()} €</p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 shrink-0 ml-2">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3">
              + {(commissionsData?.ytdRON || 0).toLocaleString()} RON
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6"
      >
        {/* Commission Trend Chart - 12 months */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-gold" />
              {isMobile ? "Comisioane" : "Evoluție Comisioane (12 luni)"}
            </CardTitle>
            {!isMobile && (
              <CardDescription className="text-sm">
                Trend lunar al comisioanelor în EUR și număr tranzacții
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0">
            <div className="h-[180px] md:h-[320px] w-full">
              {loadingCommissions ? (
                <div className="h-full w-full flex items-end justify-around gap-1 md:gap-2 p-2 md:p-4">
                  {(isMobile ? [40, 65, 45, 80, 55, 70] : [40, 65, 45, 80, 55, 70, 50, 60, 75, 45, 55, 70]).map((height, i) => (
                    <div
                      key={i}
                      className="bg-gold/20 rounded-t w-full"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={isMobile ? commissionsData?.monthlyTrend?.slice(-6) || [] : commissionsData?.monthlyTrend || []} 
                    margin={isMobile ? { left: -20, right: 5, top: 5, bottom: 5 } : { left: 0, right: 10, top: 5, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DAA520" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#DAA520" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: isMobile ? 9 : 11 }} 
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: isMobile ? 9 : 11 }} 
                      width={isMobile ? 40 : 60}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => isMobile ? `${(value/1000).toFixed(0)}k` : value.toLocaleString()}
                    />
                    {!isMobile && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={40} />}
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                        fontSize: isMobile ? '10px' : '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} €`, 'Comisioane']}
                    />
                    {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="EUR" 
                      stroke="#DAA520" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorEUR)"
                      name="Comisioane (€)"
                    />
                    {!isMobile && (
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="Nr. Tranzacții"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Type Distribution */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Layers className="h-4 w-4 md:h-5 md:w-5 text-gold" />
              Distribuție
            </CardTitle>
            {!isMobile && <CardDescription className="text-sm">Pe tip tranzacție</CardDescription>}
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0">
            <div className="h-[180px] md:h-[320px] w-full">
              {loadingCommissions ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-16 h-16 md:w-32 md:h-32 rounded-full border-4 md:border-8 border-muted" />
                </div>
              ) : commissionsData?.typeDistribution && commissionsData.typeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={commissionsData.typeDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={isMobile ? 30 : 50}
                      outerRadius={isMobile ? 55 : 80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {commissionsData.typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: isMobile ? '10px' : '12px'
                      }}
                      formatter={(value: number) => [`${Math.round(value).toLocaleString()} €`, 'Valoare']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={isMobile ? 30 : 36}
                      wrapperStyle={{ fontSize: isMobile ? '10px' : '11px' }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs md:text-sm">
                  Nu există date
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Complex Breakdown */}
      <Card>
        <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-gold" />
            {isMobile ? "Complexe" : "Apartamente pe Complex"}
          </CardTitle>
          {!isMobile && <CardDescription className="text-sm">Distribuție și rată de vânzare</CardDescription>}
        </CardHeader>
        <CardContent className="p-2 md:p-6 pt-0">
          <div className="h-[200px] md:h-[280px] w-full">
            {loadingComplexes ? (
              <div className="h-full w-full flex items-end justify-around gap-2 p-2 md:p-4">
                {(isMobile ? [60, 45, 75, 50] : [60, 45, 75, 50, 65, 40]).map((height, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-emerald-500/30 via-gold/20 to-blue-500/20 rounded-t w-full"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            ) : complexesData?.complexBreakdown && complexesData.complexBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={isMobile ? complexesData.complexBreakdown.slice(0, 4) : complexesData.complexBreakdown} 
                  layout="horizontal"
                  margin={isMobile ? { left: -10, right: 5, top: 5, bottom: 40 } : { left: 0, right: 10, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: isMobile ? 9 : 11 }} 
                    angle={isMobile ? -45 : 0} 
                    textAnchor={isMobile ? "end" : "middle"} 
                    height={isMobile ? 60 : 30} 
                    interval={0}
                    tickFormatter={(value) => isMobile ? (value.length > 12 ? value.substring(0, 12) + '...' : value) : value}
                  />
                  <YAxis 
                    type="number" 
                    tick={{ fontSize: isMobile ? 9 : 11 }} 
                    width={isMobile ? 30 : 40}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: isMobile ? '10px' : '12px'
                    }}
                    formatter={(value: number, key: string) => {
                      const labelMap: Record<string, string> = {
                        available: 'Disponibile',
                        sold: 'Vândute',
                        reserved: 'Rezervate',
                      };
                      return [value, labelMap[key] ?? key];
                    }}
                  />
                  {!isMobile && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                  <Bar dataKey="available" stackId="a" fill="#10b981" name="Disponibile" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="sold" stackId="a" fill="#DAA520" name="Vândute" radius={0} />
                  <Bar dataKey="reserved" stackId="a" fill="#3b82f6" name="Rezervate" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs md:text-sm">
                Nu există complexe
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
        {/* Properties Stats */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
            <CardTitle className="text-sm md:text-base">{isMobile ? "Prețuri" : "Statistici Proprietăți"}</CardTitle>
            <CardDescription className="text-[10px] md:text-sm">Prețuri și distribuție</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {loadingProperties ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/50 space-y-2">
                      <Skeleton className="h-5 w-12 mx-auto" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-1.5 md:p-2 rounded-lg bg-muted/50">
                    <p className="text-sm md:text-lg font-bold">{(propertiesData?.minPrice || 0).toLocaleString()}</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground">Min €</p>
                  </div>
                  <div className="p-1.5 md:p-2 rounded-lg bg-gold/10">
                    <p className="text-sm md:text-lg font-bold text-gold">{(propertiesData?.avgPrice || 0).toLocaleString()}</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground">Mediu €</p>
                  </div>
                  <div className="p-1.5 md:p-2 rounded-lg bg-muted/50">
                    <p className="text-sm md:text-lg font-bold">{(propertiesData?.maxPrice || 0).toLocaleString()}</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground">Max €</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Noi luna aceasta:</span>
                  <Badge variant="secondary" className="text-[10px] md:text-xs">+{propertiesData?.newThisMonth || 0}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base">Status Facturi</CardTitle>
            <CardDescription className="text-[10px] md:text-sm">Comisioane facturate</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {loadingCommissions ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                      <span>Cu factură</span>
                      <span className="font-medium">{commissionsData?.withInvoice || 0}</span>
                    </div>
                    <Progress 
                      value={commissionsData?.count ? ((commissionsData.withInvoice || 0) / commissionsData.count) * 100 : 0} 
                      className="h-1.5 md:h-2"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                      <span>Fără factură</span>
                      <span className="font-medium">{commissionsData?.withoutInvoice || 0}</span>
                    </div>
                    <Progress 
                      value={commissionsData?.count ? ((commissionsData.withoutInvoice || 0) / commissionsData.count) * 100 : 0} 
                      className="h-1.5 md:h-2 [&>div]:bg-red-500"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Total tranzacții:</span>
                    <span className="font-bold">{commissionsData?.count || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDayDetails} onOpenChange={() => setSelectedDayDetails(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-gold" />
              Detalii Comisioane - {selectedDayDetails?.date ? format(parseISO(selectedDayDetails.date), 'dd MMMM yyyy', { locale: ro }) : ''}
            </DialogTitle>
            <DialogDescription>
              Comisioanele înregistrate în această zi
            </DialogDescription>
          </DialogHeader>
          
          {selectedDayDetails && (
            <div className="space-y-4">
              {/* Totals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gold/10 text-center">
                  <p className="text-2xl font-bold text-gold">{selectedDayDetails.totalEUR.toLocaleString()} €</p>
                  <p className="text-xs text-muted-foreground">Total EUR</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-2xl font-bold text-blue-500">{selectedDayDetails.totalRON.toLocaleString()} RON</p>
                  <p className="text-xs text-muted-foreground">Total RON</p>
                </div>
              </div>

              {/* Transactions Table */}
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
                          <TableCell className="text-right font-medium">
                            {tx.amount.toLocaleString()} {tx.currency}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Nu există comisioane în această zi
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default DashboardPage;