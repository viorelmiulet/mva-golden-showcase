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
import { Plus, Search, Pencil, Trash2, UserCheck, Phone, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const emptyForm = {
  name: "", phone: "", email: "", cnp: "", seria_ci: "", numar_ci: "",
  address: "", property_id: "", contract_start: "", contract_end: "",
  monthly_rent: "", currency: "EUR", deposit_paid: false, status: "active", notes: "",
  rent_day: "1",
};

const RentalTenants = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["rental-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_tenants").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["rental-properties-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_properties").select("id, name, address");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        ...formData,
        monthly_rent: formData.monthly_rent ? Number(formData.monthly_rent) : null,
        rent_day: formData.rent_day ? Number(formData.rent_day) : 1,
        property_id: formData.property_id || null,
        contract_start: formData.contract_start || null,
        contract_end: formData.contract_end || null,
      };
      if (editingId) {
        const result = await adminApi.update("rental_tenants", editingId, payload);
        if (!result.success) throw new Error(result.error || "Eroare la actualizare");
      } else {
        const result = await adminApi.insert("rental_tenants", payload);
        if (!result.success) throw new Error(result.error || "Eroare la inserare");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rental-tenants-stats"] });
      toast.success(editingId ? "Chiriaș actualizat!" : "Chiriaș adăugat!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminApi.delete("rental_tenants", id);
      if (!result.success) throw new Error(result.error || "Eroare la ștergere");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-tenants"] });
      toast.success("Chiriaș șters!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      name: t.name || "", phone: t.phone || "", email: t.email || "",
      cnp: t.cnp || "", seria_ci: t.seria_ci || "", numar_ci: t.numar_ci || "",
      address: t.address || "", property_id: t.property_id || "",
      contract_start: t.contract_start || "", contract_end: t.contract_end || "",
      monthly_rent: t.monthly_rent?.toString() || "", currency: t.currency || "EUR",
      deposit_paid: t.deposit_paid || false, status: t.status || "active", notes: t.notes || "",
    });
    setDialogOpen(true);
  };

  const getPropertyName = (id: string | null) => {
    if (!id) return "—";
    const p = properties.find(p => p.id === id);
    return p ? p.name : "—";
  };

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută chiriași..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-gold to-gold-light text-black"><Plus className="h-4 w-4 mr-1" />Adaugă</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editează Chiriaș" : "Adaugă Chiriaș"}</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nume *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><Label>CNP</Label><Input value={form.cnp} onChange={e => setForm({...form, cnp: e.target.value})} /></div>
                <div><Label>Seria CI</Label><Input value={form.seria_ci} onChange={e => setForm({...form, seria_ci: e.target.value})} /></div>
                <div><Label>Nr. CI</Label><Input value={form.numar_ci} onChange={e => setForm({...form, numar_ci: e.target.value})} /></div>
                <div><Label>Adresă</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div className="col-span-2">
                  <Label>Proprietate asociată</Label>
                  <Select value={form.property_id} onValueChange={v => setForm({...form, property_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.address}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Început contract</Label><Input type="date" value={form.contract_start} onChange={e => setForm({...form, contract_start: e.target.value})} /></div>
                <div><Label>Sfârșit contract</Label><Input type="date" value={form.contract_end} onChange={e => setForm({...form, contract_end: e.target.value})} /></div>
                <div><Label>Chirie lunară</Label><Input type="number" value={form.monthly_rent} onChange={e => setForm({...form, monthly_rent: e.target.value})} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activ</SelectItem>
                      <SelectItem value="inactive">Inactiv</SelectItem>
                      <SelectItem value="pending">În așteptare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nu sunt chiriași{search ? " care corespund căutării" : ""}.</p>
        </CardContent></Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map(t => (
            <Card key={t.id} className="admin-glass-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    {t.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</p>}
                    {t.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</p>}
                  </div>
                  <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status === "active" ? "Activ" : t.status === "inactive" ? "Inactiv" : "Așteptare"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Proprietate: {getPropertyName(t.property_id)}</p>
                {t.monthly_rent && <p className="text-xs font-medium">{t.monthly_rent} {t.currency}/lună</p>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(t)}><Pencil className="h-3 w-3 mr-1" />Editează</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Ștergi?")) deleteMutation.mutate(t.id); }}><Trash2 className="h-3 w-3" /></Button>
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
                <TableHead>Nume</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Proprietate</TableHead>
                <TableHead>Chirie</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell><div className="text-xs"><p>{t.phone || "—"}</p><p className="text-muted-foreground">{t.email || ""}</p></div></TableCell>
                  <TableCell className="text-sm">{getPropertyName(t.property_id)}</TableCell>
                  <TableCell className="text-sm">{t.monthly_rent ? `${t.monthly_rent} ${t.currency}` : "—"}</TableCell>
                  <TableCell className="text-xs">{t.contract_start ? `${t.contract_start} → ${t.contract_end || "?"}` : "—"}</TableCell>
                  <TableCell><Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status === "active" ? "Activ" : t.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Ștergi?")) deleteMutation.mutate(t.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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

export default RentalTenants;
