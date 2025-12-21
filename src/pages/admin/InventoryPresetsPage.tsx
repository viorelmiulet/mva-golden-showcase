import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Save, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface PresetItem {
  id: string;
  item_name: string;
  quantity: number;
  condition: string;
  location: string;
  notes: string;
  sort_order: number;
}

const InventoryPresetsPage = () => {
  const [items, setItems] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PresetItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Omit<PresetItem, 'id' | 'sort_order'>>({
    item_name: '',
    quantity: 1,
    condition: 'buna',
    location: '',
    notes: ''
  });

  const conditions = [
    { value: 'foarte buna', label: 'Foarte buna' },
    { value: 'buna', label: 'Buna' },
    { value: 'acceptabila', label: 'Acceptabila' },
    { value: 'necesita reparatii', label: 'Necesita reparatii' }
  ];

  const locations = [
    'Bucatarie', 'Living', 'Dormitor', 'Baie', 'Hol', 'Balcon', 'Debara', 'Birou'
  ];

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('preset_inventory_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Eroare la incarcarea articolelor');
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    if (!newItem.item_name.trim()) {
      toast.error('Introduceti denumirea articolului');
      return;
    }

    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;

    const { error } = await supabase
      .from('preset_inventory_items')
      .insert({
        ...newItem,
        sort_order: maxOrder + 1
      });

    if (error) {
      toast.error('Eroare la adaugarea articolului');
      console.error(error);
    } else {
      toast.success('Articol adaugat cu succes');
      setNewItem({ item_name: '', quantity: 1, condition: 'buna', location: '', notes: '' });
      setShowAddForm(false);
      fetchItems();
    }
  };

  const handleEdit = (item: PresetItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = async () => {
    if (!editForm.item_name?.trim()) {
      toast.error('Introduceti denumirea articolului');
      return;
    }

    const { error } = await supabase
      .from('preset_inventory_items')
      .update({
        item_name: editForm.item_name,
        quantity: editForm.quantity,
        condition: editForm.condition,
        location: editForm.location,
        notes: editForm.notes
      })
      .eq('id', editingId);

    if (error) {
      toast.error('Eroare la salvarea modificarilor');
      console.error(error);
    } else {
      toast.success('Modificari salvate');
      setEditingId(null);
      setEditForm({});
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur doriti sa stergeti acest articol?')) return;

    const { error } = await supabase
      .from('preset_inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Eroare la stergerea articolului');
      console.error(error);
    } else {
      toast.success('Articol sters');
      fetchItems();
    }
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === items.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = items[currentIndex];
    const swapItem = items[newIndex];

    await Promise.all([
      supabase.from('preset_inventory_items').update({ sort_order: swapItem.sort_order }).eq('id', currentItem.id),
      supabase.from('preset_inventory_items').update({ sort_order: currentItem.sort_order }).eq('id', swapItem.id)
    ]);

    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Articole Inventar Presetate</h1>
          <p className="text-muted-foreground">Gestioneaza lista standard de articole pentru inventar</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Articol
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Articol Nou</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Denumire *</Label>
                <Input
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Ex: Frigider"
                />
              </div>
              <div>
                <Label>Cantitate</Label>
                <Input
                  type="number"
                  min={1}
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Stare</Label>
                <Select value={newItem.condition} onValueChange={(v) => setNewItem({ ...newItem, condition: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Locatie</Label>
                <Select value={newItem.location} onValueChange={(v) => setNewItem({ ...newItem, location: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteaza..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleAdd}>
                  <Save className="mr-2 h-4 w-4" />
                  Salveaza
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Se incarca...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nu exista articole presetate. Adauga primul articol!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Denumire</TableHead>
                  <TableHead className="w-24">Cantitate</TableHead>
                  <TableHead>Stare</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead className="w-32 text-right">Actiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={index === items.length - 1}
                            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          value={editForm.item_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
                        />
                      ) : (
                        item.item_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          min={1}
                          value={editForm.quantity || 1}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Select value={editForm.condition || ''} onValueChange={(v) => setEditForm({ ...editForm, condition: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.condition
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Select value={editForm.location || ''} onValueChange={(v) => setEditForm({ ...editForm, location: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(l => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.location
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPresetsPage;
