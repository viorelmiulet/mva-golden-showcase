import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, User, Phone, Mail, Loader2 } from "lucide-react";
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

interface ScheduleViewingDialogProps {
  propertyTitle: string;
  propertyId: string;
  propertyUrl?: string;
  trigger?: React.ReactNode;
}

export const ScheduleViewingDialog = ({ 
  propertyTitle, 
  propertyId,
  propertyUrl,
  trigger 
}: ScheduleViewingDialogProps) => {
  const getInitialFormData = () => {
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];

    return {
      name: "",
      phone: "",
      email: "",
      preferredDate: defaultDate,
      preferredTime: "10:00",
      message: "",
    };
  };

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { trackViewingScheduled } = usePlausible();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    const result = scheduleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Completează toate câmpurile obligatorii pentru a trimite cererea.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPropertyId = propertyId?.trim() || "";
      const isUuidPropertyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedPropertyId);

      const { error: dbError } = await supabase
        .from("viewing_appointments")
        .insert({
          property_id: isUuidPropertyId ? normalizedPropertyId : null,
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
        toast.error("A apărut o eroare. Vă rugăm încercați din nou.");
        return;
      }

      const currentPath = window.location.pathname;
      const normalizedPropertyUrl = propertyUrl?.trim();
      const fallbackPropertyPath = currentPath.startsWith('/')
        ? currentPath
        : `/proprietati/${normalizedPropertyId}`;
      const propertyLink = `${window.location.origin}${normalizedPropertyUrl || fallbackPropertyPath}`;

      const { error: emailError } = await supabase.functions.invoke("send-viewing-notification", {
        body: {
          propertyTitle,
          propertyLink,
          customerName: formData.name.trim(),
          customerPhone: formData.phone.trim(),
          customerEmail: formData.email?.trim() || undefined,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          message: formData.message?.trim() || undefined,
        },
      });

      if (emailError) {
        console.error("Error sending email notification:", emailError);
      }

      trackViewingScheduled(normalizedPropertyId, propertyTitle);
      toast.success("Cererea de vizionare a fost trimisă cu succes! Veți fi contactat în curând.");
      setOpen(false);
      setFormData(getInitialFormData());
    } catch (error) {
      console.error("Error:", error);
      toast.error("A apărut o eroare. Vă rugăm încercați din nou.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Calendar className="w-4 h-4" />
            {t.properties?.scheduleViewing || t.viewing?.title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t.viewing?.title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t.viewing?.subtitle} <span className="font-semibold text-foreground">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              {t.viewing?.yourName || t.contact?.name} *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={t.viewing?.yourName || t.contact?.name}
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              {t.viewing?.yourPhone || t.contact?.phone} *
            </Label>
            <Input
              id="phone"
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {t.viewing?.yourEmail || t.contact?.email}
            </Label>
            <Input
              id="email"
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

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="preferredDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Data *
              </Label>
              <Input
                id="preferredDate"
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
              <Label htmlFor="preferredTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Ora *
              </Label>
              <Input
                id="preferredTime"
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

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj adițional (opțional)</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Alte detalii sau întrebări..."
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
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
            onClick={(e) => e.stopPropagation()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se trimite...
              </>
            ) : (
              "Trimite cererea"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Veți fi contactat în cel mai scurt timp pentru confirmarea vizionării
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
