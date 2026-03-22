import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  BarChart3,
  MousePointerClick
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
import { format, parseISO, subDays } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = ['#DAA520', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AnalyticsPage = () => {
  const [days, setDays] = useState("7");
  const daysNum = parseInt(days);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['internal-analytics', days],
    queryFn: async () => {
      const since = subDays(new Date(), daysNum).toISOString();

      const [pvRes, evRes] = await Promise.all([
        supabase.from('page_views').select('*').gte('created_at', since).order('created_at', { ascending: true }),
        supabase.from('events').select('*').gte('created_at', since).order('created_at', { ascending: true }),
      ]);

      // Filter out admin traffic
      const pageViews = (pvRes.data || []).filter((pv: any) => !pv.page_path?.startsWith('/admin')) as any[];
      const events = (evRes.data || []).filter((ev: any) => !ev.page_path?.startsWith('/admin')) as any[];

      // Unique visitors
      const uniqueSessions = new Set(pageViews.map(pv => pv.session_id));
      const visitors = uniqueSessions.size;
      const pageviewsCount = pageViews.length;

      // Avg duration
      const durations = pageViews.filter(pv => pv.duration_seconds > 0).map(pv => pv.duration_seconds);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      // Bounce rate: sessions with only 1 pageview
      const sessionCounts: Record<string, number> = {};
      pageViews.forEach(pv => { sessionCounts[pv.session_id] = (sessionCounts[pv.session_id] || 0) + 1; });
      const totalSessions = Object.keys(sessionCounts).length;
      const bounceSessions = Object.values(sessionCounts).filter(c => c === 1).length;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      // Daily data
      const dailyMap: Record<string, { visitors: Set<string>; pageviews: number }> = {};
      pageViews.forEach(pv => {
        const day = pv.created_at.substring(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { visitors: new Set(), pageviews: 0 };
        dailyMap[day].visitors.add(pv.session_id);
        dailyMap[day].pageviews++;
      });
      const dailyData = Object.entries(dailyMap)
        .map(([date, d]) => ({ date, visitors: d.visitors.size, pageviews: d.pageviews }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top pages
      const pageMap: Record<string, { views: number; sessions: Set<string> }> = {};
      pageViews.forEach(pv => {
        if (!pageMap[pv.page_path]) pageMap[pv.page_path] = { views: 0, sessions: new Set() };
        pageMap[pv.page_path].views++;
        pageMap[pv.page_path].sessions.add(pv.session_id);
      });
      const topPages = Object.entries(pageMap)
        .map(([page, d]) => ({ page, pageviews: d.views, visitors: d.sessions.size }))
        .sort((a, b) => b.pageviews - a.pageviews)
        .slice(0, 10);

      // Sources
      const sourceMap: Record<string, Set<string>> = {};
      pageViews.forEach(pv => {
        let source = 'Direct';
        if (pv.utm_source) source = pv.utm_source;
        else if (pv.referrer) {
          if (pv.referrer.includes('google')) source = 'Google Organic';
          else if (pv.referrer.includes('facebook')) source = 'Facebook';
          else if (pv.referrer.includes('instagram')) source = 'Instagram';
          else source = pv.referrer.replace(/https?:\/\//, '').split('/')[0];
        }
        if (!sourceMap[source]) sourceMap[source] = new Set();
        sourceMap[source].add(pv.session_id);
      });
      const topSources = Object.entries(sourceMap)
        .map(([source, sessions]) => ({ source, visitors: sessions.size }))
        .sort((a, b) => b.visitors - a.visitors);

      // Devices
      const deviceMap: Record<string, Set<string>> = {};
      pageViews.forEach(pv => {
        const d = pv.device_type || 'desktop';
        if (!deviceMap[d]) deviceMap[d] = new Set();
        deviceMap[d].add(pv.session_id);
      });
      const devices = Object.entries(deviceMap)
        .map(([device, sessions]) => ({ device, visitors: sessions.size }))
        .sort((a, b) => b.visitors - a.visitors);

      // Events
      const eventMap: Record<string, number> = {};
      events.forEach(ev => {
        eventMap[ev.event_type] = (eventMap[ev.event_type] || 0) + 1;
      });
      const eventStats = Object.entries(eventMap)
        .map(([event_type, total]) => ({ event_type, total }))
        .sort((a, b) => b.total - a.total);

      return {
        visitors,
        pageviews: pageviewsCount,
        avgDuration,
        bounceRate,
        dailyData,
        topPages,
        topSources,
        devices,
        eventStats,
      };
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
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

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      'contact_whatsapp': 'WhatsApp',
      'contact_phone': 'Telefon',
      'contact_form': 'Formular',
      'property_view': 'Vizualizare Proprietate',
    };
    return labels[type] || type;
  };

  const pageviewsPerVisit = data?.visitors ? (data.pageviews / data.visitors).toFixed(2) : '0';

  const statsCards = [
    { title: "Vizitatori Unici", value: data?.visitors?.toLocaleString() || 0, icon: Users, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400" },
    { title: "Vizualizări Pagini", value: data?.pageviews?.toLocaleString() || 0, subtitle: `${pageviewsPerVisit} pagini/vizită`, icon: Eye, gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-400" },
    { title: "Durată Medie Sesiune", value: formatDuration(data?.avgDuration || 0), icon: Clock, gradient: "from-purple-500/20 to-violet-500/20", iconColor: "text-purple-400" },
    { title: "Bounce Rate", value: `${data?.bounceRate || 0}%`, icon: TrendingUp, gradient: "from-gold/20 to-amber-500/20", iconColor: "text-gold" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
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
            <h1 className="text-2xl font-bold text-foreground">Analytics Intern</h1>
            <p className="text-muted-foreground text-sm">Date colectate direct din aplicație</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Azi</SelectItem>
              <SelectItem value="7">Ultimele 7 zile</SelectItem>
              <SelectItem value="30">Ultimele 30 zile</SelectItem>
              <SelectItem value="90">Ultimele 90 zile</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="border-white/10 hover:bg-white/5" aria-label="Reîmprospătează datele">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants} className="relative group">
            <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity blur-xl", stat.gradient)} />
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.title}</span>
                <div className={cn("p-2 rounded-xl bg-white/5", stat.iconColor)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
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
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">Prezentare</TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">Pagini</TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">Contacte</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Daily Traffic Chart */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Trafic Zilnic</h3>
                <p className="text-sm text-muted-foreground">Vizitatori și vizualizări în ultimele {days} zile</p>
              </div>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
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
                    <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), 'dd MMM', { locale: ro })} className="text-xs" stroke="#666" />
                    <YAxis className="text-xs" stroke="#666" />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur border border-white/10 p-3 rounded-lg shadow-lg">
                            <p className="font-medium">{format(parseISO(label), 'dd MMMM yyyy', { locale: ro })}</p>
                            <p className="text-gold">Vizitatori: {payload[0]?.value}</p>
                            <p className="text-emerald-500">Vizualizări: {payload[1]?.value}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
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
                </div>
                {isLoading ? <Skeleton className="h-[200px] w-full" /> : (
                  <div className="space-y-3">
                    {data?.devices?.map((device) => {
                      const total = data.devices.reduce((acc, d) => acc + d.visitors, 0);
                      const percentage = total > 0 ? ((device.visitors / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={device.device} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gold/10 text-gold">{getDeviceIcon(device.device)}</div>
                            <span className="capitalize font-medium">{device.device}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{device.visitors}</span>
                            <Badge variant="secondary" className="bg-gold/10 text-gold border-0">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sources */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Surse Trafic</h3>
                </div>
                {isLoading ? <Skeleton className="h-[200px] w-full" /> : (
                  <div className="space-y-3">
                    {data?.topSources?.slice(0, 6).map((source) => {
                      const total = data.topSources.reduce((acc, s) => acc + s.visitors, 0);
                      const percentage = total > 0 ? ((source.visitors / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={source.source} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Globe className="h-4 w-4" /></div>
                            <span className="font-medium">{source.source}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{source.visitors}</span>
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-0">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Pagini Populare</h3>
              </div>
              {isLoading ? <Skeleton className="h-[400px] w-full" /> : (
                <div className="space-y-3">
                  {data?.topPages?.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gold w-8">{index + 1}</span>
                        <div>
                          <p className="font-medium truncate max-w-[300px]">{page.page}</p>
                          <p className="text-sm text-muted-foreground">{page.pageviews} vizualizări</p>
                        </div>
                      </div>
                      <Badge className="bg-gold/10 text-gold border-0">{page.visitors} vizitatori</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5 text-gold" />
                  Contacte & Evenimente
                </h3>
                <p className="text-sm text-muted-foreground">Acțiuni ale vizitatorilor în ultimele {days} zile</p>
              </div>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <div className="space-y-3">
                  {data?.eventStats?.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Nu sunt evenimente în această perioadă.</p>
                  )}
                  {data?.eventStats?.map((ev) => (
                    <div key={ev.event_type} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <MousePointerClick className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{getEventLabel(ev.event_type)}</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-base px-3">{ev.total}</Badge>
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
