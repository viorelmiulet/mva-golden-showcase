import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Edit, Trash2, Search, Sparkles, Home, MapPin, Euro, Maximize2, Loader2, Phone, Mail, FileText, Users } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTableCard, MobileCardRow, MobileCardActions, MobileCardHeader } from "@/components/admin/MobileTableCard";

interface ClientPreferences {
  min_price?: number;
  max_price?: number;
  min_surface?: number;
  max_surface?: number;
  rooms?: number;
  location?: string;
  property_type?: string;
  features?: string[];
}

interface PropertyRecommendation {
  property_id: string;
  match_score: number;
  reasons: string[];
  property: {
    id: string;
    title: string;
    location: string;
    price_min: number;
    price_max: number;
    surface_min: number;
    surface_max: number;
    rooms: number;
    project_name: string;
    images?: string[];
  };
}

const clientSchema = z.object({
  name: z.string().trim().min(1, "Numele este obligatoriu"),
  phone: z.string().trim().min(1, "Telefonul este obligatoriu"),
  email: z.string().trim().email("Email invalid").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export default function ClientsAdminPage() {
  const { clients, isLoading, addClient, updateClient, deleteClient } = useClients();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preferences & Recommendations state
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [preferences, setPreferences] = useState<ClientPreferences>({});
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email || "",
        notes: client.notes || "",
      });
    } else {
      setEditingClient(null);
      setFormData({ name: "", phone: "", email: "", notes: "" });
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = clientSchema.parse({
        ...formData,
        email: formData.email || undefined,
      });

      if (editingClient) {
        await updateClient({ id: editingClient.id, ...validatedData });
      } else {
        await addClient({
          name: validatedData.name,
          phone: validatedData.phone,
          email: validatedData.email,
          notes: validatedData.notes,
        });
      }

      setIsDialogOpen(false);
      setFormData({ name: "", phone: "", email: "", notes: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Sigur doriți să ștergeți acest client?")) {
      await deleteClient(id);
    }
  };

  const handleOpenPreferences = (client: any) => {
    setSelectedClient(client);
    // Parse existing preferences if any
    const existingPrefs = client.preferences as ClientPreferences || {};
    setPreferences(existingPrefs);
    setRecommendations([]);
    setIsPreferencesOpen(true);
  };

  const handleSavePreferences = async () => {
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from("clients")
        .update({ preferences: preferences as Json })
        .eq("id", selectedClient.id);

      if (error) throw error;
      toast.success("Preferințe salvate cu succes");
    } catch (error: any) {
      toast.error("Eroare la salvarea preferințelor: " + error.message);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedClient) return;

    setIsLoadingRecommendations(true);
    try {
      // Save preferences first
      await handleSavePreferences();

      const { data, error } = await supabase.functions.invoke("ai-property-recommendations", {
        body: { clientId: selectedClient.id, preferences },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setRecommendations(data.recommendations || []);
      
      if (data.recommendations?.length === 0) {
        toast.info("Nu s-au găsit proprietăți care să se potrivească preferințelor");
      } else {
        toast.success(`${data.recommendations.length} recomandări găsite!`);
      }
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      toast.error("Eroare la obținerea recomandărilor: " + error.message);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Modern Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-blue-600/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/5 border border-cyan-500/20">
              <Users className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clienți CRM</h1>
            <p className="text-muted-foreground text-sm">Gestionează baza de date cu clienți</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Client Nou
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, telefon sau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Niciun client găsit</p>
              ) : (
                filteredClients.map((client) => {
                  const prefs = (client as any).preferences as ClientPreferences | null;
                  const hasPreferences = prefs && Object.keys(prefs).length > 0;
                  
                  return (
                    <MobileTableCard key={client.id}>
                      <MobileCardHeader
                        title={client.name}
                        subtitle={client.phone}
                        badge={
                          hasPreferences ? (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </Badge>
                          ) : null
                        }
                      />
                      {client.email && (
                        <MobileCardRow label="Email" icon={<Mail className="h-3 w-3" />}>
                          <span className="text-sm truncate max-w-[180px]">{client.email}</span>
                        </MobileCardRow>
                      )}
                      {client.notes && (
                        <MobileCardRow label="Notițe" icon={<FileText className="h-3 w-3" />}>
                          <span className="text-sm truncate max-w-[180px]">{client.notes}</span>
                        </MobileCardRow>
                      )}
                      <MobileCardActions>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPreferences(client)}
                          className="gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </MobileCardActions>
                    </MobileTableCard>
                  );
                })
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Preferințe</TableHead>
                  <TableHead>Notițe</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Niciun client găsit
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const prefs = (client as any).preferences as ClientPreferences | null;
                    const hasPreferences = prefs && Object.keys(prefs).length > 0;
                    
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>
                          {hasPreferences ? (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" />
                              Setate
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{client.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenPreferences(client)}
                              title="Preferințe & Recomandări AI"
                            >
                              <Sparkles className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </motion.div>

      {/* Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editează Client" : "Client Nou"}
            </DialogTitle>
            <DialogDescription>
              Completează informațiile despre client
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nume *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notițe</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Anulează
              </Button>
              <Button type="submit">
                {editingClient ? "Salvează" : "Adaugă Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preferences & Recommendations Sheet */}
      <Sheet open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Preferințe & Recomandări AI
            </SheetTitle>
            <SheetDescription>
              {selectedClient?.name} - Setează preferințele pentru a primi recomandări personalizate
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Preferences Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Preferințe Proprietate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preț minim (€)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 50000"
                      value={preferences.min_price || ""}
                      onChange={(e) => setPreferences({ ...preferences, min_price: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preț maxim (€)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 150000"
                      value={preferences.max_price || ""}
                      onChange={(e) => setPreferences({ ...preferences, max_price: Number(e.target.value) || undefined })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Suprafață minimă (mp)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 40"
                      value={preferences.min_surface || ""}
                      onChange={(e) => setPreferences({ ...preferences, min_surface: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Suprafață maximă (mp)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={preferences.max_surface || ""}
                      onChange={(e) => setPreferences({ ...preferences, max_surface: Number(e.target.value) || undefined })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Număr camere</Label>
                    <Select
                      value={preferences.rooms?.toString() || ""}
                      onValueChange={(value) => setPreferences({ ...preferences, rooms: Number(value) || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 cameră</SelectItem>
                        <SelectItem value="2">2 camere</SelectItem>
                        <SelectItem value="3">3 camere</SelectItem>
                        <SelectItem value="4">4+ camere</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tip proprietate</Label>
                    <Select
                      value={preferences.property_type || ""}
                      onValueChange={(value) => setPreferences({ ...preferences, property_type: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartament">Apartament</SelectItem>
                        <SelectItem value="casa">Casă</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Locație preferată</Label>
                  <Input
                    placeholder="Ex: București, Sector 1"
                    value={preferences.location || ""}
                    onChange={(e) => setPreferences({ ...preferences, location: e.target.value || undefined })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={handleSavePreferences} className="flex-1">
                    Salvează Preferințe
                  </Button>
                  <Button
                    onClick={handleGetRecommendations}
                    disabled={isLoadingRecommendations}
                    className="flex-1 gap-2"
                  >
                    {isLoadingRecommendations ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Se caută...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Găsește Recomandări AI
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Recomandări AI ({recommendations.length})
                  </CardTitle>
                  <CardDescription>
                    Proprietăți potrivite pentru preferințele clientului
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <Card key={rec.property_id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="default" className="bg-primary">
                                #{index + 1} - {rec.match_score}% potrivire
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-base">
                              {rec.property.title}
                            </h4>
                            {rec.property.project_name && (
                              <p className="text-sm text-muted-foreground">
                                {rec.property.project_name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{rec.property.location || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Euro className="h-3.5 w-3.5" />
                            <span>
                              {rec.property.price_min ? formatPrice(rec.property.price_min) : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>
                              {rec.property.surface_min || "?"} mp
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">De ce se potrivește:</p>
                          <ul className="text-xs space-y-0.5">
                            {rec.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => window.open(`/proprietati/${rec.property_id}`, "_blank")}
                          >
                            <Home className="h-4 w-4" />
                            Vezi Proprietatea
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
