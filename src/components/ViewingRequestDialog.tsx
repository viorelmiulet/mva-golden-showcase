import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requestViewing } from "@/lib/publicForms.functions";

interface ViewingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string | null;
  propertyTitle: string;
}

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

const ViewingRequestDialog = ({ open, onOpenChange, propertyId, propertyTitle }: ViewingRequestDialogProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    message: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitting) return;

    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time) {
      toast({ title: "Câmpuri lipsă", description: "Completează numele, telefonul, data și ora.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await requestViewing({
        data: {
          property_id: propertyId || null,
          property_title: propertyTitle,
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_email: form.email.trim() || null,
          preferred_date: form.date,
          preferred_time: form.time,
          message: form.message.trim() || null,
        },
      });
      toast({
        title: "Solicitare trimisă",
        description: "Te contactăm pentru confirmarea vizionării.",
      });
      setForm({ name: "", phone: "", email: "", date: "", time: "", message: "" });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Eroare",
        description: err instanceof Error ? err.message : "Nu am putut trimite solicitarea. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brass" />
            Programează vizionare
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm line-clamp-2">
            {propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="viewing-name">Nume complet *</Label>
            <Input id="viewing-name" value={form.name} onChange={set("name")} placeholder="Numele tău" required maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="viewing-phone">Telefon *</Label>
            <Input id="viewing-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="07xx xxx xxx" required maxLength={50} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="viewing-email">Email (opțional)</Label>
            <Input id="viewing-email" type="email" value={form.email} onChange={set("email")} placeholder="email@exemplu.ro" maxLength={320} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="viewing-date">Data *</Label>
              <Input id="viewing-date" type="date" min={today} value={form.date} onChange={set("date")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="viewing-time" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Ora *
              </Label>
              <select
                id="viewing-time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Alege ora</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="viewing-message">Mesaj (opțional)</Label>
            <Textarea
              id="viewing-message"
              value={form.message}
              onChange={set("message")}
              placeholder="Detalii suplimentare pentru agent..."
              rows={3}
              maxLength={2000}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-brass text-ink hover:bg-brass/90">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se trimite...
              </>
            ) : (
              "Trimite solicitarea"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ViewingRequestDialog;
