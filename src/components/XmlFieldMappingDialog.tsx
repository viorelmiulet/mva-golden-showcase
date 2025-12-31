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
  savedMapping?: Record<string, string>;
}

const TARGET_FIELDS = [
  // Required fields
  { value: "title", label: "Titlu", required: true },
  { value: "location", label: "Locație", required: true },
  { value: "price", label: "Preț", required: true },
  { value: "rooms", label: "Camere", required: true },
  
  // Property details
  { value: "description", label: "Descriere", required: false },
  { value: "surface", label: "Suprafață Utilă", required: false },
  { value: "surface_total", label: "Suprafață Totală", required: false },
  { value: "surface_land", label: "Suprafață Teren", required: false },
  { value: "currency", label: "Monedă", required: false },
  { value: "transaction_type", label: "Tip Tranzacție", required: false },
  { value: "property_type", label: "Tip Proprietate", required: false },
  
  // Building info
  { value: "floor", label: "Etaj", required: false },
  { value: "total_floors", label: "Total Etaje", required: false },
  { value: "year_built", label: "An Construcție", required: false },
  { value: "building_type", label: "Tip Clădire", required: false },
  { value: "compartment", label: "Compartimentare", required: false },
  
  // Room details
  { value: "bathrooms", label: "Băi", required: false },
  { value: "kitchens", label: "Bucătării", required: false },
  { value: "balconies", label: "Balcoane", required: false },
  { value: "terraces", label: "Terase", required: false },
  { value: "garages", label: "Garaje", required: false },
  { value: "parking", label: "Locuri Parcare", required: false },
  
  // Features & amenities
  { value: "features", label: "Caracteristici", required: false },
  { value: "amenities", label: "Facilități", required: false },
  { value: "comfort", label: "Confort", required: false },
  { value: "heating", label: "Încălzire", required: false },
  { value: "conditioning", label: "Aer Condiționat", required: false },
  { value: "furnished", label: "Mobilat", required: false },
  
  // Media
  { value: "images", label: "Imagini", required: false },
  { value: "floor_plan", label: "Plan Apartament", required: false },
  { value: "video", label: "Video", required: false },
  { value: "virtual_tour", label: "Tur Virtual", required: false },
  
  // Contact & source
  { value: "contact", label: "Contact/Telefon", required: false },
  { value: "email", label: "Email", required: false },
  { value: "agent", label: "Agent", required: false },
  { value: "agency", label: "Agenție", required: false },
  { value: "source_url", label: "Link Sursă", required: false },
  { value: "external_id", label: "ID Extern", required: false },
  
  // Status & dates
  { value: "availability_status", label: "Status Disponibilitate", required: false },
  { value: "available_from", label: "Disponibil Din", required: false },
  { value: "updated_at", label: "Ultima Actualizare", required: false },
  
  // Location details
  { value: "city", label: "Oraș", required: false },
  { value: "zone", label: "Zonă/Cartier", required: false },
  { value: "street", label: "Stradă", required: false },
  { value: "latitude", label: "Latitudine", required: false },
  { value: "longitude", label: "Longitudine", required: false },
];

export const XmlFieldMappingDialog = ({
  open,
  onOpenChange,
  detectedFields,
  sampleData,
  onConfirmMapping,
  isImporting = false,
  savedMapping,
}: XmlFieldMappingDialogProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [savedMappings, setSavedMappings] = useState<Record<string, Record<string, string>>>({});

  // Auto-detect mappings based on common field names, enhanced with saved mapping
  useEffect(() => {
    if (detectedFields.length === 0) return;
    
    // Define mapping patterns for each target field
    const fieldPatterns: Record<string, string[]> = {
      // Required
      title: ["titlu", "title", "name", "denumire", "nume", "titlu_anunt", "property_title"],
      location: ["location", "address", "adresa", "oras", "city", "zona", "cartier", "localitate", "geo", "geo_location", "property_location", "locatie"],
      price: ["pret", "price", "cost", "suma", "valoare", "property_price"],
      rooms: ["camere", "rooms", "bedrooms", "nr_camere", "numar_camere", "nr_cam", "bedroom_count"],
      
      // Property details
      description: ["desc", "content", "detalii", "text", "info", "descriere", "property_description", "observatii"],
      surface: ["suprafata", "surface", "area", "mp", "metri", "sqm", "sq_m", "suprafata_utila", "useful_area"],
      surface_total: ["suprafata_totala", "total_area", "gross_area", "suprafata_construita"],
      surface_land: ["teren", "land", "lot", "suprafata_teren", "land_area"],
      currency: ["currency", "moneda", "valuta", "coin", "money_type"],
      transaction_type: ["transaction", "tranzactie", "tip_anunt", "offer_type", "listing_type", "vanzare", "inchiriere", "sale", "rent", "tip_tranzactie"],
      property_type: ["tip_proprietate", "property_type", "tip_imobil", "categorie", "category", "type"],
      
      // Building info
      floor: ["etaj", "floor", "nivel", "level"],
      total_floors: ["etaje", "floors", "nr_etaje", "total_floors", "numar_etaje"],
      year_built: ["an", "year", "an_constructie", "year_built", "constructie", "built"],
      building_type: ["tip_cladire", "building_type", "structura", "structure"],
      compartment: ["compartimentare", "compartment", "layout"],
      
      // Room details
      bathrooms: ["bai", "bathrooms", "bath", "baie", "nr_bai"],
      kitchens: ["bucatarii", "kitchens", "kitchen", "bucatarie"],
      balconies: ["balcoane", "balconies", "balcon", "balcony"],
      terraces: ["terase", "terraces", "terasa", "terrace"],
      garages: ["garaje", "garages", "garaj", "garage"],
      parking: ["parcare", "parking", "loc_parcare", "parking_spots"],
      
      // Features
      features: ["features", "caracteristici", "amenities", "facilities", "dotari", "optiuni", "comfort", "extras"],
      amenities: ["amenities", "facilitati", "utilities"],
      comfort: ["confort", "comfort_level"],
      heating: ["incalzire", "heating", "centrala", "termica"],
      conditioning: ["aer", "ac", "conditioning", "clima", "climatizare"],
      furnished: ["mobilat", "furnished", "mobilier", "furniture"],
      
      // Media
      images: ["image", "photo", "foto", "poza", "picture", "gallery", "galerie", "media", "imagini", "poze", "photos"],
      floor_plan: ["plan", "floor_plan", "schita", "schema", "blueprint"],
      video: ["video", "clip", "movie", "film"],
      virtual_tour: ["tour", "virtual", "3d", "360"],
      
      // Contact
      contact: ["contact", "phone", "telefon", "tel", "mobile", "mobil", "agent_phone"],
      email: ["email", "mail", "e-mail"],
      agent: ["agent", "broker", "consultant"],
      agency: ["agentie", "agency", "firma", "company"],
      source_url: ["url", "link", "source", "sursa", "storia", "olx"],
      external_id: ["id_extern", "external_id", "ref", "reference", "cod", "code"],
      
      // Status
      availability_status: ["status", "disponibilitate", "availability", "stare"],
      available_from: ["disponibil", "available", "from_date", "start_date"],
      updated_at: ["actualizat", "updated", "modified", "data_actualizare"],
      
      // Location details
      city: ["oras", "city", "municipiu", "localitate"],
      zone: ["zona", "zone", "cartier", "neighborhood", "sector"],
      street: ["strada", "street", "adresa_strada"],
      latitude: ["lat", "latitude", "latitudine"],
      longitude: ["lng", "lon", "longitude", "longitudine"],
    };
    
    const autoMapping: Record<string, string> = {};
    
    // Auto-detect ALL fields first
    TARGET_FIELDS.forEach(({ value: targetField }) => {
      const patterns = fieldPatterns[targetField] || [];
      
      const detected = detectedFields.find(field => {
        const fieldLower = field.toLowerCase();
        
        // Direct match with target field name
        if (fieldLower === targetField.toLowerCase()) return true;
        
        // Check if any pattern matches
        return patterns.some(pattern => {
          if (fieldLower === pattern) return true;
          if (fieldLower.includes(pattern)) return true;
          if (pattern.includes(fieldLower) && fieldLower.length > 2) return true;
          return false;
        });
      });
      
      if (detected) {
        autoMapping[targetField] = detected;
      }
    });
    
    // Override with saved mapping if available (for previously mapped fields)
    if (savedMapping && Object.keys(savedMapping).length > 0) {
      Object.keys(savedMapping).forEach(key => {
        if (savedMapping[key]) {
          autoMapping[key] = savedMapping[key];
        }
      });
    }
    
    setMapping(autoMapping);
    
    const savedCount = savedMapping ? Object.keys(savedMapping).filter(k => savedMapping[k]).length : 0;
    const newCount = Object.keys(autoMapping).length - savedCount;
    
    if (savedCount > 0 && newCount > 0) {
      toast.success(`Încărcate ${savedCount} mapări salvate + ${newCount} noi auto-detectate`);
    } else if (Object.keys(autoMapping).length > 0) {
      toast.success(`Auto-detectate ${Object.keys(autoMapping).length} mapări din ${detectedFields.length} câmpuri`);
    }
  }, [detectedFields, savedMapping]);

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
