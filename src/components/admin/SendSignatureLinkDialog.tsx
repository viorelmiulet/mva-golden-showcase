import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PartyOption {
  value: string;
  label: string;
}

interface SendSignatureLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractType: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
  propertyAddress: string;
  parties: PartyOption[];
  defaultParty?: string;
  defaultEmail?: string;
  defaultName?: string;
}

const SendSignatureLinkDialog = ({
  open,
  onOpenChange,
  contractId,
  contractType,
  propertyAddress,
  parties,
  defaultParty,
  defaultEmail = "",
  defaultName = "",
}: SendSignatureLinkDialogProps) => {
  const [selectedParty, setSelectedParty] = useState(defaultParty || parties[0]?.value || "");
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error("Vă rugăm introduceți adresa de email");
      return;
    }

    if (!selectedParty) {
      toast.error("Vă rugăm selectați partea contractuală");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Adresa de email nu este validă");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-signature-link", {
        body: {
          contractId,
          contractType,
          partyType: selectedParty,
          recipientEmail: email,
          recipientName: name,
          propertyAddress,
        },
      });

      if (error) {
        console.error("Error sending signature link:", error);
        toast.error(error.message || "Eroare la trimiterea emailului");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Link de semnare trimis cu succes către ${email}`);
      onOpenChange(false);
      
      // Reset form
      setEmail("");
      setName("");
    } catch (err: any) {
      console.error("Error:", err);
      toast.error("Eroare la trimiterea emailului");
    } finally {
      setIsSending(false);
    }
  };

  const getContractTypeLabel = () => {
    switch (contractType) {
      case "inchiriere": return "Închiriere";
      case "comodat": return "Comodat";
      case "exclusiv": return "Reprezentare Exclusivă";
      case "intermediere": return "Intermediere";
      default: return "Contract";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Trimite Link Semnare
          </DialogTitle>
          <DialogDescription>
            Trimiteți un email cu link pentru semnare electronică pentru contractul de {getContractTypeLabel().toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Parte Contractuală</Label>
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger>
                <SelectValue placeholder="Selectați partea" />
              </SelectTrigger>
              <SelectContent>
                {parties.map((party) => (
                  <SelectItem key={party.value} value={party.value}>
                    {party.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nume Destinatar</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ion Popescu"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Destinatar *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplu.ro"
            />
          </div>

          {propertyAddress && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <span className="font-medium">Proprietate:</span> {propertyAddress}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Trimite Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendSignatureLinkDialog;
