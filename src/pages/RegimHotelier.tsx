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
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
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
  ChevronRight,
  X,
  ZoomIn,
  Download
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
  const [nightsInput, setNightsInput] = useState<string>("1");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    num_guests: 1,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !selectedRental?.images?.length) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Swipe left = next image
      setCurrentImageIndex((prev) => 
        prev === selectedRental.images.length - 1 ? 0 : prev + 1
      );
    } else if (isRightSwipe) {
      // Swipe right = previous image
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedRental.images.length - 1 : prev - 1
      );
    }
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen || !selectedRental?.images?.length) return;
      
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => 
          prev === 0 ? selectedRental.images.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => 
          prev === selectedRental.images.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedRental?.images?.length]);

  const dateLocale = language === "ro" ? ro : enUS;

  // Reset image index when selecting a new rental
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedRental?.id]);

  // Sync nightsInput when checkIn/checkOut change externally
  useEffect(() => {
    if (checkIn && checkOut) {
      const n = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      if (n > 0) setNightsInput(String(n));
    }
  }, [checkIn, checkOut]);

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
          propertyAddress: selectedRental.address,
          guestName: bookingForm.guest_name,
          guestEmail: bookingForm.guest_email,
          guestPhone: bookingForm.guest_phone,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          numGuests: bookingForm.num_guests,
          totalPrice: totalPrice,
          currency: selectedRental.currency,
          notes: bookingForm.notes,
          checkInTime: selectedRental.check_in_time,
          checkOutTime: selectedRental.check_out_time,
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

  // Check if all dates in a range are available
  const isRangeAvailable = (start: Date, end: Date) => {
    const days = eachDayOfInterval({ start, end: addDays(end, -1) });
    return days.every(day => isDateAvailable(day));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Don't allow selecting unavailable dates
    if (!isDateAvailable(date)) {
      toast({
        title: language === "ro" ? "Dată indisponibilă" : "Date unavailable",
        description: language === "ro" 
          ? "Această dată nu este disponibilă pentru rezervare" 
          : "This date is not available for booking",
        variant: "destructive",
      });
      return;
    }
    
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(undefined);
    } else {
      if (isAfter(date, checkIn)) {
        // Check if all dates in the range are available
        if (!isRangeAvailable(checkIn, date)) {
          toast({
            title: language === "ro" ? "Interval indisponibil" : "Range unavailable",
            description: language === "ro" 
              ? "Există date ocupate în intervalul selectat. Alegeți alt interval." 
              : "There are booked dates in the selected range. Choose another range.",
            variant: "destructive",
          });
          // Reset and start fresh with the new date
          setCheckIn(date);
          setCheckOut(undefined);
          return;
        }
        setCheckOut(date);
      } else {
        setCheckIn(date);
        setCheckOut(undefined);
      }
    }
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: language === "ro" ? "Acasă" : "Home", url: "/" },
        { name: language === "ro" ? "Regim Hotelier" : "Short-Term Rentals", url: "/regim-hotelier" }
      ]} />
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
      
      <main className="min-h-screen pt-16 sm:pt-20 pb-8 sm:pb-12">
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-3 sm:px-4">
            <Breadcrumbs items={[{ label: language === "ro" ? "Regim Hotelier" : "Short-Term Rentals" }]} />
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-3 sm:mb-4 text-xs sm:text-sm">
                {language === "ro" ? "Regim Hotelier" : "Short-Term Rentals"}
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
                {language === "ro" ? "Închirieri pe Termen Scurt" : "Short-Term Rentals"}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-2">
                {language === "ro" 
                  ? "Apartamente complet utilate pentru sejururi confortabile în București"
                  : "Fully equipped apartments for comfortable stays in Bucharest"
                }
              </p>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 sm:h-48 bg-muted" />
                    <CardContent className="p-3 sm:p-4">
                      <div className="h-5 sm:h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : rentals.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground text-sm sm:text-lg">
                  {language === "ro" 
                    ? "Nu există proprietăți disponibile momentan"
                    : "No properties available at the moment"
                  }
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {rentals.map((rental) => (
                  <Card 
                    key={rental.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedRental(rental)}
                  >
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      {rental.images?.[0] ? (
                        <img 
                          src={rental.images[0]} 
                          alt={`${rental.title} - cazare regim hotelier în ${rental.location || 'București'}, ${rental.rooms} camere, capacitate ${rental.max_guests} persoane`}
                          title={`${rental.title} - ${rental.base_price} ${rental.currency}/noapte`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Bed className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                        </div>
                      )}
                      {rental.is_featured && (
                        <Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gold text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {language === "ro" ? "Recomandat" : "Featured"}
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2 line-clamp-1">{rental.title}</h3>
                      
                      {rental.location && (
                        <div className="flex items-center text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{rental.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        <span className="flex items-center">
                          <Bed className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          {rental.rooms} {language === "ro" ? "cam" : "rooms"}
                        </span>
                        <span className="flex items-center">
                          <Bath className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          {rental.bathrooms}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          {rental.max_guests}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl sm:text-2xl font-bold text-gold">
                            {rental.base_price} {rental.currency}
                          </span>
                          <span className="text-muted-foreground text-xs sm:text-sm">
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
                    {selectedRental.images?.length > 0 ? (
                      <div className="relative group">
                        <img 
                          src={selectedRental.images[currentImageIndex]} 
                          alt={`${selectedRental.title} - imagine ${currentImageIndex + 1} din ${selectedRental.images.length}, cazare în ${selectedRental.location || 'București'}`}
                          title={`${selectedRental.title} - ${currentImageIndex + 1}/${selectedRental.images.length}`}
                          className="w-full h-64 object-cover rounded-lg cursor-zoom-in"
                          onClick={() => setLightboxOpen(true)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setLightboxOpen(true)}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        {selectedRental.images.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => 
                                  prev === 0 ? selectedRental.images.length - 1 : prev - 1
                                );
                              }}
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => 
                                  prev === selectedRental.images.length - 1 ? 0 : prev + 1
                                );
                              }}
                            >
                              <ChevronRight className="w-6 h-6" />
                            </Button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              {currentImageIndex + 1} / {selectedRental.images.length}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <Bed className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {selectedRental.images?.length > 1 && (
                      <div className="grid grid-cols-5 gap-2">
                        {selectedRental.images.map((img, i) => (
                          <img 
                            key={i}
                            src={img} 
                            alt={`${selectedRental.title} - miniatură ${i + 1} din ${selectedRental.images.length}`}
                            title={`Imagine ${i + 1}`}
                            className={`w-full h-14 object-cover rounded cursor-pointer transition-opacity ${
                              currentImageIndex === i ? 'ring-2 ring-gold opacity-100' : 'opacity-60 hover:opacity-100'
                            }`}
                            onClick={() => setCurrentImageIndex(i)}
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
                      <h4 className="font-semibold mb-3 text-center">
                        {language === "ro" ? "Selectează datele" : "Select dates"}
                      </h4>
                      {/* Date inputs row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="checkInDate" className="text-xs font-medium">
                            {language === "ro" ? "Sosire" : "Check-in"}
                          </Label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="checkInDate"
                              type="date"
                              min={format(new Date(), "yyyy-MM-dd")}
                              value={checkIn ? format(checkIn, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
                                if (date && !isDateAvailable(date)) {
                                  toast({
                                    title: language === "ro" ? "Dată indisponibilă" : "Date unavailable",
                                    description: language === "ro" ? "Această dată nu este disponibilă" : "This date is not available",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setCheckIn(date);
                                if (date && checkOut && !isAfter(checkOut, date)) {
                                  setCheckOut(addDays(date, 1));
                                } else if (date && !checkOut) {
                                  setCheckOut(addDays(date, 1));
                                }
                              }}
                              className="pl-9 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="numNights" className="text-xs font-medium">
                            {language === "ro" ? "Nopți" : "Nights"}
                          </Label>
                          <Input
                            id="numNights"
                            type="number"
                            min={selectedRental.min_nights || 1}
                            max={90}
                            value={nightsInput}
                            onChange={(e) => {
                              setNightsInput(e.target.value);
                            }}
                            onBlur={() => {
                              const nights = parseInt(nightsInput) || (selectedRental.min_nights || 1);
                              const clamped = Math.max(selectedRental.min_nights || 1, Math.min(90, nights));
                              setNightsInput(String(clamped));
                              if (checkIn) {
                                const newCheckOut = addDays(checkIn, clamped);
                                if (isRangeAvailable(checkIn, newCheckOut)) {
                                  setCheckOut(newCheckOut);
                                } else {
                                  toast({
                                    title: language === "ro" ? "Interval indisponibil" : "Range unavailable",
                                    description: language === "ro" ? "Există date ocupate în acest interval" : "There are booked dates in this range",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="text-sm text-center"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="checkOutDate" className="text-xs font-medium">
                            {language === "ro" ? "Plecare" : "Check-out"}
                          </Label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="checkOutDate"
                              type="date"
                              min={checkIn ? format(addDays(checkIn, 1), "yyyy-MM-dd") : format(addDays(new Date(), 1), "yyyy-MM-dd")}
                              value={checkOut ? format(checkOut, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
                                if (date && checkIn && !isRangeAvailable(checkIn, date)) {
                                  toast({
                                    title: language === "ro" ? "Interval indisponibil" : "Range unavailable",
                                    description: language === "ro" ? "Există date ocupate în intervalul selectat" : "There are booked dates in the selected range",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setCheckOut(date);
                              }}
                              className="pl-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Calendars side by side */}
                      <div className="grid grid-cols-2 gap-2 notranslate" translate="no">
                        <div className="border rounded-lg overflow-hidden">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={(date) => {
                              if (!date) return;
                              if (!isDateAvailable(date)) {
                                toast({
                                  title: language === "ro" ? "Dată indisponibilă" : "Date unavailable",
                                  description: language === "ro" ? "Această dată nu este disponibilă" : "This date is not available",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setCheckIn(date);
                              if (checkOut && !isAfter(checkOut, date)) {
                                setCheckOut(addDays(date, 1));
                              } else if (!checkOut) {
                                setCheckOut(addDays(date, 1));
                              }
                            }}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            locale={dateLocale}
                            disabled={(date) =>
                              isBefore(date, startOfDay(new Date())) ||
                              !isDateAvailable(date)
                            }
                            className="p-1 pointer-events-auto w-full text-xs"
                          />
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={(date) => {
                              if (!date) return;
                              if (checkIn && !isAfter(date, checkIn)) {
                                toast({
                                  title: language === "ro" ? "Dată invalidă" : "Invalid date",
                                  description: language === "ro" ? "Data de plecare trebuie să fie după sosire" : "Check-out must be after check-in",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (checkIn && !isRangeAvailable(checkIn, date)) {
                                toast({
                                  title: language === "ro" ? "Interval indisponibil" : "Range unavailable",
                                  description: language === "ro" ? "Există date ocupate în intervalul selectat" : "There are booked dates in the selected range",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setCheckOut(date);
                            }}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            locale={dateLocale}
                            disabled={(date) =>
                              isBefore(date, startOfDay(checkIn || new Date())) ||
                              !isDateAvailable(date)
                            }
                            modifiers={{
                              inRange: (date) =>
                                !!(checkIn && checkOut && isAfter(date, checkIn) && isBefore(date, checkOut)),
                            }}
                            modifiersClassNames={{
                              inRange: "bg-primary/20",
                            }}
                            className="p-1 pointer-events-auto w-full text-xs"
                          />
                        </div>
                      </div>
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

      {/* Fullscreen Lightbox */}
      {lightboxOpen && selectedRental?.images?.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12 z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Download button */}
          <a
            href={selectedRental.images[currentImageIndex]}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12"
            >
              <Download className="w-5 h-5" />
            </Button>
          </a>

          {/* Main image with swipe support */}
          <div
            className="max-h-[85vh] max-w-[90vw] flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedRental.images[currentImageIndex]}
              alt={`${selectedRental.title} ${currentImageIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Navigation buttons */}
          {selectedRental.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full h-14 w-14"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => 
                    prev === 0 ? selectedRental.images.length - 1 : prev - 1
                  );
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full h-14 w-14"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => 
                    prev === selectedRental.images.length - 1 ? 0 : prev + 1
                  );
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full text-sm">
            {currentImageIndex + 1} / {selectedRental.images.length}
          </div>

          {/* Thumbnail strip */}
          {selectedRental.images.length > 1 && (
            <div 
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-2 px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedRental.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className={`h-16 w-24 object-cover rounded cursor-pointer transition-all flex-shrink-0 ${
                    currentImageIndex === i 
                      ? 'ring-2 ring-white opacity-100 scale-105' 
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  onClick={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Footer />
    </>
  );
};

export default RegimHotelier;