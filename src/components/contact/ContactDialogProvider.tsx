import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import UniversalContactForm, { type ContactReason } from "./UniversalContactForm";

interface OpenOptions {
  reason?: ContactReason;
  propertyRef?: string;
  title?: string;
}

interface ContactDialogValue {
  openContactForm: (options?: OpenOptions) => void;
}

const ContactDialogContext = createContext<ContactDialogValue>({ openContactForm: () => {} });

export const useContactDialog = () => useContext(ContactDialogContext);

export const ContactDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OpenOptions>({});

  const openContactForm = useCallback((next?: OpenOptions) => {
    setOptions(next ?? {});
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openContactForm }), [openContactForm]);

  return (
    <ContactDialogContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-display-md">{options.title || "Cum te putem ajuta?"}</DialogTitle>
            <DialogDescription>
              Completează formularul, iar un consultant MVA Imobiliare te contactează în cel mai scurt timp.
            </DialogDescription>
          </DialogHeader>
          <UniversalContactForm
            reason={options.reason}
            propertyRef={options.propertyRef}
            compact
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </ContactDialogContext.Provider>
  );
};

export default ContactDialogProvider;
