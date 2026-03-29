import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Home, MapPin, Euro } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Disponibil", variant: "outline" },
  rented: { label: "Închiriat", variant: "default" },
  maintenance: { label: "Mentenanță", variant: "secondary" },
};

const emptyForm = {
  name: "", address: "", city: "București", zone: "", property_type: "apartament",
  rooms: 2, surface: "", floor: "", total_floors: "", monthly_rent: "",
  currency: "EUR", deposit_amount: "", landlord_name: "", landlord_phone: "",
  landlord_email: "", status: "available", notes: "", furnished: "mobilat", heating: "",
};

const RentalProperties = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["rental-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        ...formData,
        rooms: Number(formData.rooms) || 2,
        surface: formData.surface ? Number(formData.surface) : null,
        floor: formData.floor ? Number(formData.floor) : null,
        total_floors: formData.total_floors ? Number(formData.total_floors) : null,
        monthly_rent: Number(formData.monthly_rent) || 0,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : 0,
      };
      if (editingId) {
        const { error } = await supabase.from("rental_properties").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rental_properties").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-properties"] });
      queryClient.invalidateQueries({ queryKey: ["rental-properties-stats"] });
      toast.success(editingId ? "Proprietate actualizată!" : "Proprietate adăugată!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rental_properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-properties"] });
      queryClient.invalidateQueries({ queryKey: ["rental-properties-stats"] });
      toast.success("Proprietate ștearsă!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "", address: p.address || "", city: p.city || "București",
      zone: p.zone || "", property_type: p.property_type || "apartament",
      rooms: p.rooms || 2, surface: p.surface?.toString() || "", floor: p.floor?.toString() || "",
      total_floors: p.total_floors?.toString() || "", monthly_rent: p.monthly_rent?.toString() || "",
      currency: p.currency || "EUR", deposit_amount: p.deposit_amount?.toString() || "",
      landlord_name: p.landlord_name || "", landlord_phone: p.landlord_phone || "",
      landlord_email: p.landlord_email || "", status: p.status || "available",
      notes: p.notes || "", furnished: p.furnished || "mobilat", heating: p.heating || "",
    });
    setDialogOpen(true);
  };

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.zone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută proprietăți..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-gold to-gold-light text-black">
              <Plus className="h-4 w-4 mr-1" /> Adaugă
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editează Proprietate" : "Adaugă Proprietate"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Nume / Titlu *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="col-span-2">
                  <Label>Adresă *</Label>
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
                </div>
                <div>
                  <Label>Oraș</Label>
                  <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div>
                  <Label>Zonă</Label>
                  <Input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} />
                </div>
                <div>
                  <Label>Tip</Label>
                  <Select value={form.property_type} onValueChange={v => setForm({...form, property_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartament">Apartament</SelectItem>
                      <SelectItem value="casa">Casă</SelectItem>
                      <SelectItem value="garsoniera">Garsonieră</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Camere</Label>
                  <Input type="number" value={form.rooms} onChange={e => setForm({...form, rooms: Number(e.target.value)})} />
                </div>
                <div>
                  <Label>Suprafață (mp)</Label>
                  <Input value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} />
                </div>
                <div>
                  <Label>Etaj</Label>
                  <Input value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} />
                </div>
                <div>
                  <Label>Chirie lunară *</Label>
                  <Input type="number" value={form.monthly_rent} onChange={e => setForm({...form, monthly_rent: e.target.value})} required />
                </div>
                <div>
                  <Label>Monedă</Label>
                  <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RON">RON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Garanție</Label>
                  <Input value={form.deposit_amount} onChange={e => setForm({...form, deposit_amount: e.target.value})} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponibil</SelectItem>
                      <SelectItem value="rented">Închiriat</SelectItem>
                      <SelectItem value="maintenance">Mentenanță</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Proprietar</Label><Input value={form.landlord_name} onChange={e => setForm({...form, landlord_name: e.target.value})} placeholder="Nume proprietar" /></div>
                <div><Label>Tel. Proprietar</Label><Input value={form.landlord_phone} onChange={e => setForm({...form, landlord_phone: e.target.value})} /></div>
                <div><Label>Email Proprietar</Label><Input value={form.landlord_email} onChange={e => setForm({...form, landlord_email: e.target.value})} /></div>
                <div className="col-span-2"><Label>Note</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
              </div>
              <Button type="submit" disabled={saveMutation.isPending} className="w-full bg-gold text-black hover:bg-gold/90">
                {saveMutation.isPending ? "Se salvează..." : editingId ? "Actualizează" : "Adaugă"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="admin-glass-card"><CardContent className="py-12 text-center text-muted-foreground">
          <Home className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nu sunt proprietăți{search ? " care să corespundă căutării" : ""}.</p>
        </CardContent></Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map(p => (
            <Card key={p.id} className="admin-glass-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}{p.zone ? `, ${p.zone}` : ""}</p>
                  </div>
                  <Badge variant={statusLabels[p.status || "available"]?.variant || "outline"}>
                    {statusLabels[p.status || "available"]?.label || p.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.rooms} cam · {p.surface || "—"} mp</span>
                  <span className="font-semibold text-foreground">{p.monthly_rent} {p.currency}/lună</span>
                </div>
                {p.landlord_name && <p className="text-xs text-muted-foreground">Proprietar: {p.landlord_name}</p>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" />Editează</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Ștergi proprietatea?")) deleteMutation.mutate(p.id); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="admin-glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proprietate</TableHead>
                <TableHead>Zonă</TableHead>
                <TableHead>Camere</TableHead>
                <TableHead>Chirie</TableHead>
                <TableHead>Proprietar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.address}</p></div>
                  </TableCell>
                  <TableCell className="text-sm">{p.zone || "—"}</TableCell>
                  <TableCell className="text-sm">{p.rooms} cam · {p.surface || "—"} mp</TableCell>
                  <TableCell className="text-sm font-medium">{p.monthly_rent} {p.currency}</TableCell>
                  <TableCell className="text-sm">{p.landlord_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[p.status || "available"]?.variant || "outline"}>
                      {statusLabels[p.status || "available"]?.label || p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Ștergi?")) deleteMutation.mutate(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default RentalProperties;
