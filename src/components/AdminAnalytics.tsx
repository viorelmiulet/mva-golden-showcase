import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, Clock, BarChart3, Users, Globe, Smartphone, Monitor } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  visitors: { [key: string]: number }
  pageviews: { [key: string]: number }
  pageviewsPerVisit: { [key: string]: number }
  sessionDuration: { [key: string]: number }
  bounceRate: { [key: string]: number }
  topPages: Array<{ page: string; views: number }>
  topSources: Array<{ source: string; visitors: number }>
  devices: Array<{ device: string; visitors: number }>
  countries: Array<{ country: string; visitors: number }>
}

interface AdminAnalyticsProps {
  data: AnalyticsData
}

const COLORS = ['#9333ea', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

const AdminAnalytics = ({ data }: AdminAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'engagement'>('overview')

  // Transform data for charts
  const dailyData = Object.keys(data.visitors).map(date => ({
    date: new Date(date).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' }),
    visitors: data.visitors[date],
    pageviews: data.pageviews[date],
    bounceRate: data.bounceRate[date]
  }))

  const deviceData = data.devices.map(item => ({
    name: item.device === 'desktop' ? 'Desktop' : 
          item.device === 'mobile-ios' ? 'Mobile iOS' :
          item.device === 'mobile-android' ? 'Mobile Android' : 'Bot',
    value: item.visitors
  }))

  const countryData = data.countries.map(item => ({
    name: item.country === 'RO' ? 'România' :
          item.country === 'US' ? 'SUA' :
          item.country === 'MD' ? 'Moldova' :
          item.country === 'AT' ? 'Austria' : 'Necunoscut',
    value: item.visitors
  }))

  // Calculate totals
  const totalVisitors = Object.values(data.visitors).reduce((sum, val) => sum + val, 0)
  const totalPageviews = Object.values(data.pageviews).reduce((sum, val) => sum + val, 0)
  const avgSessionDuration = Object.values(data.sessionDuration).reduce((sum, val) => sum + val, 0) / Object.values(data.sessionDuration).filter(val => val > 0).length
  const avgBounceRate = Object.values(data.bounceRate).reduce((sum, val) => sum + val, 0) / Object.values(data.bounceRate).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gold" />
            Analytics Site
          </h2>
          <p className="text-muted-foreground">Ultimele 7 zile</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('overview')}
          >
            Prezentare
          </Button>
          <Button
            variant={activeTab === 'traffic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('traffic')}
          >
            Trafic
          </Button>
          <Button
            variant={activeTab === 'engagement' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('engagement')}
          >
            Angajament
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vizitatori</p>
                <p className="text-2xl font-bold">{totalVisitors}</p>
              </div>
              <Users className="w-8 h-8 text-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vizualizări</p>
                <p className="text-2xl font-bold">{totalPageviews}</p>
              </div>
              <Eye className="w-8 h-8 text-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durată Sesiune</p>
                <p className="text-2xl font-bold">{Math.round(avgSessionDuration || 0)}s</p>
              </div>
              <Clock className="w-8 h-8 text-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{Math.round(avgBounceRate || 0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vizitatori pe Zi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#9333ea" 
                    strokeWidth={2}
                    dot={{ fill: '#9333ea' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vizualizări pe Zi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
                  <Bar dataKey="pageviews" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispozitive</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={500}
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Țări</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
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
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Pagini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{page.page === '/' ? 'Acasă' : page.page}</span>
                    </div>
                    <Badge>{page.views} vizite</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Surse Trafic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">
                        {source.source === 'Direct' ? 'Direct' :
                         source.source === 'google.com' ? 'Google' :
                         source.source === 'l.facebook.com' ? 'Facebook' :
                         source.source}
                      </span>
                    </div>
                    <Badge>{source.visitors} vizitatori</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalii Zilnice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Data</th>
                  <th className="py-2 px-4 text-right">Vizitatori</th>
                  <th className="py-2 px-4 text-right">Vizualizări</th>
                  <th className="py-2 px-4 text-right">Bounce Rate</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4">{day.date}</td>
                    <td className="py-2 px-4 text-right">{day.visitors}</td>
                    <td className="py-2 px-4 text-right">{day.pageviews}</td>
                    <td className="py-2 px-4 text-right">{day.bounceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminAnalytics