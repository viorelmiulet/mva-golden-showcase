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
  Save
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
        <TabsList>
          <TabsTrigger value="properties">Proprietăți</TabsTrigger>
          <TabsTrigger value="bookings">Rezervări ({bookings.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
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