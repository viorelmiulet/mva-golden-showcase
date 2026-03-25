import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Eye,
  TrendingUp,
  Search,
  ArrowUpDown,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

interface PropertyViewStat {
  page_path: string;
  views: number;
  unique_sessions: number;
  avg_duration: number;
  title: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const PropertyViewsPage = () => {
  const [days, setDays] = useState("30");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"views" | "unique_sessions" | "avg_duration">("views");
  const daysNum = parseInt(days);
  const since = subDays(new Date(), daysNum).toISOString();

  // Fetch per-property stats
  const { data: propertyStats, isLoading } = useQuery({
    queryKey: ["property-view-stats", days],
    queryFn: async () => {
      // Fetch all rows in batches of 1000 to avoid the default limit
      const allRows: { page_path: string; session_id: string; duration_seconds: number | null; page_title: string | null }[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("page_views")
          .select("page_path, session_id, duration_seconds, page_title")
          .like("page_path", "/proprietati/%")
          .neq("page_path", "/proprietati")
          .gte("created_at", since)
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      // Aggregate
      const map = new Map<string, { views: number; sessions: Set<string>; totalDuration: number; title: string }>();
      for (const v of allRows) {
        if (v.page_path.split("/").length < 3) continue;
        const existing = map.get(v.page_path);
        if (existing) {
          existing.views++;
          existing.sessions.add(v.session_id);
          existing.totalDuration += v.duration_seconds || 0;
        } else {
          map.set(v.page_path, {
            views: 1,
            sessions: new Set([v.session_id]),
            totalDuration: v.duration_seconds || 0,
            title: v.page_title || v.page_path.split("/").pop()?.replace(/-/g, " ") || "",
          });
        }
      }

      const stats: PropertyViewStat[] = Array.from(map.entries()).map(([path, s]) => ({
        page_path: path,
        views: s.views,
        unique_sessions: s.sessions.size,
        avg_duration: s.views > 0 ? Math.round(s.totalDuration / s.views) : 0,
        title: s.title,
      }));

      return stats;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch daily trend
  const { data: dailyTrend } = useQuery({
    queryKey: ["property-views-trend", days],
    queryFn: async () => {
      const allRows: { created_at: string }[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("page_views")
          .select("created_at")
          .like("page_path", "/proprietati/%")
          .neq("page_path", "/proprietati")
          .gte("created_at", since)
          .range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      const dayMap = new Map<string, number>();
      for (let i = 0; i < daysNum; i++) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        dayMap.set(d, 0);
      }
      for (const v of allRows) {
        const d = format(parseISO(v.created_at), "yyyy-MM-dd");
        dayMap.set(d, (dayMap.get(d) || 0) + 1);
      }

      return Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, views]) => ({
          date: format(parseISO(date), "dd MMM", { locale: ro }),
          vizualizari: views,
        }));
    },
    staleTime: 2 * 60 * 1000,
  });

  // Filter & sort
  const filteredStats = (propertyStats || [])
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.page_path.toLowerCase().includes(q);
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const totalViews = (propertyStats || []).reduce((sum, s) => sum + s.views, 0);
  const totalUnique = (propertyStats || []).reduce((sum, s) => sum + s.unique_sessions, 0);
  const avgDuration = totalViews > 0
    ? Math.round((propertyStats || []).reduce((sum, s) => sum + s.avg_duration * s.views, 0) / totalViews)
    : 0;

  // Top 10 for chart
  const top10 = [...(propertyStats || [])]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map((s) => ({
      name: s.title.length > 30 ? s.title.substring(0, 30) + "…" : s.title,
      vizualizari: s.views,
      unice: s.unique_sessions,
    }));

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-gold" />
            Vizualizări Proprietăți
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statistici detaliate per proprietate din ultimele {days} zile
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 zile</SelectItem>
            <SelectItem value="30">30 zile</SelectItem>
            <SelectItem value="90">90 zile</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Vizualizări</p>
                <p className="text-2xl font-bold">{isLoading ? "–" : totalViews.toLocaleString("ro-RO")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sesiuni Unice</p>
                <p className="text-2xl font-bold">{isLoading ? "–" : totalUnique.toLocaleString("ro-RO")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Proprietăți Vizualizate</p>
                <p className="text-2xl font-bold">{isLoading ? "–" : (propertyStats || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Trend Chart */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend Zilnic Vizualizări Proprietăți</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTrend ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="vizualizari"
                    name="Vizualizări"
                    stroke="hsl(var(--gold))"
                    fill="url(#goldGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[250px] w-full" />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 10 Chart */}
      {top10.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 10 Proprietăți</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="vizualizari" name="Vizualizări" fill="hsl(var(--gold))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="unice" name="Sesiuni Unice" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base">Toate Proprietățile</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută proprietate..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 w-[200px]"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[150px] h-9">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">Vizualizări</SelectItem>
                    <SelectItem value="unique_sessions">Sesiuni Unice</SelectItem>
                    <SelectItem value="avg_duration">Durată Medie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nu au fost găsite proprietăți cu vizualizări în perioada selectată.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">#</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Proprietate</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Vizualizări</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Sesiuni Unice</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Durată Medie</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStats.map((stat, idx) => (
                      <tr key={stat.page_path} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-2 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2.5 px-2">
                          <div className="max-w-[300px]">
                            <p className="font-medium truncate">{stat.title || stat.page_path}</p>
                            <p className="text-xs text-muted-foreground truncate">{stat.page_path}</p>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <Badge variant="secondary" className="font-mono">
                            {stat.views}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                          {stat.unique_sessions}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                          {stat.avg_duration}s
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <a
                            href={stat.page_path}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PropertyViewsPage;
