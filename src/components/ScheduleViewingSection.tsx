import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Phone, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { usePlausible } from "@/hooks/usePlausible";
import { useLanguage } from "@/contexts/LanguageContext";

const scheduleSchema = z.object({
  name: z.string().trim().min(2, "Numele trebuie să aibă cel puțin 2 caractere").max(100, "Numele este prea lung"),
  phone: z.string().trim().min(10, "Numărul de telefon trebuie să aibă cel puțin 10 cifre").max(15, "Numărul de telefon este prea lung"),
  email: z.string().trim().email("Adresa de email nu este validă").max(255, "Email-ul este prea lung").optional().or(z.literal("")),
  preferredDate: z.string().min(1, "Selectați o dată preferată"),
  preferredTime: z.string().min(1, "Selectați o oră preferată"),
  message: z.string().max(500, "Mesajul este prea lung").optional(),
});

const ScheduleViewingSection = () => {
  const { language } = useLanguage();
  const { trackViewingScheduled } = usePlausible();

  const today = new Date().toISOString().split('T')[0];
  const initial = {
    name: "",
    phone: "",
    email: "",
    preferredDate: today,
    preferredTime: "10:00",
    message: "",
  };

  const [formData, setFormData] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ ref: string; date: string; time: string } | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  const TIME_SLOT_OPTIONS = language === 'ro'
    ? [
        { value: 'morning', label: 'Dimineață (09:00 – 12:00)' },
        { value: 'noon', label: 'Prânz (12:00 – 14:00)' },
        { value: 'afternoon', label: 'După-amiază (14:00 – 18:00)' },
        { value: 'evening', label: 'Seară (18:00 – 20:00)' },
      ]
    : [
        { value: 'morning', label: 'Morning (09:00 – 12:00)' },
        { value: 'noon', label: 'Noon (12:00 – 14:00)' },
        { value: 'afternoon', label: 'Afternoon (14:00 – 18:00)' },
        { value: 'evening', label: 'Evening (18:00 – 20:00)' },
      ];

  const PROPERTY_TYPE_OPTIONS = language === 'ro'
    ? [
        { value: 'studio', label: 'Garsonieră' },
        { value: '2-rooms', label: '2 camere' },
        { value: '3-rooms', label: '3 camere' },
        { value: '4-plus-rooms', label: '4+ camere' },
        { value: 'house', label: 'Casă' },
        { value: 'land', label: 'Teren' },
      ]
    : [
        { value: 'studio', label: 'Studio' },
        { value: '2-rooms', label: '2 rooms' },
        { value: '3-rooms', label: '3 rooms' },
        { value: '4-plus-rooms', label: '4+ rooms' },
        { value: 'house', label: 'House' },
        { value: 'land', label: 'Land' },
      ];

  const toggleArrayValue = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
  };

  const labelsFor = (
    options: { value: string; label: string }[],
    selected: string[]
  ) => options.filter(o => selected.includes(o.value)).map(o => o.label);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = scheduleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error(language === 'ro' ? "Completează câmpurile obligatorii." : "Please fill required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const propertyTitle = language === 'ro' ? 'Programare vizionare – Homepage' : 'Viewing request – Homepage';
      const referenceNumber = `MVA-${Date.now().toString(36).toUpperCase()}`;

      const timeSlotLabels = labelsFor(TIME_SLOT_OPTIONS, timeSlots);
      const propertyTypeLabels = labelsFor(PROPERTY_TYPE_OPTIONS, propertyTypes);

      const preferencesBlock: string[] = [];
      if (timeSlotLabels.length) {
        preferencesBlock.push(
          `${language === 'ro' ? 'Interval orar' : 'Time slots'}: ${timeSlotLabels.join(', ')}`
        );
      }
      if (propertyTypeLabels.length) {
        preferencesBlock.push(
          `${language === 'ro' ? 'Tip proprietate' : 'Property type'}: ${propertyTypeLabels.join(', ')}`
        );
      }

      const userMessage = formData.message?.trim() || '';
      const composedMessage = [
        `[Ref: ${referenceNumber}]`,
        ...preferencesBlock,
        userMessage,
      ].filter(Boolean).join('\n');

      const { error: dbError } = await supabase
        .from("viewing_appointments")
        .insert({
          property_id: null,
          property_title: propertyTitle,
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.trim(),
          customer_email: formData.email?.trim() || null,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          message: composedMessage,
          status: "pending",
        });

      if (dbError) {
        console.error("Error saving appointment:", dbError);
        toast.error(language === 'ro' ? "A apărut o eroare. Încearcă din nou." : "An error occurred. Please try again.");
        return;
      }

      const { error: emailError } = await supabase.functions.invoke("send-viewing-notification", {
        body: {
          propertyTitle,
          propertyLink: window.location.origin,
          customerName: formData.name.trim(),
          customerPhone: formData.phone.trim(),
          customerEmail: formData.email?.trim() || undefined,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          message: userMessage || undefined,
          referenceNumber,
          preferences: {
            timeSlots: timeSlotLabels,
            propertyTypes: propertyTypeLabels,
          },
        },
      });

      if (emailError) console.error("Email notification error:", emailError);

      trackViewingScheduled('homepage-section', propertyTitle);
      toast.success(language === 'ro'
        ? `Cerere trimisă! Număr de referință: ${referenceNumber}`
        : `Request sent! Reference: ${referenceNumber}`);
      setConfirmation({
        ref: referenceNumber,
        date: formData.preferredDate,
        time: formData.preferredTime,
      });
      setFormData({ ...initial });
      setTimeSlots([]);
      setPropertyTypes([]);
    } catch (err) {
      console.error(err);
      toast.error(language === 'ro' ? "A apărut o eroare." : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = language === 'ro'
    ? ["Consultanță gratuită cu un agent dedicat", "Vizionare la oră flexibilă, inclusiv weekend", "Răspuns în maxim 2 ore în program de lucru"]
    : ["Free consultation with a dedicated agent", "Flexible viewing hours, including weekends", "Reply within 2 hours during business hours"];

  const sectionUrl = "https://www.mvaimobiliare.ro/#schedule-viewing";
  const howToTitle = language === 'ro'
    ? 'Cum programezi o vizionare la MVA Imobiliare'
    : 'How to schedule a viewing with MVA Imobiliare';
  const howToDescription = language === 'ro'
    ? 'Programează o vizionare gratuită la apartamentele și ansamblurile rezidențiale MVA Imobiliare în 4 pași simpli: alege ziua, completează datele, primești numărul de referință și ești contactat de un consultant.'
    : 'Schedule a free viewing for MVA Imobiliare apartments and residential complexes in 4 simple steps: pick a date, fill in your details, get your reference number, and a consultant will contact you.';

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howToTitle,
    description: howToDescription,
    inLanguage: language === 'ro' ? 'ro-RO' : 'en-US',
    totalTime: 'PT2M',
    estimatedCost: { "@type": "MonetaryAmount", currency: "EUR", value: "0" },
    supply: [],
    tool: [],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: language === 'ro' ? 'Alege data și ora' : 'Pick date and time',
        text: language === 'ro'
          ? 'Selectează ziua și ora preferată pentru vizionare, inclusiv weekend.'
          : 'Choose your preferred day and time for the viewing, weekends included.',
        url: `${sectionUrl}-step1`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: language === 'ro' ? 'Completează datele de contact' : 'Fill in your contact details',
        text: language === 'ro'
          ? 'Introdu numele, telefonul și opțional emailul pentru a putea fi contactat.'
          : 'Enter your name, phone and optionally email so we can reach you.',
        url: `${sectionUrl}-step2`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: language === 'ro' ? 'Trimite cererea' : 'Send the request',
        text: language === 'ro'
          ? 'Trimite formularul și primești instant un număr unic de referință (ex: MVA-XXXXXX).'
          : 'Submit the form and instantly get a unique reference number (e.g. MVA-XXXXXX).',
        url: `${sectionUrl}-step3`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: language === 'ro' ? 'Primești confirmarea' : 'Receive confirmation',
        text: language === 'ro'
          ? 'Un consultant MVA Imobiliare te contactează în maxim 2 ore (program de lucru) pentru confirmare.'
          : 'An MVA Imobiliare consultant will contact you within 2 business hours to confirm.',
        url: `${sectionUrl}-step4`,
      },
    ],
  };

  const contactPointSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "MVA Imobiliare",
    url: "https://www.mvaimobiliare.ro",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "Reservations",
        name: language === 'ro' ? 'Programări vizionări' : 'Viewing reservations',
        telephone: "+40-742-007-700",
        email: "contact@mvaimobiliare.ro",
        availableLanguage: ["Romanian", "English"],
        areaServed: ["RO"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "09:00",
          closes: "20:00",
        },
        contactOption: "TollFree",
      },
    ],
  };

  return (
    <section
      id="schedule-viewing"
      aria-labelledby="schedule-viewing-title"
      className="relative py-16 md:py-24 bg-background"
    >
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(contactPointSchema)}
        </script>
      </Helmet>
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: Intro + benefits */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs font-medium text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {language === 'ro' ? 'Programări online' : 'Online scheduling'}
            </div>
            <h2 id="schedule-viewing-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="block text-foreground">
                {language === 'ro' ? 'Programează o' : 'Schedule a'}
              </span>
              <span className="block text-gradient-gold">
                {language === 'ro' ? 'vizionare gratuită' : 'free viewing'}
              </span>
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md">
              {language === 'ro'
                ? 'Alege ziua și ora care îți convin, iar un consultant MVA Imobiliare te va contacta pentru confirmare și detalii suplimentare.'
                : 'Pick a day and time that suits you. An MVA Imobiliare consultant will contact you to confirm and provide details.'}
            </p>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm sm:text-base text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Form or confirmation */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg">
            {confirmation ? (
              <div className="text-center space-y-5 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {language === 'ro' ? 'Cerere înregistrată!' : 'Request received!'}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {language === 'ro'
                      ? 'Un consultant MVA Imobiliare te va contacta în cel mai scurt timp pentru confirmare.'
                      : 'An MVA Imobiliare consultant will contact you shortly to confirm.'}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-left space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {language === 'ro' ? 'Număr de referință' : 'Reference number'}
                    </span>
                    <code className="text-base font-bold text-primary tracking-wide">{confirmation.ref}</code>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="text-sm text-foreground/90">
                    <span className="text-muted-foreground">
                      {language === 'ro' ? 'Programare:' : 'Scheduled:'}
                    </span>{' '}
                    <strong>
                      {new Date(confirmation.date).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </strong>{' '}
                    {language === 'ro' ? 'la' : 'at'} <strong>{confirmation.time}</strong>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ro'
                    ? 'Salvează numărul de referință pentru orice comunicare ulterioară.'
                    : 'Save the reference number for any future communication.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setConfirmation(null)}
                >
                  {language === 'ro' ? 'Trimite o nouă cerere' : 'Send another request'}
                </Button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sv-name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {language === 'ro' ? 'Nume complet' : 'Full name'} *
                </Label>
                <Input
                  id="sv-name"
                  name="name"
                  placeholder={language === 'ro' ? 'Ion Popescu' : 'John Doe'}
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sv-phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {language === 'ro' ? 'Telefon' : 'Phone'} *
                  </Label>
                  <Input
                    id="sv-phone"
                    name="phone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sv-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="sv-email"
                    name="email"
                    type="email"
                    placeholder="exemplu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sv-date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {language === 'ro' ? 'Data' : 'Date'} *
                  </Label>
                  <Input
                    id="sv-date"
                    name="preferredDate"
                    type="date"
                    min={today}
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className={errors.preferredDate ? "border-destructive" : ""}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.preferredDate && <p className="text-xs text-destructive">{errors.preferredDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sv-time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {language === 'ro' ? 'Ora' : 'Time'} *
                  </Label>
                  <Input
                    id="sv-time"
                    name="preferredTime"
                    type="time"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className={errors.preferredTime ? "border-destructive" : ""}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.preferredTime && <p className="text-xs text-destructive">{errors.preferredTime}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {language === 'ro' ? 'Interval orar preferat (opțional)' : 'Preferred time slots (optional)'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOT_OPTIONS.map(opt => {
                    const active = timeSlots.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleArrayValue(setTimeSlots, opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground/80 border-border hover:bg-muted'
                        }`}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {language === 'ro' ? 'Tip proprietate (opțional)' : 'Property type (optional)'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPE_OPTIONS.map(opt => {
                    const active = propertyTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleArrayValue(setPropertyTypes, opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground/80 border-border hover:bg-muted'
                        }`}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sv-message">
                  {language === 'ro' ? 'Mesaj (opțional)' : 'Message (optional)'}
                </Label>
                <Textarea
                  id="sv-message"
                  name="message"
                  placeholder={language === 'ro' ? 'Detalii despre proprietatea care te interesează...' : 'Details about the property you are interested in...'}
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  className={errors.message ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>

              <Button
                type="submit"
                variant="luxury"
                size="lg"
                className="w-full h-12 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ro' ? 'Se trimite...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    {language === 'ro' ? 'Trimite cererea' : 'Send request'}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {language === 'ro'
                  ? 'Vei fi contactat în cel mai scurt timp pentru confirmare.'
                  : 'You will be contacted shortly for confirmation.'}
              </p>
            </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleViewingSection;
