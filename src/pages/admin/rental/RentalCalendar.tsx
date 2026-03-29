import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, Euro, Clock } from "lucide-react";
import { format, addDays, isWithinInterval, parseISO, isBefore } from "date-fns";
import { ro } from "date-fns/locale";

const RentalCalendar = () => {
  const { data: tenants = [] } = useQuery({
    queryKey: ["rental-tenants-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_tenants").select("*, rental_properties(name, address)").eq("status", "active");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["rental-payments-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("*, rental_properties(name)")
        .eq("status", "pending")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const today = new Date();
  const next30Days = addDays(today, 30);

  const expiringContracts = tenants.filter(t => {
    if (!t.contract_end) return false;
    const end = parseISO(t.contract_end);
    return isWithinInterval(end, { start: today, end: next30Days });
  });

  const overduePayments = payments.filter(p => {
    if (!p.due_date) return false;
    return isBefore(parseISO(p.due_date), today);
  });

  const upcomingPayments = payments.filter(p => {
    if (!p.due_date) return false;
    const d = parseISO(p.due_date);
    return isWithinInterval(d, { start: today, end: next30Days });
  });

  return (
    <div className="space-y-6">
      {/* Expiring contracts */}
      <Card className="admin-glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Contracte care Expiră (30 zile)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Niciun contract nu expiră în următoarele 30 de zile.</p>
          ) : (
            <div className="space-y-3">
              {expiringContracts.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{(t as any).rental_properties?.name || "—"}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Expiră {format(parseISO(t.contract_end!), "d MMM yyyy", { locale: ro })}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue payments */}
      <Card className="admin-glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="h-4 w-4 text-red-400" />
            Plăți Restante
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overduePayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nu sunt plăți restante.</p>
          ) : (
            <div className="space-y-3">
              {overduePayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div>
                    <p className="text-sm font-medium">{(p as any).rental_properties?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.payment_type} · Scadent {format(parseISO(p.due_date), "d MMM", { locale: ro })}</p>
                  </div>
                  <span className="text-sm font-bold text-red-400">{p.amount} {p.currency}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming payments */}
      <Card className="admin-glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            Plăți Următoare (30 zile)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nu sunt plăți programate.</p>
          ) : (
            <div className="space-y-3">
              {upcomingPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{(p as any).rental_properties?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.payment_type} · {format(parseISO(p.due_date), "d MMM", { locale: ro })}</p>
                  </div>
                  <span className="text-sm font-semibold">{p.amount} {p.currency}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalCalendar;
