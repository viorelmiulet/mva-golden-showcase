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
  trigger?: React.ReactNode;
}

export const ScheduleViewingDialog = ({ 
  propertyTitle, 
  propertyId,
  trigger 
}: ScheduleViewingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setErrors({});

    // Validate form data
    const result = scheduleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { error } = await supabase
        .from('viewing_appointments')
        .insert({
          property_id: propertyId,
          property_title: propertyTitle,
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.trim(),
          customer_email: formData.email?.trim() || null,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          message: formData.message?.trim() || null,
          status: 'pending'
        });

      if (error) {
        console.error('Error saving appointment:', error);
        toast.error("A apărut o eroare. Vă rugăm încercați din nou.");
        setIsSubmitting(false);
        return;
      }

      // Success - also open WhatsApp for immediate contact
      const message = `Bună ziua! Doresc să programez o vizionare pentru: ${propertyTitle}

📅 Data preferată: ${formData.preferredDate}
⏰ Ora preferată: ${formData.preferredTime}

👤 Nume: ${formData.name}
📱 Telefon: ${formData.phone}
${formData.email ? `📧 Email: ${formData.email}` : ""}
${formData.message ? `\n💬 Mesaj: ${formData.message}` : ""}`;

      window.open(
        `https://wa.me/40767941512?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      toast.success("Cererea de vizionare a fost trimisă cu succes!");
      setOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        preferredDate: "",
        preferredTime: "",
        message: "",
      });
    } catch (error) {
      console.error('Error:', error);
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
            Programează Vizionare
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Programează Vizionare
          </DialogTitle>
          <DialogDescription className="text-sm">
            Completați formularul pentru a programa o vizionare pentru <span className="font-semibold text-foreground">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Nume complet *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Introduceți numele dvs."
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
              Telefon *
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
              Email (opțional)
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
