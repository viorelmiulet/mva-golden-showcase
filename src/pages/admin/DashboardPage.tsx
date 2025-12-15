import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Layers
} from "lucide-react";
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
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays, startOfYear } from "date-fns";
import { ro } from "date-fns/locale";

const COLORS = ['#DAA520', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardPage = () => {
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
      
      // Per-complex breakdown
      const complexBreakdown = projects?.map(project => {
        const projectApts = apartments?.filter(a => a.project_id === project.id) || [];
        const available = projectApts.filter(a => a.availability_status === 'available').length;
        const sold = projectApts.filter(a => a.availability_status === 'sold').length;
        return {
          name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
          fullName: project.name,
          total: projectApts.length,
          available,
          sold,
          reserved: projectApts.length - available - sold,
          salesRate: projectApts.length > 0 ? Math.round((sold / projectApts.length) * 100) : 0
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
      
      // YTD
      const yearStart = startOfYear(now);
      const ytdData = data?.filter(c => parseISO(c.date) >= yearStart) || [];
      const ytdEUR = ytdData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const ytdRON = ytdData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      
      // Average commission
      const avgCommissionEUR = data?.filter(c => c.currency === 'EUR').length || 0;
      const avgEUR = avgCommissionEUR > 0 ? Math.round(totalEUR / avgCommissionEUR) : 0;
      
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
      
      // Invoice status
      const withInvoice = data?.filter(c => c.invoice_number === 'da').length || 0;
      const withoutInvoice = data?.filter(c => c.invoice_number === 'nu' || !c.invoice_number).length || 0;
      
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
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 rounded-full -translate-y-1/2 translate-x-1/2`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(trend.value)}% față de luna trecută
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const MiniStatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Statistici complete și analize de performanță</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Badge variant="secondary">
            {format(new Date(), 'dd MMMM yyyy', { locale: ro })}
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Proprietăți Individuale"
          value={propertiesData?.total || 0}
          subtitle={`${propertiesData?.available || 0} disponibile • ${propertiesData?.sold || 0} vândute`}
          icon={Home}
          loading={loadingProperties}
        />
        <StatCard
          title="Apartamente în Complexe"
          value={complexesData?.totalApartments || 0}
          subtitle={`${complexesData?.totalProjects || 0} complexe active`}
          icon={Building2}
          trend={complexesData?.overallSalesRate ? { value: complexesData.overallSalesRate, positive: true } : undefined}
          loading={loadingComplexes}
        />
        <StatCard
          title="Comisioane Luna Curentă"
          value={`${(commissionsData?.currentMonthEUR || 0).toLocaleString()} €`}
          subtitle={commissionsData?.currentMonthRON ? `+ ${commissionsData.currentMonthRON.toLocaleString()} RON` : undefined}
          icon={Euro}
          trend={commissionsData?.monthlyGrowth !== undefined ? { value: commissionsData.monthlyGrowth, positive: commissionsData.monthlyGrowth >= 0 } : undefined}
          loading={loadingCommissions}
        />
      </div>

      {/* Stats Row 2 - KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rată Conversie</p>
                <p className="text-2xl font-bold">{viewingsData?.conversionRate || 0}%</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Progress value={viewingsData?.conversionRate || 0} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Vizionări finalizate din total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comision Mediu</p>
                <p className="text-2xl font-bold">{(commissionsData?.avgEUR || 0).toLocaleString()} €</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Per tranzacție EUR</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">YTD Comisioane</p>
                <p className="text-2xl font-bold">{(commissionsData?.ytdEUR || 0).toLocaleString()} €</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              + {(commissionsData?.ytdRON || 0).toLocaleString()} RON
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibilitate</p>
                <p className="text-2xl font-bold">{propertiesData?.availabilityRate || 0}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <Progress value={propertiesData?.availabilityRate || 0} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Proprietăți disponibile</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clienți</p>
                <p className="text-2xl font-bold">{clientsData?.total || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/20">
                <Users className="h-5 w-5 text-pink-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              +{clientsData?.newThisMonth || 0} luna aceasta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission Trend Chart - 12 months */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              Evoluție Comisioane (12 luni)
            </CardTitle>
            <CardDescription>Trend lunar al comisioanelor în EUR și număr tranzacții</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loadingCommissions ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={commissionsData?.monthlyTrend || []}>
                  <defs>
                    <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DAA520" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#DAA520" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="EUR" 
                    stroke="#DAA520" 
                    fillOpacity={1} 
                    fill="url(#colorEUR)"
                    name="Comisioane (€)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    name="Nr. Tranzacții"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Transaction Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-gold" />
              Distribuție Tranzacții
            </CardTitle>
            <CardDescription>Comisioane pe tip de tranzacție</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loadingCommissions ? (
              <Skeleton className="h-full w-full" />
            ) : commissionsData?.typeDistribution && commissionsData.typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commissionsData.typeDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
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
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${Math.round(value).toLocaleString()} €`, 'Valoare']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => {
                      const item = commissionsData.typeDistribution.find(t => t.name === value);
                      return `${value} (${item?.count || 0})`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nu există date de afișat
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viewings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
              Trend Vizionări (6 luni)
            </CardTitle>
            <CardDescription>Evoluția programărilor de vizionare</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingViewings ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewingsData?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#10b981" name="Finalizate" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Anulate" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Complex Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gold" />
              Apartamente pe Complex
            </CardTitle>
            <CardDescription>Distribuție și rată de vânzare</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingComplexes ? (
              <Skeleton className="h-full w-full" />
            ) : complexesData?.complexBreakdown && complexesData.complexBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complexesData.complexBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [value, name === 'available' ? 'Disponibile' : name === 'sold' ? 'Vândute' : 'Rezervate']}
                  />
                  <Legend />
                  <Bar dataKey="available" stackId="a" fill="#10b981" name="Disponibile" />
                  <Bar dataKey="sold" stackId="a" fill="#DAA520" name="Vândute" />
                  <Bar dataKey="reserved" stackId="a" fill="#3b82f6" name="Rezervate" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nu există complexe
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Properties Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistici Proprietăți</CardTitle>
            <CardDescription>Prețuri și distribuție</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProperties ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{(propertiesData?.minPrice || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Min €</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gold/10">
                    <p className="text-lg font-bold text-gold">{(propertiesData?.avgPrice || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Mediu €</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{(propertiesData?.maxPrice || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Max €</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Noi luna aceasta:</span>
                  <Badge variant="secondary">+{propertiesData?.newThisMonth || 0}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Facturi</CardTitle>
            <CardDescription>Comisioane facturate</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCommissions ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cu factură</span>
                      <span className="font-medium">{commissionsData?.withInvoice || 0}</span>
                    </div>
                    <Progress 
                      value={commissionsData?.count ? ((commissionsData.withInvoice || 0) / commissionsData.count) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Fără factură</span>
                      <span className="font-medium">{commissionsData?.withoutInvoice || 0}</span>
                    </div>
                    <Progress 
                      value={commissionsData?.count ? ((commissionsData.withoutInvoice || 0) / commissionsData.count) * 100 : 0} 
                      className="h-2 [&>div]:bg-red-500"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total tranzacții:</span>
                    <span className="font-bold">{commissionsData?.count || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;