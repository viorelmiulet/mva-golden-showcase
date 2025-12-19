import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ArrowUpRight,
  ExternalLink,
  RefreshCw
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
      // Map topSources to sources for compatibility
      return {
        ...result,
        sources: result.topSources || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Eroare la încărcarea datelor</CardTitle>
            <CardDescription>
              Nu am putut încărca datele de analytics. Verifică dacă cheia Plausible API este configurată corect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Încearcă din nou
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Trafic</h1>
          <p className="text-muted-foreground">Date din Plausible Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px]">
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
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" asChild>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vizitatori Unici</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{data?.visitors?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vizualizări Pagini</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.pageviews?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">{pageviewsPerVisit} pagini/vizită</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Durată Medie Sesiune</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatDuration(data?.sessionDuration || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{data?.bounceRate || 0}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Prezentare</TabsTrigger>
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
          <TabsTrigger value="pages">Pagini</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Daily Traffic Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trafic Zilnic</CardTitle>
              <CardDescription>Vizitatori și vizualizări în ultimele {days} zile</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'dd MMM', { locale: ro })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
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
            </CardContent>
          </Card>

          {/* Devices and Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Devices */}
            <Card>
              <CardHeader>
                <CardTitle>Dispozitive</CardTitle>
                <CardDescription>Distribuție pe tip de dispozitiv</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-3">
                    {data?.devices?.map((device, index) => {
                      const total = data.devices.reduce((acc, d) => acc + d.visitors, 0);
                      const percentage = total > 0 ? ((device.visitors / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={device.device} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device.device)}
                            <span className="capitalize">{device.device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{device.visitors}</span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Surse Trafic</CardTitle>
                <CardDescription>De unde vin vizitatorii</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-3">
                    {(data?.sources || data?.topSources)?.slice(0, 5).map((source, index) => {
                      const allSources = data?.sources || data?.topSources || [];
                      const total = allSources.reduce((acc, s) => acc + s.visitors, 0);
                      const percentage = total > 0 ? ((source.visitors / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{source.source || 'Direct'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{source.visitors}</span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle>Țări</CardTitle>
              <CardDescription>Distribuție geografică a vizitatorilor</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.countries || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" width={80} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="visitors" fill="#DAA520" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sources Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuție Surse</CardTitle>
              <CardDescription>Vizualizare grafică a surselor de trafic</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Pagini Populare</CardTitle>
              <CardDescription>Cele mai vizitate pagini de pe site</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="space-y-3">
                  {data?.topPages?.map((page, index) => (
                    <div 
                      key={page.page} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gold w-6">{index + 1}</span>
                        <div>
                          <p className="font-medium truncate max-w-[300px]">{page.page}</p>
                          <p className="text-sm text-muted-foreground">{page.pageviews} vizualizări</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{page.visitors} vizitatori</Badge>
                        <Button variant="ghost" size="icon" asChild>
                          <a 
                            href={`https://mvaimobiliare.ro${page.page}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
