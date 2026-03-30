import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { AlertTriangle, Euro, Clock } from "lucide-react";
import { format, addDays, differenceInDays, isWithinInterval, parseISO, isBefore, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";

const RentalCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: tenants = [] } = useQuery({
    queryKey: ["rental-tenants-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_tenants").select("*, rental_properties(name, address)").eq("status", "active");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ["rental-payments-all-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("*, rental_properties(name)")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const pendingPayments = allPayments.filter(p => p.status === "pending");

  const today = new Date();
  const next30Days = addDays(today, 30);

  const expiringContracts = tenants.filter(t => {
    if (!t.contract_end) return false;
    const end = parseISO(t.contract_end);
    return isWithinInterval(end, { start: today, end: next30Days });
  });

  const overduePayments = pendingPayments.filter(p => {
    if (!p.due_date) return false;
    return isBefore(parseISO(p.due_date), today);
  });

  const upcomingPayments = pendingPayments.filter(p => {
    if (!p.due_date) return false;
    const d = parseISO(p.due_date);
    return isWithinInterval(d, { start: today, end: next30Days });
  });

  // Dates that have payments (for calendar highlighting)
  const paymentDatesMap = useMemo(() => {
    const map = new Map<string, { count: number; hasOverdue: boolean; hasPaid: boolean }>();
    allPayments.forEach(p => {
      if (!p.due_date) return;
      const key = p.due_date;
      const existing = map.get(key) || { count: 0, hasOverdue: false, hasPaid: false };
      existing.count++;
      if (p.status === "pending" && isBefore(parseISO(p.due_date), today)) {
        existing.hasOverdue = true;
      }
      if (p.status === "paid") {
        existing.hasPaid = true;
      }
      map.set(key, existing);
    });
    return map;
  }, [allPayments]);

  // Contract end dates for calendar
  const contractEndDates = useMemo(() => {
    return tenants
      .filter(t => t.contract_end)
      .map(t => parseISO(t.contract_end!));
  }, [tenants]);

  // Payments for the selected date
  const selectedDatePayments = useMemo(() => {
    if (!selectedDate) return [];
    return allPayments.filter(p => {
      if (!p.due_date) return false;
      return isSameDay(parseISO(p.due_date), selectedDate);
    });
  }, [selectedDate, allPayments]);

  // Custom day render modifiers
  const paymentDays = useMemo(() => allPayments.filter(p => p.due_date).map(p => parseISO(p.due_date)), [allPayments]);
  const overdueDays = useMemo(() => 
    allPayments.filter(p => p.due_date && p.status === "pending" && isBefore(parseISO(p.due_date), today)).map(p => parseISO(p.due_date)),
    [allPayments]
  );
  const paidDays = useMemo(() => 
    allPayments.filter(p => p.due_date && p.status === "paid").map(p => parseISO(p.due_date)),
    [allPayments]
  );

  // Next pending rent payment per property
  const nextRentPerProperty = useMemo(() => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const upcoming = pendingPayments
      .filter(p => p.due_date && p.payment_type === "rent" && !isBefore(parseISO(p.due_date), todayStart))
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    
    const map = new Map<string, typeof upcoming[0]>();
    upcoming.forEach(p => {
      const propId = p.property_id || "unknown";
      if (!map.has(propId)) map.set(propId, p);
    });
    return Array.from(map.values());
  }, [pendingPayments]);

  return (
    <div className="space-y-6">
      {/* Visual Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="admin-glass-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              📅 Calendar Plăți
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ro}
              modifiers={{
                payment: paymentDays,
                overdue: overdueDays,
                paid: paidDays,
                contractEnd: contractEndDates,
              }}
              modifiersClassNames={{
                payment: "ring-2 ring-primary/50 ring-inset",
                overdue: "bg-red-500/20 text-red-400 font-bold",
                paid: "bg-green-500/20 text-green-400",
                contractEnd: "ring-2 ring-orange-400/60 ring-inset",
              }}
              className="rounded-md"
            />
          </CardContent>
          <div className="px-6 pb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm ring-2 ring-primary/50 inline-block" /> Plată scadentă</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/30 inline-block" /> Restantă</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/30 inline-block" /> Plătită</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm ring-2 ring-orange-400/60 inline-block" /> Expirare contract</span>
          </div>
        </Card>

        {/* Selected date details */}
        <Card className="admin-glass-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate
                ? format(selectedDate, "d MMMM yyyy", { locale: ro })
                : "Selectează o zi"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click pe o zi din calendar pentru a vedea detaliile.
              </p>
            ) : selectedDatePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nu sunt plăți programate în această zi.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDatePayments.map(p => {
                  const isOverdue = p.status === "pending" && isBefore(parseISO(p.due_date), today);
                  const isPaid = p.status === "paid";
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isOverdue
                          ? "bg-red-500/5 border-red-500/20"
                          : isPaid
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{(p as any).rental_properties?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.payment_type}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${isOverdue ? "text-red-400" : isPaid ? "text-green-400" : ""}`}>
                          {p.amount} {p.currency}
                        </span>
                        {isPaid && <p className="text-xs text-green-400">Plătit</p>}
                        {isOverdue && <p className="text-xs text-red-400">Restant</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
