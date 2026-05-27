import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PropertySectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  items?: string[];
}

const PropertySectionDialog = ({ open, onOpenChange, title, items }: PropertySectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {items?.map((item, i) => (
            <div
              key={i}
              title={item}
              className="rounded-md bg-muted/40 border border-border/50 px-2 py-1 text-xs text-foreground break-words [overflow-wrap:anywhere]"
            >
              {item}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertySectionDialog;
