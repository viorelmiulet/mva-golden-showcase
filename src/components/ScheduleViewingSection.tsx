import { useState } from "react";
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
          message: formData.message?.trim() || null,
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
          message: formData.message?.trim() || undefined,
        },
      });

      if (emailError) console.error("Email notification error:", emailError);

      trackViewingScheduled('homepage-section', propertyTitle);
      toast.success(language === 'ro'
        ? "Cererea a fost trimisă! Te vom contacta în curând."
        : "Request sent! We'll contact you soon.");
      setFormData({ ...initial });
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

  return (
    <section
      id="schedule-viewing"
      aria-labelledby="schedule-viewing-title"
      className="relative py-16 md:py-24 bg-background"
    >
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

          {/* Right: Form */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleViewingSection;
