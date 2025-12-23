import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Save, Plus, Trash2, FileText, GripVertical, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContractClause {
  id: string;
  section_key: string;
  section_title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ContractClausesEditor = () => {
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedClauses, setEditedClauses] = useState<Record<string, Partial<ContractClause>>>({});
  const [newClause, setNewClause] = useState({
    section_key: "",
    section_title: "",
    content: "",
  });
  const [showNewClauseForm, setShowNewClauseForm] = useState(false);

  useEffect(() => {
    fetchClauses();
  }, []);

  const fetchClauses = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_clauses")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setClauses(data || []);
    } catch (error) {
      console.error("Error fetching clauses:", error);
      toast.error("Eroare la încărcarea clauzelor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClauseChange = (id: string, field: keyof ContractClause, value: string | boolean | number) => {
    setEditedClauses(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveClause = async (clause: ContractClause) => {
    const edits = editedClauses[clause.id];
    if (!edits) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("contract_clauses")
        .update(edits)
        .eq("id", clause.id);

      if (error) throw error;

      setClauses(prev =>
        prev.map(c => (c.id === clause.id ? { ...c, ...edits } : c))
      );
      setEditedClauses(prev => {
        const newEdits = { ...prev };
        delete newEdits[clause.id];
        return newEdits;
      });
      toast.success("Clauza a fost salvată");
    } catch (error) {
      console.error("Error saving clause:", error);
      toast.error("Eroare la salvarea clauzei");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllClauses = async () => {
    const editedIds = Object.keys(editedClauses);
    if (editedIds.length === 0) {
      toast.info("Nu există modificări de salvat");
      return;
    }

    setIsSaving(true);
    try {
      for (const id of editedIds) {
        const edits = editedClauses[id];
        const { error } = await supabase
          .from("contract_clauses")
          .update(edits)
          .eq("id", id);

        if (error) throw error;
      }

      setClauses(prev =>
        prev.map(c =>
          editedClauses[c.id] ? { ...c, ...editedClauses[c.id] } : c
        )
      );
      setEditedClauses({});
      toast.success(`${editedIds.length} clauze au fost salvate`);
    } catch (error) {
      console.error("Error saving clauses:", error);
      toast.error("Eroare la salvarea clauzelor");
    } finally {
      setIsSaving(false);
    }
  };

  const addNewClause = async () => {
    if (!newClause.section_key || !newClause.section_title || !newClause.content) {
      toast.error("Completează toate câmpurile");
      return;
    }

    setIsSaving(true);
    try {
      const maxOrder = clauses.reduce((max, c) => Math.max(max, c.sort_order), 0);
      
      const { data, error } = await supabase
        .from("contract_clauses")
        .insert({
          section_key: newClause.section_key,
          section_title: newClause.section_title,
          content: newClause.content,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setClauses(prev => [...prev, data]);
      setNewClause({ section_key: "", section_title: "", content: "" });
      setShowNewClauseForm(false);
      toast.success("Clauza nouă a fost adăugată");
    } catch (error: any) {
      console.error("Error adding clause:", error);
      if (error.code === "23505") {
        toast.error("O clauză cu această cheie există deja");
      } else {
        toast.error("Eroare la adăugarea clauzei");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClause = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi această clauză?")) return;

    try {
      const { error } = await supabase
        .from("contract_clauses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClauses(prev => prev.filter(c => c.id !== id));
      toast.success("Clauza a fost ștearsă");
    } catch (error) {
      console.error("Error deleting clause:", error);
      toast.error("Eroare la ștergerea clauzei");
    }
  };

  const resetToDefault = async (clause: ContractClause) => {
    const defaults: Record<string, { title: string; content: string }> = {
      obligatii_proprietar: {
        title: "III. OBLIGATIILE PROPRIETARULUI",
        content: `Proprietarul se obliga:
1. sa predea imobilul si bunurile din acesta in stare corespunzatoare la data convenita;
2. sa il garanteze pe chirias de evictiune;
3. sa nu tulbure exercitarea dreptului de folosinta al chiriasului in mod legal;
4. sa efectueze lucrarile de intretinere necesare pentru a mentine imobilul si bunurile in stare de functionare normala.`,
      },
      obligatii_chirias: {
        title: "IV. OBLIGATIILE CHIRIASULUI",
        content: `Chiriasul se obliga:
1. sa plateasca chiria la termenele si in cuantumul stabilit prin prezentul contract;
2. sa foloseasca imobilul si bunurile din acesta ca un bun proprietar, numai pentru destinatia prevazuta in contract;
3. sa pastreze integritatea imobilului si bunurilor din acesta;
4. sa permita accesul proprietarului pentru verificari periodice;
5. sa restituie proprietarului, la incetarea contractului, imobilul si bunurile in starea in care au fost primite.`,
      },
      incetare_contract: {
        title: "IX. CONDITIILE DE INCETARE A CONTRACTULUI",
        content: `1. la expirarea duratei pentru care a fost incheiat;
2. in situatia nerespectarii clauzelor contractuale de catre una din parti;
3. clauza fortei majore;
4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile.`,
      },
    };

    const defaultClause = defaults[clause.section_key];
    if (!defaultClause) {
      toast.error("Nu există valori implicite pentru această clauză");
      return;
    }

    try {
      const { error } = await supabase
        .from("contract_clauses")
        .update({
          section_title: defaultClause.title,
          content: defaultClause.content,
        })
        .eq("id", clause.id);

      if (error) throw error;

      setClauses(prev =>
        prev.map(c =>
          c.id === clause.id
            ? { ...c, section_title: defaultClause.title, content: defaultClause.content }
            : c
        )
      );
      toast.success("Clauza a fost resetată la valorile implicite");
    } catch (error) {
      console.error("Error resetting clause:", error);
      toast.error("Eroare la resetarea clauzei");
    }
  };

  const getClauseValue = (clause: ContractClause, field: keyof ContractClause) => {
    if (editedClauses[clause.id]?.[field] !== undefined) {
      return editedClauses[clause.id][field];
    }
    return clause[field];
  };

  const hasEdits = (clauseId: string) => {
    return editedClauses[clauseId] !== undefined;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Clauze Standard Contract
        </CardTitle>
        <div className="flex gap-2">
          {Object.keys(editedClauses).length > 0 && (
            <Badge variant="secondary" className="mr-2">
              {Object.keys(editedClauses).length} modificări nesalvate
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewClauseForm(!showNewClauseForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Clauză Nouă
          </Button>
          <Button
            size="sm"
            onClick={saveAllClauses}
            disabled={isSaving || Object.keys(editedClauses).length === 0}
          >
            <Save className="h-4 w-4 mr-1" />
            Salvează Tot
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showNewClauseForm && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cheie Unică (ex: clauza_speciala)</Label>
                  <Input
                    value={newClause.section_key}
                    onChange={(e) =>
                      setNewClause((prev) => ({
                        ...prev,
                        section_key: e.target.value.toLowerCase().replace(/\s/g, "_"),
                      }))
                    }
                    placeholder="cheie_clauza"
                  />
                </div>
                <div>
                  <Label>Titlu Secțiune</Label>
                  <Input
                    value={newClause.section_title}
                    onChange={(e) =>
                      setNewClause((prev) => ({ ...prev, section_title: e.target.value }))
                    }
                    placeholder="XI. CLAUZA SPECIALĂ"
                  />
                </div>
              </div>
              <div>
                <Label>Conținut Clauză</Label>
                <Textarea
                  value={newClause.content}
                  onChange={(e) =>
                    setNewClause((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Textul clauzei..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewClauseForm(false);
                    setNewClause({ section_key: "", section_title: "", content: "" });
                  }}
                >
                  Anulează
                </Button>
                <Button size="sm" onClick={addNewClause} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adaugă Clauza
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" className="space-y-2">
          {clauses.map((clause) => (
            <AccordionItem
              key={clause.id}
              value={clause.id}
              className={`border rounded-lg px-4 ${
                hasEdits(clause.id) ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 flex-1 text-left">
                    <span className="font-medium">
                      {getClauseValue(clause, "section_title") as string}
                    </span>
                    {!clause.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inactivă
                      </Badge>
                    )}
                    {hasEdits(clause.id) && (
                      <Badge variant="outline" className="text-xs border-primary text-primary">
                        Modificată
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {clause.section_key}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Titlu Secțiune</Label>
                    <Input
                      value={getClauseValue(clause, "section_title") as string}
                      onChange={(e) =>
                        handleClauseChange(clause.id, "section_title", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getClauseValue(clause, "is_active") as boolean}
                        onCheckedChange={(checked) =>
                          handleClauseChange(clause.id, "is_active", checked)
                        }
                      />
                      <Label>Activă</Label>
                    </div>
                    <div>
                      <Label>Ordine</Label>
                      <Input
                        type="number"
                        className="w-20"
                        value={getClauseValue(clause, "sort_order") as number}
                        onChange={(e) =>
                          handleClauseChange(clause.id, "sort_order", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Conținut Clauză</Label>
                  <Textarea
                    value={getClauseValue(clause, "content") as string}
                    onChange={(e) => handleClauseChange(clause.id, "content", e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Poți folosi placeholder-e: [DURATA], [DATA_INCEPERE], [PRET], [MONEDA], [GARANTIE]
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  {["obligatii_proprietar", "obligatii_chirias", "incetare_contract"].includes(
                    clause.section_key
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetToDefault(clause)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Resetează
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteClause(clause.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Șterge
                  </Button>
                  {hasEdits(clause.id) && (
                    <Button size="sm" onClick={() => saveClause(clause)} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvează
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {clauses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nu există clauze standard definite. Adaugă prima clauză folosind butonul de mai sus.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractClausesEditor;
