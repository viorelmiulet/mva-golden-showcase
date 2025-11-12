import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface XmlFieldMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedFields: string[];
  sampleData: any;
  onConfirmMapping: (mapping: Record<string, string>) => void;
  isImporting?: boolean;
}

const TARGET_FIELDS = [
  { value: "title", label: "Titlu", required: true },
  { value: "description", label: "Descriere", required: false },
  { value: "location", label: "Locație", required: true },
  { value: "price", label: "Preț", required: true },
  { value: "surface", label: "Suprafață", required: false },
  { value: "rooms", label: "Camere", required: true },
  { value: "currency", label: "Monedă", required: false },
  { value: "images", label: "Imagini", required: false },
  { value: "features", label: "Caracteristici", required: false },
  { value: "contact", label: "Contact", required: false },
  { value: "transaction_type", label: "Tip Tranzacție", required: false },
];

export const XmlFieldMappingDialog = ({
  open,
  onOpenChange,
  detectedFields,
  sampleData,
  onConfirmMapping,
  isImporting = false,
}: XmlFieldMappingDialogProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [savedMappings, setSavedMappings] = useState<Record<string, Record<string, string>>>({});

  // Auto-detect mappings based on common field names
  useEffect(() => {
    if (detectedFields.length > 0 && Object.keys(mapping).length === 0) {
      const autoMapping: Record<string, string> = {};
      
      TARGET_FIELDS.forEach(({ value: targetField }) => {
        const detected = detectedFields.find(field => {
          const fieldLower = field.toLowerCase();
          const targetLower = targetField.toLowerCase();
          
          // Direct match
          if (fieldLower === targetLower) return true;
          
          // Common variations
          if (targetField === "title" && (fieldLower.includes("titlu") || fieldLower.includes("name") || fieldLower.includes("denumire"))) return true;
          if (targetField === "description" && (fieldLower.includes("desc") || fieldLower.includes("content") || fieldLower.includes("detalii"))) return true;
          if (targetField === "location" && (fieldLower.includes("location") || fieldLower.includes("address") || fieldLower.includes("adresa") || fieldLower.includes("oras"))) return true;
          if (targetField === "price" && (fieldLower.includes("pret") || fieldLower.includes("price") || fieldLower.includes("cost"))) return true;
          if (targetField === "surface" && (fieldLower.includes("suprafata") || fieldLower.includes("surface") || fieldLower.includes("area") || fieldLower.includes("mp"))) return true;
          if (targetField === "rooms" && (fieldLower.includes("camere") || fieldLower.includes("rooms") || fieldLower.includes("bedrooms"))) return true;
          if (targetField === "currency" && (fieldLower.includes("currency") || fieldLower.includes("moneda") || fieldLower.includes("valuta"))) return true;
          if (targetField === "images" && (fieldLower.includes("image") || fieldLower.includes("photo") || fieldLower.includes("foto") || fieldLower.includes("poza"))) return true;
          if (targetField === "features" && (fieldLower.includes("features") || fieldLower.includes("caracteristici") || fieldLower.includes("amenities"))) return true;
          if (targetField === "contact" && (fieldLower.includes("contact") || fieldLower.includes("phone") || fieldLower.includes("telefon"))) return true;
          
          return false;
        });
        
        if (detected) {
          autoMapping[targetField] = detected;
        }
      });
      
      setMapping(autoMapping);
      
      if (Object.keys(autoMapping).length > 0) {
        toast.success(`Auto-detectate ${Object.keys(autoMapping).length} mapări`);
      }
    }
  }, [detectedFields]);

  // Load saved mappings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("xml_field_mappings");
    if (saved) {
      try {
        setSavedMappings(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved mappings:", e);
      }
    }
  }, []);

  const handleMappingChange = (targetField: string, sourceField: string) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: sourceField === "none" ? "" : sourceField,
    }));
  };

  const handleSaveMapping = () => {
    const mappingName = prompt("Nume pentru această configurație de mapare:");
    if (mappingName) {
      const newSavedMappings = {
        ...savedMappings,
        [mappingName]: mapping,
      };
      setSavedMappings(newSavedMappings);
      localStorage.setItem("xml_field_mappings", JSON.stringify(newSavedMappings));
      toast.success(`Mapare salvată: ${mappingName}`);
    }
  };

  const handleLoadMapping = (mappingName: string) => {
    if (savedMappings[mappingName]) {
      setMapping(savedMappings[mappingName]);
      toast.success(`Mapare încărcată: ${mappingName}`);
    }
  };

  const handleConfirm = () => {
    // Validate required fields
    const missingRequired = TARGET_FIELDS
      .filter(f => f.required && !mapping[f.value])
      .map(f => f.label);
    
    if (missingRequired.length > 0) {
      toast.error(`Câmpuri obligatorii nemapate: ${missingRequired.join(", ")}`);
      return;
    }
    
    onConfirmMapping(mapping);
  };

  const getMappedValue = (targetField: string) => {
    const sourceField = mapping[targetField];
    if (!sourceField || !sampleData) return "—";
    
    const value = sampleData[sourceField];
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === "object") return JSON.stringify(value).substring(0, 50) + "...";
    return String(value || "—").substring(0, 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Mapare Câmpuri XML
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Saved Mappings */}
          {Object.keys(savedMappings).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Mapări Salvate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(savedMappings).map(name => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => handleLoadMapping(name)}
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mapping Table */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Mapează câmpurile detectate din XML la câmpurile din baza de date.
                Câmpurile obligatorii sunt marcate cu <span className="text-red-500">*</span>
              </div>

              {TARGET_FIELDS.map(({ value: targetField, label, required }) => (
                <Card key={targetField}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      {/* Target Field */}
                      <div>
                        <Label className="text-sm font-semibold">
                          {label} {required && <span className="text-red-500">*</span>}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Câmp destinație
                        </p>
                      </div>

                      {/* Source Field Selection */}
                      <div>
                        <Select
                          value={mapping[targetField] || "none"}
                          onValueChange={(value) => handleMappingChange(targetField, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează câmp XML" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Nemapat —</SelectItem>
                            {detectedFields.map(field => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Preview */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Preview</Label>
                        <div className="mt-1 p-2 bg-muted rounded text-xs font-mono truncate">
                          {getMappedValue(targetField)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Statistics */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{detectedFields.length}</div>
                  <div className="text-xs text-muted-foreground">Câmpuri detectate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Object.keys(mapping).filter(k => mapping[k]).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Câmpuri mapate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {TARGET_FIELDS.filter(f => f.required && !mapping[f.value]).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Obligatorii nemapate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveMapping}
            disabled={Object.keys(mapping).length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvează Mapare
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Anulează
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import în curs...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Confirmă și Importă
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
