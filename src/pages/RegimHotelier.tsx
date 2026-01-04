import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, eachDayOfInterval, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Bed, 
  Bath, 
  Users, 
  MapPin, 
  Calendar as CalendarIcon,
  Clock,
  Star,
  Wifi,
  Car,
  Tv,
  Wind,
  Coffee,
  ChevronLeft,
  ChevronRight
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
  is_featured: boolean;
}

interface RentalAvailability {
  date: string;
  is_available: boolean;
  custom_price: number | null;
}

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  tv: Tv,
  ac: Wind,
  kitchen: Coffee,
};

const RegimHotelier = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedRental, setSelectedRental] = useState<ShortTermRental | null>(null);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingForm, setBookingForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    num_guests: 1,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLocale = language === "ro" ? ro : enUS;

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["short-term-rentals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("short_term_rentals")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ShortTermRental[];
    },
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["rental-availability", selectedRental?.id],
    queryFn: async () => {
      if (!selectedRental) return [];
      
      const { data, error } = await supabase
        .from("rental_availability")
        .select("date, is_available, custom_price")
        .eq("rental_id", selectedRental.id)
        .gte("date", format(new Date(), "yyyy-MM-dd"));
      
      if (error) throw error;
      return data as RentalAvailability[];
    },
    enabled: !!selectedRental,
  });

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const availabilityRecord = availability.find(a => a.date === dateStr);
    
    // If no record exists, assume available
    if (!availabilityRecord) return true;
    
    return availabilityRecord.is_available;
  };

  const getPriceForDate = (date: Date) => {
    if (!selectedRental) return 0;
    
    const dateStr = format(date, "yyyy-MM-dd");
    const availabilityRecord = availability.find(a => a.date === dateStr);
    
    return availabilityRecord?.custom_price ?? selectedRental.base_price;
  };

  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut || !selectedRental) return 0;
    
    const days = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
    return days.reduce((total, day) => total + getPriceForDate(day), 0);
  };

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleBooking = async () => {
    if (!selectedRental || !checkIn || !checkOut) return;
    
    if (!bookingForm.guest_name || !bookingForm.guest_phone) {
      toast({
        title: language === "ro" ? "Eroare" : "Error",
        description: language === "ro" 
          ? "Te rugăm să completezi numele și telefonul" 
          : "Please fill in name and phone",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = calculateTotalPrice();
      const checkInStr = format(checkIn, "yyyy-MM-dd");
      const checkOutStr = format(checkOut, "yyyy-MM-dd");

      const { error } = await supabase
        .from("rental_bookings")
        .insert({
          rental_id: selectedRental.id,
          check_in: checkInStr,
          check_out: checkOutStr,
          guest_name: bookingForm.guest_name,
          guest_email: bookingForm.guest_email,
          guest_phone: bookingForm.guest_phone,
          num_guests: bookingForm.num_guests,
          total_price: totalPrice,
          currency: selectedRental.currency,
          notes: bookingForm.notes,
        });

      if (error) throw error;

      // Send email notification
      supabase.functions.invoke('send-booking-notification', {
        body: {
          propertyTitle: selectedRental.title,
          propertyLocation: selectedRental.location,
          guestName: bookingForm.guest_name,
          guestEmail: bookingForm.guest_email,
          guestPhone: bookingForm.guest_phone,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          numGuests: bookingForm.num_guests,
          totalPrice: totalPrice,
          currency: selectedRental.currency,
          notes: bookingForm.notes,
        }
      }).catch(err => console.error("Email notification error:", err));

      toast({
        title: language === "ro" ? "Cerere trimisă!" : "Request sent!",
        description: language === "ro" 
          ? "Vă vom contacta pentru confirmare" 
          : "We will contact you for confirmation",
      });

      setBookingDialogOpen(false);
      setBookingForm({ guest_name: "", guest_email: "", guest_phone: "", num_guests: 1, notes: "" });
      setCheckIn(undefined);
      setCheckOut(undefined);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: language === "ro" ? "Eroare" : "Error",
        description: language === "ro" 
          ? "A apărut o eroare. Încercați din nou." 
          : "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(undefined);
    } else {
      if (isAfter(date, checkIn)) {
        setCheckOut(date);
      } else {
        setCheckIn(date);
        setCheckOut(undefined);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{language === "ro" ? "Regim Hotelier - Închirieri pe Termen Scurt | MVA Imobiliare" : "Short-Term Rentals | MVA Imobiliare"}</title>
        <meta 
          name="description" 
          content={language === "ro" 
            ? "Închiriază apartamente în regim hotelier în București. Proprietăți complet utilate pentru sejururi scurte, cu disponibilitate în timp real." 
            : "Rent apartments for short stays in Bucharest. Fully equipped properties for short-term stays with real-time availability."
          } 
        />
        <link rel="canonical" href="https://mvaimobiliare.ro/regim-hotelier" />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20 pb-12">
        <section className="py-12 sm:py-16 bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-4">
                {language === "ro" ? "Regim Hotelier" : "Short-Term Rentals"}
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                {language === "ro" ? "Închirieri pe Termen Scurt" : "Short-Term Rentals"}
              </h1>
              <p className="text-muted-foreground text-lg">
                {language === "ro" 
                  ? "Apartamente complet utilate pentru sejururi confortabile în București"
                  : "Fully equipped apartments for comfortable stays in Bucharest"
                }
              </p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : rentals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {language === "ro" 
                    ? "Nu există proprietăți disponibile momentan"
                    : "No properties available at the moment"
                  }
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rentals.map((rental) => (
                  <Card 
                    key={rental.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedRental(rental)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {rental.images?.[0] ? (
                        <img 
                          src={rental.images[0]} 
                          alt={rental.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Bed className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {rental.is_featured && (
                        <Badge className="absolute top-3 left-3 bg-gold text-white">
                          <Star className="w-3 h-3 mr-1" />
                          {language === "ro" ? "Recomandat" : "Featured"}
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{rental.title}</h3>
                      
                      {rental.location && (
                        <div className="flex items-center text-muted-foreground text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{rental.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center">
                          <Bed className="w-4 h-4 mr-1" />
                          {rental.rooms} {language === "ro" ? "cam" : "rooms"}
                        </span>
                        <span className="flex items-center">
                          <Bath className="w-4 h-4 mr-1" />
                          {rental.bathrooms}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {rental.max_guests}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gold">
                            {rental.base_price} {rental.currency}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            /{language === "ro" ? "noapte" : "night"}
                          </span>
                        </div>
                        <Button variant="luxury" size="sm">
                          {language === "ro" ? "Vezi detalii" : "View details"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Property Detail Dialog */}
        <Dialog open={!!selectedRental} onOpenChange={(open) => !open && setSelectedRental(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRental && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedRental.title}</DialogTitle>
                  {selectedRental.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedRental.location}
                    </div>
                  )}
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  {/* Images */}
                  <div className="space-y-4">
                    {selectedRental.images?.[0] ? (
                      <img 
                        src={selectedRental.images[0]} 
                        alt={selectedRental.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <Bed className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {selectedRental.images?.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedRental.images.slice(1, 5).map((img, i) => (
                          <img 
                            key={i}
                            src={img} 
                            alt={`${selectedRental.title} ${i + 2}`}
                            className="w-full h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    {selectedRental.description && (
                      <div>
                        <h4 className="font-semibold mb-2">
                          {language === "ro" ? "Descriere" : "Description"}
                        </h4>
                        <p className="text-muted-foreground text-sm">{selectedRental.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-gold" />
                        <span>{selectedRental.rooms} {language === "ro" ? "camere" : "rooms"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="w-5 h-5 text-gold" />
                        <span>{selectedRental.bathrooms} {language === "ro" ? "băi" : "bathrooms"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gold" />
                        <span>{selectedRental.max_guests} {language === "ro" ? "oaspeți" : "guests"}</span>
                      </div>
                      {selectedRental.surface && (
                        <div className="flex items-center gap-2">
                          <span className="text-gold font-bold">m²</span>
                          <span>{selectedRental.surface} mp</span>
                        </div>
                      )}
                    </div>

                    {selectedRental.amenities?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">
                          {language === "ro" ? "Facilități" : "Amenities"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRental.amenities.map((amenity, i) => (
                            <Badge key={i} variant="secondary">{amenity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Check-in: {selectedRental.check_in_time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Check-out: {selectedRental.check_out_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar & Booking */}
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-gold">
                        {selectedRental.base_price} {selectedRental.currency}
                      </span>
                      <span className="text-muted-foreground">
                        /{language === "ro" ? "noapte" : "night"}
                      </span>
                      {selectedRental.min_nights > 1 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === "ro" ? "Minim" : "Minimum"} {selectedRental.min_nights} {language === "ro" ? "nopți" : "nights"}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-center">
                        {language === "ro" ? "Selectează datele" : "Select dates"}
                      </h4>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-medium">
                          {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={handleDateSelect}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        locale={dateLocale}
                        disabled={(date) => 
                          isBefore(date, startOfDay(new Date())) || 
                          !isDateAvailable(date)
                        }
                        modifiers={{
                          selected: (date) => 
                            (checkIn && isSameDay(date, checkIn)) || 
                            (checkOut && isSameDay(date, checkOut)),
                          inRange: (date) => 
                            checkIn && checkOut && isAfter(date, checkIn) && isBefore(date, checkOut),
                        }}
                        modifiersClassNames={{
                          selected: "bg-gold text-white hover:bg-gold",
                          inRange: "bg-gold/20",
                        }}
                        className="rounded-md border pointer-events-auto"
                      />
                    </div>

                    {checkIn && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Check-in:</span>
                          <span className="font-medium">
                            {format(checkIn, "PPP", { locale: dateLocale })}
                          </span>
                        </div>
                        {checkOut && (
                          <>
                            <div className="flex justify-between">
                              <span>Check-out:</span>
                              <span className="font-medium">
                                {format(checkOut, "PPP", { locale: dateLocale })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>{language === "ro" ? "Nopți:" : "Nights:"}</span>
                              <span className="font-medium">{getNights()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                              <span>Total:</span>
                              <span className="text-gold">
                                {calculateTotalPrice()} {selectedRental.currency}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <Button 
                      variant="luxury" 
                      className="w-full"
                      disabled={!checkIn || !checkOut || getNights() < selectedRental.min_nights}
                      onClick={() => setBookingDialogOpen(true)}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {language === "ro" ? "Rezervă acum" : "Book now"}
                    </Button>

                    {checkIn && checkOut && getNights() < selectedRental.min_nights && (
                      <p className="text-destructive text-sm text-center">
                        {language === "ro" 
                          ? `Minim ${selectedRental.min_nights} nopți` 
                          : `Minimum ${selectedRental.min_nights} nights required`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking Form Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "ro" ? "Completează rezervarea" : "Complete booking"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>{language === "ro" ? "Nume complet *" : "Full name *"}</Label>
                <Input 
                  value={bookingForm.guest_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, guest_name: e.target.value })}
                  placeholder="Ion Popescu"
                />
              </div>

              <div>
                <Label>{language === "ro" ? "Telefon *" : "Phone *"}</Label>
                <Input 
                  value={bookingForm.guest_phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, guest_phone: e.target.value })}
                  placeholder="+40 7XX XXX XXX"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={bookingForm.guest_email}
                  onChange={(e) => setBookingForm({ ...bookingForm, guest_email: e.target.value })}
                  placeholder="email@exemplu.com"
                />
              </div>

              <div>
                <Label>{language === "ro" ? "Număr oaspeți" : "Number of guests"}</Label>
                <Input 
                  type="number"
                  min={1}
                  max={selectedRental?.max_guests || 10}
                  value={bookingForm.num_guests}
                  onChange={(e) => setBookingForm({ ...bookingForm, num_guests: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <Label>{language === "ro" ? "Observații" : "Notes"}</Label>
                <Textarea 
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder={language === "ro" ? "Orice informație suplimentară..." : "Any additional information..."}
                />
              </div>

              {checkIn && checkOut && selectedRental && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>{selectedRental.title}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{format(checkIn, "PP", { locale: dateLocale })} - {format(checkOut, "PP", { locale: dateLocale })}</span>
                    <span>{getNights()} {language === "ro" ? "nopți" : "nights"}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-gold">{calculateTotalPrice()} {selectedRental.currency}</span>
                  </div>
                </div>
              )}

              <Button 
                variant="luxury" 
                className="w-full"
                onClick={handleBooking}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (language === "ro" ? "Se trimite..." : "Submitting...") 
                  : (language === "ro" ? "Trimite cererea de rezervare" : "Submit booking request")
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </>
  );
};

export default RegimHotelier;