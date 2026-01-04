import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import RentalImageUpload from "@/components/RentalImageUpload";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  Bed,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Star,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Upload,
  Link,
  Copy,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Settings2,
  ExternalLink,
  Loader2
} from "lucide-react";

interface ShortTermRental {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  rooms: number;
  bathrooms: number;
  max_guests: number;
  surface: number;
  amenities: string[];
  images: string[];
  base_price: number;
  currency: string;
  min_nights: number;
  check_in_time: string;
  check_out_time: string;
  rules: string;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

interface RentalBooking {
  id: string;
  rental_id: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  num_guests: number;
  total_price: number;
  currency: string;
  status: string;
  notes: string;
  payment_status: string;
  created_at: string;
  short_term_rentals?: { title: string };
}

interface ICalSource {
  id: string;
  rental_id: string;
  source_name: string;
  ical_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  sync_interval_hours: number;
  created_at: string;
  short_term_rentals?: { title: string };
}

const emptyRental: Partial<ShortTermRental> = {
  title: "",
  description: "",
  location: "",
  address: "",
  rooms: 1,
  bathrooms: 1,
  max_guests: 2,
  surface: 0,
  amenities: [],
  images: [],
  base_price: 50,
  currency: "EUR",
  min_nights: 1,
  check_in_time: "14:00",
  check_out_time: "11:00",
  rules: "",
  contact_phone: "",
  contact_email: "",
  is_active: true,
  is_featured: false,
};

const ShortTermRentalsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRental, setEditingRental] = useState<Partial<ShortTermRental> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRentalForCalendar, setSelectedRentalForCalendar] = useState<ShortTermRental | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [priceOverride, setPriceOverride] = useState("");
  const [blockDates, setBlockDates] = useState(false);
  const [icalUrl, setIcalUrl] = useState("");
  const [icalSourceName, setIcalSourceName] = useState("");
  const [importingIcal, setImportingIcal] = useState(false);
  const [selectedRentalForIcal, setSelectedRentalForIcal] = useState<ShortTermRental | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [syncInterval, setSyncInterval] = useState(6);
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [importingAirbnb, setImportingAirbnb] = useState(false);
  const [airbnbPreview, setAirbnbPreview] = useState<any>(null);
  const [bookingUrl, setBookingUrl] = useState("");
  const [importingBooking, setImportingBooking] = useState(false);
  const [bookingPreview, setBookingPreview] = useState<any>(null);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["admin-short-term-rentals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("short_term_rentals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ShortTermRental[];
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-rental-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_bookings")
        .select("*, short_term_rentals(title)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RentalBooking[];
    },
  });

  const { data: icalSources = [], isLoading: icalSourcesLoading } = useQuery({
    queryKey: ["admin-ical-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_ical_sources")
        .select("*, short_term_rentals(title)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ICalSource[];
    },
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["admin-rental-availability", selectedRentalForCalendar?.id, calendarMonth],
    queryFn: async () => {
      if (!selectedRentalForCalendar) return [];
      
      const start = startOfMonth(calendarMonth);
      const end = endOfMonth(addDays(calendarMonth, 60));
      
      const { data, error } = await supabase
        .from("rental_availability")
        .select("*")
        .eq("rental_id", selectedRentalForCalendar.id)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRentalForCalendar,
  });

  const saveMutation = useMutation({
    mutationFn: async (rental: Partial<ShortTermRental>) => {
      if (rental.id) {
        const { id, created_at, ...updateData } = rental;
        const { error } = await supabase
          .from("short_term_rentals")
          .update(updateData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { id: _, created_at: __, ...insertData } = rental;
        const { error } = await supabase
          .from("short_term_rentals")
          .insert(insertData as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-short-term-rentals"] });
      setIsDialogOpen(false);
      setEditingRental(null);
      toast({ title: "Salvat cu succes!" });
    },
    onError: (error) => {
      toast({ title: "Eroare", description: String(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("short_term_rentals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-short-term-rentals"] });
      toast({ title: "Șters cu succes!" });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status, payment_status }: { id: string; status?: string; payment_status?: string }) => {
      const updates: Record<string, string> = {};
      if (status) updates.status = status;
      if (payment_status) updates.payment_status = payment_status;
      
      const { error } = await supabase
        .from("rental_bookings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rental-bookings"] });
      toast({ title: "Actualizat!" });
    },
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRentalForCalendar || selectedDates.length === 0) return;
      
      const records = selectedDates.map(date => ({
        rental_id: selectedRentalForCalendar.id,
        date: format(date, "yyyy-MM-dd"),
        is_available: !blockDates,
        custom_price: priceOverride ? parseFloat(priceOverride) : null,
      }));

      // Upsert availability records
      for (const record of records) {
        const { error } = await supabase
          .from("rental_availability")
          .upsert(record, { onConflict: "rental_id,date" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rental-availability"] });
      setSelectedDates([]);
      setPriceOverride("");
      setBlockDates(false);
      toast({ title: "Disponibilitate actualizată!" });
    },
  });

  const addIcalSourceMutation = useMutation({
    mutationFn: async (data: { rental_id: string; source_name: string; ical_url: string; sync_interval_hours: number }) => {
      const { error } = await supabase
        .from("rental_ical_sources")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ical-sources"] });
      setIcalUrl("");
      setIcalSourceName("");
      setSyncInterval(6);
      toast({ title: "Sursă iCal adăugată!", description: "Sincronizarea automată va rula periodic" });
    },
    onError: (error: any) => {
      const message = error?.message || (typeof error === 'string' ? error : 'Eroare la adăugarea sursei iCal');
      toast({ title: "Eroare", description: message, variant: "destructive" });
    },
  });

  const deleteIcalSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rental_ical_sources")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ical-sources"] });
      toast({ title: "Sursă ștearsă!" });
    },
  });

  const toggleIcalSourceMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("rental_ical_sources")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ical-sources"] });
      toast({ title: "Status actualizat!" });
    },
  });

  const syncAllSources = async () => {
    setSyncingAll(true);
    try {
      const response = await supabase.functions.invoke("rental-ical-sync");
      if (response.error) throw new Error(response.error.message);
      
      const data = response.data;
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const errorCount = data.results?.filter((r: any) => !r.success).length || 0;
      
      queryClient.invalidateQueries({ queryKey: ["admin-ical-sources"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rental-availability"] });
      
      toast({ 
        title: "Sincronizare completă!", 
        description: `${successCount} surse sincronizate cu succes${errorCount > 0 ? `, ${errorCount} erori` : ""}` 
      });
    } catch (error: any) {
      toast({ title: "Eroare la sincronizare", description: error.message, variant: "destructive" });
    } finally {
      setSyncingAll(false);
    }
  };

  const syncSingleSource = async (source: ICalSource) => {
    setSyncingSourceId(source.id);
    try {
      const response = await supabase.functions.invoke("rental-ical-import", {
        body: {
          rental_id: source.rental_id,
          ical_url: source.ical_url,
          source_name: source.source_name,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error || "Eroare la sincronizare");

      // Update last sync status
      await supabase
        .from("rental_ical_sources")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success",
          last_sync_error: null,
        })
        .eq("id", source.id);

      queryClient.invalidateQueries({ queryKey: ["admin-ical-sources"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rental-availability"] });

      toast({
        title: "Sincronizat cu succes!",
        description: `${response.data.imported_dates || 0} date importate din ${source.source_name}`,
      });
    } catch (error: any) {
      // Update error status
      await supabase
        .from("rental_ical_sources")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "error",
          last_sync_error: error.message,
        })
        .eq("id", source.id);

      queryClient.invalidateQueries({ queryKey: ["admin-ical-sources"] });
      toast({
        title: "Eroare la sincronizare",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncingSourceId(null);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const exists = prev.some(d => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));
      if (exists) {
        return prev.filter(d => format(d, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd"));
      }
      return [...prev, date];
    });
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = availability.find(a => a.date === dateStr);
    
    if (record && !record.is_available) return "blocked";
    if (record?.custom_price) return "custom-price";
    return "available";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-500">Confirmat</Badge>;
      case "pending": return <Badge className="bg-yellow-500">În așteptare</Badge>;
      case "cancelled": return <Badge variant="destructive">Anulat</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500">Plătit</Badge>;
      case "partial": return <Badge className="bg-yellow-500">Parțial</Badge>;
      case "unpaid": return <Badge variant="destructive">Neplătit</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Regim Hotelier</h1>
        <Button onClick={() => { setEditingRental(emptyRental); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Adaugă proprietate
        </Button>
      </div>

      <Tabs defaultValue="properties">
        <TabsList className="flex-wrap">
          <TabsTrigger value="properties">Proprietăți</TabsTrigger>
          <TabsTrigger value="bookings">Rezervări ({bookings.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="ical">Sincronizare iCal</TabsTrigger>
          <TabsTrigger value="import-airbnb">Import Airbnb</TabsTrigger>
          <TabsTrigger value="import-booking">Import Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Se încarcă...</div>
          ) : rentals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nu există proprietăți</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rentals.map(rental => (
                <Card key={rental.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{rental.title}</CardTitle>
                      <div className="flex gap-1">
                        {rental.is_featured && <Star className="w-4 h-4 text-gold fill-gold" />}
                        {rental.is_active ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rental.location && (
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {rental.location}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm mb-3">
                      <span className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        {rental.rooms}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {rental.max_guests}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-gold mb-4">
                      {rental.base_price} {rental.currency}/noapte
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setEditingRental(rental); setIsDialogOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedRentalForCalendar(rental)}
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(rental.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proprietate</TableHead>
                  <TableHead>Oaspete</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.short_term_rentals?.title || "-"}</TableCell>
                    <TableCell>
                      <div>{booking.guest_name}</div>
                      <div className="text-sm text-muted-foreground">{booking.guest_phone}</div>
                    </TableCell>
                    <TableCell>{format(new Date(booking.check_in), "PP", { locale: ro })}</TableCell>
                    <TableCell>{format(new Date(booking.check_out), "PP", { locale: ro })}</TableCell>
                    <TableCell className="font-bold">{booking.total_price} {booking.currency}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, status: "confirmed" })}
                        >
                          Confirmă
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, payment_status: "paid" })}
                        >
                          Plătit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nu există rezervări
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ical">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Calendar (iCal)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exportă calendarul de disponibilitate pentru a-l importa în alte platforme 
                  (Airbnb, Booking.com, Google Calendar, etc.)
                </p>

                <div className="space-y-2">
                  <Label>Selectează proprietatea</Label>
                  {rentals.map(rental => (
                    <div key={rental.id} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{rental.title}</p>
                        <p className="text-xs text-muted-foreground">{rental.location}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rental-ical-export?rental_id=${rental.id}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: "Link copiat!", description: "Folosește acest link pentru import în alte platforme" });
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiază link
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rental-ical-export?rental_id=${rental.id}`, "_blank");
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Descarcă
                      </Button>
                    </div>
                  ))}
                </div>

                {rentals.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    Nu există proprietăți pentru export
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Surse iCal configurate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Sursele configurate sunt sincronizate automat periodic.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncAllSources}
                    disabled={syncingAll}
                  >
                    {syncingAll ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sincronizează acum
                  </Button>
                </div>

                {icalSources.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    Nu există surse iCal configurate
                  </p>
                ) : (
                  <div className="space-y-2">
                    {icalSources.map(source => (
                      <div key={source.id} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{source.source_name}</p>
                            {source.is_active ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activ</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500">Inactiv</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {source.short_term_rentals?.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>La {source.sync_interval_hours}h</span>
                            {source.last_sync_at && (
                              <>
                                <span>•</span>
                                {source.last_sync_status === "success" ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {format(new Date(source.last_sync_at), "dd.MM HH:mm")}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <XCircle className="w-3 h-3" />
                                    Eroare
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={syncingSourceId === source.id}
                          onClick={() => syncSingleSource(source)}
                          title="Sincronizează acum"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncingSourceId === source.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Switch
                          checked={source.is_active}
                          onCheckedChange={(checked) => 
                            toggleIcalSourceMutation.mutate({ id: source.id, is_active: checked })
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Ești sigur că vrei să ștergi această sursă?")) {
                              deleteIcalSourceMutation.mutate(source.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 space-y-3">
                  <p className="font-medium text-sm">Adaugă sursă nouă</p>
                  
                  <div>
                    <Label>Proprietate</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {rentals.map(rental => (
                        <Button
                          key={rental.id}
                          variant={selectedRentalForIcal?.id === rental.id ? "default" : "outline"}
                          className="justify-start text-left h-auto py-2"
                          onClick={() => setSelectedRentalForIcal(rental)}
                          size="sm"
                        >
                          <span className="truncate">{rental.title}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedRentalForIcal && (
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div>
                        <Label>Numele sursei *</Label>
                        <Input
                          value={icalSourceName}
                          onChange={(e) => setIcalSourceName(e.target.value)}
                          placeholder="ex: Airbnb, Booking.com"
                        />
                      </div>

                      <div>
                        <Label>Link iCal (URL) *</Label>
                        <Input
                          value={icalUrl}
                          onChange={(e) => setIcalUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <Label>Interval sincronizare (ore)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          value={syncInterval}
                          onChange={(e) => setSyncInterval(parseInt(e.target.value) || 6)}
                        />
                      </div>

                      <Button
                        className="w-full"
                        disabled={!icalUrl || !icalSourceName || addIcalSourceMutation.isPending}
                        onClick={() => {
                          if (!selectedRentalForIcal) return;
                          addIcalSourceMutation.mutate({
                            rental_id: selectedRentalForIcal.id,
                            source_name: icalSourceName,
                            ical_url: icalUrl,
                            sync_interval_hours: syncInterval,
                          });
                        }}
                      >
                        {addIcalSourceMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Se adaugă...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Adaugă sursă
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p><strong>Sfaturi:</strong></p>
                  <p>• Airbnb: Setări → Calendar & disponibilitate → Export calendar</p>
                  <p>• Booking.com: Tarifuri și disponibilitate → Sincronizare calendar</p>
                  <p>• Sincronizarea automată rulează la intervalul configurat</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import-airbnb">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Import din Airbnb
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Importă detaliile unei proprietăți direct din pagina Airbnb.
                </p>

                <div>
                  <Label>Link Airbnb</Label>
                  <Input
                    value={airbnbUrl}
                    onChange={(e) => setAirbnbUrl(e.target.value)}
                    placeholder="https://www.airbnb.com/rooms/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Copiază link-ul complet al proprietății de pe Airbnb
                  </p>
                </div>

                <Button
                  className="w-full"
                  disabled={!airbnbUrl || importingAirbnb}
                  onClick={async () => {
                    if (!airbnbUrl) return;
                    
                    setImportingAirbnb(true);
                    setAirbnbPreview(null);
                    
                    try {
                      const response = await supabase.functions.invoke("import-airbnb-listing", {
                        body: { airbnb_url: airbnbUrl, import_to_rentals: false },
                      });

                      if (response.error) {
                        throw new Error(response.error.message);
                      }

                      if (!response.data.success) {
                        throw new Error(response.data.error || "Eroare la import");
                      }

                      setAirbnbPreview(response.data.data);
                      toast({ title: "Date extrase cu succes!", description: "Verifică și confirmă importul" });
                    } catch (error: any) {
                      console.error("Import error:", error);
                      toast({
                        title: "Eroare la extragere",
                        description: error.message || "Nu s-au putut extrage datele",
                        variant: "destructive",
                      });
                    } finally {
                      setImportingAirbnb(false);
                    }
                  }}
                >
                  {importingAirbnb ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Se extrag datele...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Extrage detalii
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p><strong>Ce se importă:</strong></p>
                  <p>• Titlu, descriere, locație</p>
                  <p>• Preț pe noapte, număr camere, oaspeți</p>
                  <p>• Facilități, imagini, reguli</p>
                  <p>• Check-in/check-out</p>
                </div>
              </CardContent>
            </Card>

            {airbnbPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {airbnbPreview.screenshot && (
                    <div className="rounded-lg overflow-hidden border">
                      <img 
                        src={`data:image/png;base64,${airbnbPreview.screenshot}`} 
                        alt="Screenshot" 
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Titlu</Label>
                      <p className="font-medium">{airbnbPreview.title || "N/A"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Preț/noapte</Label>
                        <p className="font-medium">{airbnbPreview.price_per_night || "N/A"} {airbnbPreview.currency}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Locație</Label>
                        <p className="font-medium">{airbnbPreview.location || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Camere</Label>
                        <p className="font-medium">{airbnbPreview.rooms || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Băi</Label>
                        <p className="font-medium">{airbnbPreview.bathrooms || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Oaspeți max</Label>
                        <p className="font-medium">{airbnbPreview.max_guests || "N/A"}</p>
                      </div>
                    </div>

                    {airbnbPreview.amenities && airbnbPreview.amenities.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Facilități</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {airbnbPreview.amenities.slice(0, 6).map((amenity: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{amenity}</Badge>
                          ))}
                          {airbnbPreview.amenities.length > 6 && (
                            <Badge variant="outline" className="text-xs">+{airbnbPreview.amenities.length - 6}</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {airbnbPreview.description && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Descriere</Label>
                        <p className="text-sm line-clamp-3">{airbnbPreview.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        setImportingAirbnb(true);
                        try {
                          const response = await supabase.functions.invoke("import-airbnb-listing", {
                            body: { airbnb_url: airbnbUrl, import_to_rentals: true },
                          });

                          if (response.error || !response.data.success) {
                            throw new Error(response.data?.error || response.error?.message || "Eroare la salvare");
                          }

                          queryClient.invalidateQueries({ queryKey: ["admin-short-term-rentals"] });
                          toast({ 
                            title: "Proprietate importată!", 
                            description: "Proprietatea a fost adăugată și este inactivă pentru revizuire" 
                          });
                          setAirbnbUrl("");
                          setAirbnbPreview(null);
                        } catch (error: any) {
                          toast({
                            title: "Eroare la salvare",
                            description: error.message,
                            variant: "destructive",
                          });
                        } finally {
                          setImportingAirbnb(false);
                        }
                      }}
                      disabled={importingAirbnb}
                    >
                      {importingAirbnb ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvează proprietatea
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAirbnbPreview(null);
                        setAirbnbUrl("");
                      }}
                    >
                      Anulează
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!airbnbPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Cum funcționează</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                      <div>
                        <p className="font-medium">Copiază link-ul Airbnb</p>
                        <p className="text-sm text-muted-foreground">Deschide proprietatea pe Airbnb și copiază URL-ul din browser</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                      <div>
                        <p className="font-medium">Extrage datele</p>
                        <p className="text-sm text-muted-foreground">Apasă butonul și așteaptă să fie extrase toate detaliile</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                      <div>
                        <p className="font-medium">Verifică și salvează</p>
                        <p className="text-sm text-muted-foreground">Revizuiește datele și salvează proprietatea</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Notă:</strong> Proprietatea va fi salvată ca inactivă. Poți să o editezi și să o activezi ulterior.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="import-booking">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Import din Booking.com
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Importă detaliile unei proprietăți direct din pagina Booking.com.
                </p>

                <div>
                  <Label>Link Booking.com</Label>
                  <Input
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://www.booking.com/hotel/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Copiază link-ul complet al proprietății de pe Booking.com
                  </p>
                </div>

                <Button
                  className="w-full"
                  disabled={!bookingUrl || importingBooking}
                  onClick={async () => {
                    if (!bookingUrl) return;
                    
                    setImportingBooking(true);
                    setBookingPreview(null);
                    
                    try {
                      const response = await supabase.functions.invoke("import-booking-listing", {
                        body: { booking_url: bookingUrl, import_to_rentals: false },
                      });

                      if (response.error) {
                        throw new Error(response.error.message);
                      }

                      if (!response.data.success) {
                        throw new Error(response.data.error || "Eroare la import");
                      }

                      setBookingPreview(response.data.data);
                      toast({ title: "Date extrase cu succes!", description: "Verifică și confirmă importul" });
                    } catch (error: any) {
                      console.error("Import error:", error);
                      toast({
                        title: "Eroare la extragere",
                        description: error.message || "Nu s-au putut extrage datele",
                        variant: "destructive",
                      });
                    } finally {
                      setImportingBooking(false);
                    }
                  }}
                >
                  {importingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Se extrag datele...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Extrage detalii
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p><strong>Ce se importă:</strong></p>
                  <p>• Titlu, descriere, locație</p>
                  <p>• Preț pe noapte, rating, recenzii</p>
                  <p>• Facilități, imagini, reguli</p>
                  <p>• Mic dejun, anulare gratuită, parcare</p>
                </div>
              </CardContent>
            </Card>

            {bookingPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Titlu</Label>
                      <p className="font-medium">{bookingPreview.title || "N/A"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Preț/noapte</Label>
                        <p className="font-medium">{bookingPreview.price_per_night || "N/A"} {bookingPreview.currency}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Rating</Label>
                        <p className="font-medium">{bookingPreview.rating ? `${bookingPreview.rating}/10` : "N/A"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Locație</Label>
                      <p className="font-medium">{bookingPreview.location || "N/A"}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Camere</Label>
                        <p className="font-medium">{bookingPreview.rooms || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Băi</Label>
                        <p className="font-medium">{bookingPreview.bathrooms || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Oaspeți max</Label>
                        <p className="font-medium">{bookingPreview.max_guests || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {bookingPreview.breakfast_included && (
                        <Badge className="bg-green-500">Mic dejun inclus</Badge>
                      )}
                      {bookingPreview.free_cancellation && (
                        <Badge className="bg-blue-500">Anulare gratuită</Badge>
                      )}
                    </div>

                    {bookingPreview.amenities && bookingPreview.amenities.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Facilități</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {bookingPreview.amenities.slice(0, 6).map((amenity: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{amenity}</Badge>
                          ))}
                          {bookingPreview.amenities.length > 6 && (
                            <Badge variant="outline" className="text-xs">+{bookingPreview.amenities.length - 6}</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {bookingPreview.description && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Descriere</Label>
                        <p className="text-sm line-clamp-3">{bookingPreview.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        setImportingBooking(true);
                        try {
                          const response = await supabase.functions.invoke("import-booking-listing", {
                            body: { booking_url: bookingUrl, import_to_rentals: true },
                          });

                          if (response.error || !response.data.success) {
                            throw new Error(response.data?.error || response.error?.message || "Eroare la salvare");
                          }

                          queryClient.invalidateQueries({ queryKey: ["admin-short-term-rentals"] });
                          toast({ 
                            title: "Proprietate importată!", 
                            description: "Proprietatea a fost adăugată și este inactivă pentru revizuire" 
                          });
                          setBookingUrl("");
                          setBookingPreview(null);
                        } catch (error: any) {
                          toast({
                            title: "Eroare la salvare",
                            description: error.message,
                            variant: "destructive",
                          });
                        } finally {
                          setImportingBooking(false);
                        }
                      }}
                      disabled={importingBooking}
                    >
                      {importingBooking ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvează proprietatea
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBookingPreview(null);
                        setBookingUrl("");
                      }}
                    >
                      Anulează
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!bookingPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Cum funcționează</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                      <div>
                        <p className="font-medium">Copiază link-ul Booking.com</p>
                        <p className="text-sm text-muted-foreground">Deschide proprietatea pe Booking.com și copiază URL-ul din browser</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                      <div>
                        <p className="font-medium">Extrage datele</p>
                        <p className="text-sm text-muted-foreground">Apasă butonul și așteaptă să fie extrase toate detaliile</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                      <div>
                        <p className="font-medium">Verifică și salvează</p>
                        <p className="text-sm text-muted-foreground">Revizuiește datele și salvează proprietatea</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Notă:</strong> Proprietatea va fi salvată ca inactivă. Poți să o editezi și să o activezi ulterior.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Selectează proprietatea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rentals.map(rental => (
                  <Button
                    key={rental.id}
                    variant={selectedRentalForCalendar?.id === rental.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedRentalForCalendar(rental)}
                  >
                    {rental.title}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {selectedRentalForCalendar && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestionează disponibilitatea</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedRentalForCalendar.title}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setCalendarMonth(addDays(calendarMonth, -30))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium min-w-[150px] text-center">
                      {format(calendarMonth, "MMMM yyyy", { locale: ro })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setCalendarMonth(addDays(calendarMonth, 30))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Calendar
                    mode="single"
                    selected={undefined}
                    onSelect={handleDateSelect}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    locale={ro}
                    modifiers={{
                      selected: selectedDates,
                      blocked: (date) => getDateStatus(date) === "blocked",
                      customPrice: (date) => getDateStatus(date) === "custom-price",
                    }}
                    modifiersClassNames={{
                      selected: "bg-gold text-white",
                      blocked: "bg-red-200 text-red-800",
                      customPrice: "bg-blue-200 text-blue-800",
                    }}
                    className="rounded-md border pointer-events-auto"
                  />

                  <div className="flex gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-green-200 rounded" />
                      <span>Disponibil</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-red-200 rounded" />
                      <span>Blocat</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-200 rounded" />
                      <span>Preț custom</span>
                    </div>
                  </div>

                  {selectedDates.length > 0 && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      <p className="font-medium">{selectedDates.length} zile selectate</p>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={blockDates}
                          onCheckedChange={setBlockDates}
                        />
                        <Label>Blochează zilele selectate</Label>
                      </div>

                      {!blockDates && (
                        <div>
                          <Label>Preț custom (opțional)</Label>
                          <Input
                            type="number"
                            value={priceOverride}
                            onChange={(e) => setPriceOverride(e.target.value)}
                            placeholder={`${selectedRentalForCalendar.base_price} ${selectedRentalForCalendar.currency}`}
                          />
                        </div>
                      )}

                      <Button 
                        className="w-full"
                        onClick={() => saveAvailabilityMutation.mutate()}
                        disabled={saveAvailabilityMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvează modificările
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Property Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRental?.id ? "Editează proprietatea" : "Adaugă proprietate nouă"}
            </DialogTitle>
          </DialogHeader>

          {editingRental && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Titlu *</Label>
                  <Input
                    value={editingRental.title || ""}
                    onChange={(e) => setEditingRental({ ...editingRental, title: e.target.value })}
                    placeholder="Apartament modern centru..."
                  />
                </div>

                <div>
                  <Label>Locație</Label>
                  <Input
                    value={editingRental.location || ""}
                    onChange={(e) => setEditingRental({ ...editingRental, location: e.target.value })}
                    placeholder="București, Sector 1"
                  />
                </div>

                <div>
                  <Label>Adresă</Label>
                  <Input
                    value={editingRental.address || ""}
                    onChange={(e) => setEditingRental({ ...editingRental, address: e.target.value })}
                    placeholder="Strada, număr"
                  />
                </div>

                <div>
                  <Label>Camere</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingRental.rooms || 1}
                    onChange={(e) => setEditingRental({ ...editingRental, rooms: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Băi</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingRental.bathrooms || 1}
                    onChange={(e) => setEditingRental({ ...editingRental, bathrooms: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Oaspeți maxim</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingRental.max_guests || 2}
                    onChange={(e) => setEditingRental({ ...editingRental, max_guests: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Suprafață (mp)</Label>
                  <Input
                    type="number"
                    value={editingRental.surface || ""}
                    onChange={(e) => setEditingRental({ ...editingRental, surface: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Preț/noapte *</Label>
                  <Input
                    type="number"
                    value={editingRental.base_price || 0}
                    onChange={(e) => setEditingRental({ ...editingRental, base_price: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Monedă</Label>
                  <Input
                    value={editingRental.currency || "EUR"}
                    onChange={(e) => setEditingRental({ ...editingRental, currency: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Nopți minim</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingRental.min_nights || 1}
                    onChange={(e) => setEditingRental({ ...editingRental, min_nights: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Check-in</Label>
                  <Input
                    value={editingRental.check_in_time || "14:00"}
                    onChange={(e) => setEditingRental({ ...editingRental, check_in_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Check-out</Label>
                  <Input
                    value={editingRental.check_out_time || "11:00"}
                    onChange={(e) => setEditingRental({ ...editingRental, check_out_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Telefon contact</Label>
                  <Input
                    value={editingRental.contact_phone || ""}
                    onChange={(e) => setEditingRental({ ...editingRental, contact_phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Email contact</Label>
                  <Input
                    value={editingRental.contact_email || ""}
                    onChange={(e) => setEditingRental({ ...editingRental, contact_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Descriere</Label>
                <Textarea
                  value={editingRental.description || ""}
                  onChange={(e) => setEditingRental({ ...editingRental, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Facilități (separate prin virgulă)</Label>
                <Input
                  value={editingRental.amenities?.join(", ") || ""}
                  onChange={(e) => setEditingRental({ 
                    ...editingRental, 
                    amenities: e.target.value.split(",").map(a => a.trim()).filter(Boolean) 
                  })}
                  placeholder="WiFi, Parcare, TV, Aer condiționat..."
                />
              </div>

              <div>
                <Label>Imagini</Label>
                <RentalImageUpload
                  images={editingRental.images || []}
                  onChange={(newImages) => setEditingRental({ ...editingRental, images: newImages })}
                />
              </div>

              <div>
                <Label>Reguli</Label>
                <Textarea
                  value={editingRental.rules || ""}
                  onChange={(e) => setEditingRental({ ...editingRental, rules: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingRental.is_active ?? true}
                    onCheckedChange={(checked) => setEditingRental({ ...editingRental, is_active: checked })}
                  />
                  <Label>Activ</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingRental.is_featured ?? false}
                    onCheckedChange={(checked) => setEditingRental({ ...editingRental, is_featured: checked })}
                  />
                  <Label>Recomandat</Label>
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={() => saveMutation.mutate(editingRental)}
                disabled={saveMutation.isPending || !editingRental.title}
              >
                {saveMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShortTermRentalsPage;