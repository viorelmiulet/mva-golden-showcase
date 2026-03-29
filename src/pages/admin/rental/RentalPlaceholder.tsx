import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface RentalPlaceholderProps {
  title: string;
  description?: string;
}

const RentalPlaceholder = ({ title, description }: RentalPlaceholderProps) => (
  <Card className="admin-glass-card">
    <CardContent className="py-16 text-center text-muted-foreground">
      <Construction className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm">{description || "Această secțiune va fi disponibilă în curând."}</p>
    </CardContent>
  </Card>
);

export default RentalPlaceholder;
