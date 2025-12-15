import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  CalendarCheck, 
  Euro, 
  TrendingUp, 
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Users
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
  Cell
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

const COLORS = ['#DAA520', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const DashboardPage = () => {
  // Fetch properties count
  const { data: propertiesData, isLoading: loadingProperties } = useQuery({
    queryKey: ['dashboard-properties'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('catalog_offers')
        .select('*', { count: 'exact', head: true })
        .is('project_id', null);
      
      const { count: available } = await supabase
        .from('catalog_offers')
        .select('*', { count: 'exact', head: true })
        .is('project_id', null)
        .eq('availability_status', 'available');
      
      return { total: total || 0, available: available || 0 };
    }
  });

  // Fetch complexes count
  const { data: complexesData, isLoading: loadingComplexes } = useQuery({
    queryKey: ['dashboard-complexes'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('real_estate_projects')
        .select('*', { count: 'exact', head: true });
      
      const { count: apartments } = await supabase
        .from('catalog_offers')
        .select('*', { count: 'exact', head: true })
        .not('project_id', 'is', null);
      
      return { total: total || 0, apartments: apartments || 0 };
    }
  });

  // Fetch viewing appointments
  const { data: viewingsData, isLoading: loadingViewings } = useQuery({
    queryKey: ['dashboard-viewings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viewing_appointments')
        .select('status, created_at');
      
      if (error) throw error;
      
      const pending = data?.filter(v => v.status === 'pending').length || 0;
      const confirmed = data?.filter(v => v.status === 'confirmed').length || 0;
      const completed = data?.filter(v => v.status === 'completed').length || 0;
      const cancelled = data?.filter(v => v.status === 'cancelled').length || 0;
      
      return { total: data?.length || 0, pending, confirmed, completed, cancelled };
    }
  });

  // Fetch commissions data
  const { data: commissionsData, isLoading: loadingCommissions } = useQuery({
    queryKey: ['dashboard-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('amount, currency, date, transaction_type')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Calculate totals
      const totalEUR = data?.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalRON = data?.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      
      // Current month totals
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      const currentMonthData = data?.filter(c => {
        const date = parseISO(c.date);
        return date >= monthStart && date <= monthEnd;
      }) || [];
      
      const currentMonthEUR = currentMonthData.filter(c => c.currency === 'EUR').reduce((sum, c) => sum + Number(c.amount), 0);
      const currentMonthRON = currentMonthData.filter(c => c.currency === 'RON').reduce((sum, c) => sum + Number(c.amount), 0);
      
      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
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
          month: format(monthDate, 'MMM', { locale: ro }),
          EUR: eurTotal,
          RON: ronTotal,
          total: eurTotal + (ronTotal / 5) // Approximate EUR equivalent
        });
      }
      
      // Transaction type distribution
      const typeDistribution = [
        { name: 'Vânzare', value: data?.filter(c => c.transaction_type === 'vânzare').length || 0 },
        { name: 'Chirie', value: data?.filter(c => c.transaction_type === 'chirie').length || 0 },
      ].filter(t => t.value > 0);
      
      return { 
        totalEUR, 
        totalRON, 
        currentMonthEUR, 
        currentMonthRON,
        monthlyTrend,
        typeDistribution,
        count: data?.length || 0
      };
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
    loading 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: any;
    trend?: { value: number; positive: boolean };
    loading: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
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
              <p className={`text-xs mt-1 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
                {trend.value}% față de luna trecută
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Statistici generale și tendințe</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Proprietăți Individuale"
          value={propertiesData?.total || 0}
          subtitle={`${propertiesData?.available || 0} disponibile`}
          icon={Home}
          loading={loadingProperties}
        />
        <StatCard
          title="Complexe & Apartamente"
          value={`${complexesData?.total || 0} / ${complexesData?.apartments || 0}`}
          subtitle="complexe / apartamente"
          icon={Building2}
          loading={loadingComplexes}
        />
        <StatCard
          title="Vizionări în Așteptare"
          value={viewingsData?.pending || 0}
          subtitle={`${viewingsData?.total || 0} total programări`}
          icon={CalendarCheck}
          loading={loadingViewings}
        />
        <StatCard
          title="Utilizatori Înregistrați"
          value={usersData?.total || 0}
          icon={Users}
          loading={loadingUsers}
        />
      </div>

      {/* Commissions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Comisioane Luna Curentă
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'MMMM yyyy', { locale: ro })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCommissions ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gold">
                    {commissionsData?.currentMonthEUR?.toLocaleString()} €
                  </span>
                </div>
                {(commissionsData?.currentMonthRON || 0) > 0 && (
                  <div className="text-lg text-muted-foreground">
                    + {commissionsData?.currentMonthRON?.toLocaleString()} RON
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Total: {commissionsData?.totalEUR?.toLocaleString()} € / {commissionsData?.totalRON?.toLocaleString()} RON
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Vizionări</CardTitle>
            <CardDescription>Distribuție pe statusuri</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingViewings ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-lg font-semibold">{viewingsData?.pending}</p>
                    <p className="text-xs text-muted-foreground">În așteptare</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-lg font-semibold">{viewingsData?.confirmed}</p>
                    <p className="text-xs text-muted-foreground">Confirmate</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-lg font-semibold">{viewingsData?.completed}</p>
                    <p className="text-xs text-muted-foreground">Finalizate</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-lg font-semibold">{viewingsData?.cancelled}</p>
                    <p className="text-xs text-muted-foreground">Anulate</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Comisioane (6 luni)</CardTitle>
            <CardDescription>Evoluția comisioanelor în ultimele 6 luni</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingCommissions ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={commissionsData?.monthlyTrend || []}>
                  <defs>
                    <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DAA520" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#DAA520" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value.toLocaleString()} €`, 'EUR']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="EUR" 
                    stroke="#DAA520" 
                    fillOpacity={1} 
                    fill="url(#colorEUR)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Transaction Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuție Tip Tranzacție</CardTitle>
            <CardDescription>Comisioane pe tip de tranzacție</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingCommissions ? (
              <Skeleton className="h-full w-full" />
            ) : commissionsData?.typeDistribution && commissionsData.typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commissionsData.typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
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
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
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
    </div>
  );
};

export default DashboardPage;