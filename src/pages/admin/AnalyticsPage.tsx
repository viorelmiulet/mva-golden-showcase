import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  RefreshCw,
  BarChart3
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
  Legend
} from "recharts";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = ['#DAA520', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface AnalyticsData {
  visitors: number;
  pageviews: number;
  sessionDuration: number;
  bounceRate: number;
  dailyData: { date: string; visitors: number; pageviews: number }[];
  topPages: { page: string; visitors: number; pageviews: number }[];
  topSources: { source: string; visitors: number }[];
  sources?: { source: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  countries: { country: string; visitors: number }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AnalyticsPage = () => {
  const [days, setDays] = useState("7");
  
  const { data, isLoading, error, refetch, isFetching } = useQuery<AnalyticsData>({
    queryKey: ['plausible-analytics', days],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plausible-analytics?days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }
      
      const result = await response.json();
      return {
        ...result,
        sources: result.topSources || []
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const pageviewsPerVisit = data?.visitors ? (data.pageviews / data.visitors).toFixed(2) : '0';

  if (error) {
    return (
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-destructive/50 bg-destructive/5 p-6"
        >
          <h3 className="text-lg font-semibold text-destructive mb-2">Eroare la încărcarea datelor</h3>
          <p className="text-muted-foreground mb-4">
            Nu am putut încărca datele de analytics. Verifică dacă cheia Plausible API este configurată corect.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="border-white/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Încearcă din nou
          </Button>
        </motion.div>
      </div>
    );
  }

  const statsCards = [
    { 
      title: "Vizitatori Unici", 
      value: data?.visitors?.toLocaleString() || 0, 
      icon: Users,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400"
    },
    { 
      title: "Vizualizări Pagini", 
      value: data?.pageviews?.toLocaleString() || 0, 
      subtitle: `${pageviewsPerVisit} pagini/vizită`,
      icon: Eye,
      gradient: "from-emerald-500/20 to-green-500/20",
      iconColor: "text-emerald-400"
    },
    { 
      title: "Durată Medie Sesiune", 
      value: formatDuration(data?.sessionDuration || 0), 
      icon: Clock,
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400"
    },
    { 
      title: "Bounce Rate", 
      value: `${data?.bounceRate || 0}%`, 
      icon: TrendingUp,
      gradient: "from-gold/20 to-amber-500/20",
      iconColor: "text-gold"
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <BarChart3 className="h-6 w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Trafic</h1>
            <p className="text-muted-foreground text-sm">Date din Plausible Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Ultimele 7 zile</SelectItem>
              <SelectItem value="14">Ultimele 14 zile</SelectItem>
              <SelectItem value="30">Ultimele 30 zile</SelectItem>
              <SelectItem value="90">Ultimele 90 zile</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          <Button variant="outline" asChild className="border-white/10 hover:bg-white/5">
            <a 
              href="https://plausible.io/mvaimobiliare.ro" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Plausible
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            className="relative group"
          >
            <div className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity blur-xl",
              stat.gradient
            )} />
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.title}</span>
                <div className={cn("p-2 rounded-xl bg-white/5", stat.iconColor)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              Prezentare
            </TabsTrigger>
            <TabsTrigger value="traffic" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              Trafic
            </TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              Pagini
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Daily Traffic Chart */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Trafic Zilnic</h3>
                <p className="text-sm text-muted-foreground">Vizitatori și vizualizări în ultimele {days} zile</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.dailyData || []}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DAA520" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#DAA520" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'dd MMM', { locale: ro })}
                      className="text-xs"
                      stroke="#666"
                    />
                    <YAxis className="text-xs" stroke="#666" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background/95 backdrop-blur border border-white/10 p-3 rounded-lg shadow-lg">
                              <p className="font-medium">{format(parseISO(label), 'dd MMMM yyyy', { locale: ro })}</p>
                              <p className="text-gold">Vizitatori: {payload[0]?.value}</p>
                              <p className="text-emerald-500">Vizualizări: {payload[1]?.value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="visitors" stroke="#DAA520" fillOpacity={1} fill="url(#colorVisitors)" />
                    <Area type="monotone" dataKey="pageviews" stroke="#10b981" fillOpacity={1} fill="url(#colorPageviews)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Devices and Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Devices */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Dispozitive</h3>
                  <p className="text-sm text-muted-foreground">Distribuție pe tip de dispozitiv</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-3">
                    {data?.devices?.map((device, index) => {
                      const total = data.devices.reduce((acc, d) => acc + d.visitors, 0);
                      const percentage = total > 0 ? ((device.visitors / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={device.device} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gold/10 text-gold">
                              {getDeviceIcon(device.device)}
                            </div>
                            <span className="capitalize font-medium">{device.device}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{device.visitors}</span>
                            <Badge variant="secondary" className="bg-gold/10 text-gold border-0">
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Sources */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Surse Trafic</h3>
                  <p className="text-sm text-muted-foreground">De unde vin vizitatorii</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-3">
                    {(data?.sources || data?.topSources)?.slice(0, 5).map((source, index) => {
                      const allSources = data?.sources || data?.topSources || [];
                      const total = allSources.reduce((acc, s) => acc + s.visitors, 0);
                      const percentage = total > 0 ? ((source.visitors / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={source.source} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                              <Globe className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{source.source || 'Direct'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{source.visitors}</span>
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-0">
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            {/* Countries */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Țări</h3>
                <p className="text-sm text-muted-foreground">Distribuție geografică a vizitatorilor</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.countries || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis dataKey="country" type="category" width={80} className="text-xs" stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="visitors" fill="#DAA520" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Sources Pie Chart */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Distribuție Surse</h3>
                <p className="text-sm text-muted-foreground">Vizualizare grafică a surselor de trafic</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(data?.sources || data?.topSources)?.slice(0, 6) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="visitors"
                      nameKey="source"
                    >
                      {(data?.sources || data?.topSources)?.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            {/* Top Pages */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Pagini Populare</h3>
                <p className="text-sm text-muted-foreground">Cele mai vizitate pagini de pe site</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="space-y-3">
                  {data?.topPages?.map((page, index) => (
                    <div 
                      key={page.page} 
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gold w-8">{index + 1}</span>
                        <div>
                          <p className="font-medium truncate max-w-[300px]">{page.page}</p>
                          <p className="text-sm text-muted-foreground">{page.pageviews} vizualizări</p>
                        </div>
                      </div>
                      <Badge className="bg-gold/10 text-gold border-0">
                        {page.visitors} vizitatori
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsPage;
