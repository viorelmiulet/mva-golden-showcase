import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Users, Euro, TicketCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RentalDashboard = () => {
  const { data: properties = [] } = useQuery({
    queryKey: ["rental-properties-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_properties")
        .select("id, status, monthly_rent, currency");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["rental-tenants-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_tenants")
        .select("id, status");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["rental-payments-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("id, amount, status, payment_type")
        .eq("status", "pending");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["rental-tickets-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_tickets")
        .select("id, status, priority");
      if (error) throw error;
      return data || [];
    },
  });

  const totalProperties = properties.length;
  const rentedProperties = properties.filter(p => p.status === "rented").length;
  const availableProperties = properties.filter(p => p.status === "available").length;
  const activeTenants = tenants.filter(t => t.status === "active").length;
  const pendingPayments = payments.length;
  const openTickets = tickets.filter(t => t.status === "open").length;
  const totalMonthlyIncome = properties
    .filter(p => p.status === "rented")
    .reduce((sum, p) => sum + (Number(p.monthly_rent) || 0), 0);

  const stats = [
    { title: "Proprietăți", value: totalProperties, subtitle: `${rentedProperties} închiriate · ${availableProperties} disponibile`, icon: Home, color: "text-cyan-400", bg: "bg-cyan-500/20" },
    { title: "Chiriași Activi", value: activeTenants, subtitle: "contracte active", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/20" },
    { title: "Venit Lunar", value: `${totalMonthlyIncome.toLocaleString()} €`, subtitle: "din chirii active", icon: Euro, color: "text-gold", bg: "bg-gold/20" },
    { title: "Plăți Restante", value: pendingPayments, subtitle: "de încasat", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/20" },
    { title: "Tichete Deschise", value: openTickets, subtitle: "de rezolvat", icon: TicketCheck, color: "text-purple-400", bg: "bg-purple-500/20" },
    { title: "Rată Ocupare", value: totalProperties > 0 ? `${Math.round((rentedProperties / totalProperties) * 100)}%` : "0%", subtitle: "din total proprietăți", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="admin-glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <Card className="admin-glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Activitate Recentă</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nu ai proprietăți adăugate încă.</p>
              <p className="text-xs mt-1">Adaugă prima proprietate pentru a începe.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ultimele modificări vor apărea aici.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalDashboard;
