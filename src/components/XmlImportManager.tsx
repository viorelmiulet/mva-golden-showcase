import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebsiteScraper } from '../hooks/useWebsiteScraper';
import { Loader2, Download, FileText, Settings, History, Trash2, Clock, Pencil, Check, X, Plus, CheckCircle, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { XmlFieldMappingDialog } from './XmlFieldMappingDialog';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { triggerSocialAutoPost } from '@/lib/socialAutoPost';

interface XmlSource {
  id: string;
  url: string;
  name: string | null;
  last_used_at: string;
  created_at: string;
  import_count: number;
  last_mapping: Record<string, string> | null;
}

const WebsiteScrapingManager = () => {
  const [xmlUrl, setXmlUrl] = useState('');
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [xmlAnalysis, setXmlAnalysis] = useState<any>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // ID scraping state
  const [propertyIds, setPropertyIds] = useState(Array(3).fill(""));
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(Array(3).fill(false));
  const [isFixingZones, setIsFixingZones] = useState(false);
  const [zoneFixResult, setZoneFixResult] = useState<any>(null);
  
  const { 
    importXmlFeed,
    analyzeXmlStructure,
    importXmlWithMapping,
    isLoading, 
    error 
  } = useWebsiteScraper();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch XML sources history
  const { data: xmlSources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['xml_import_sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xml_import_sources')
        .select('*')
        .order('last_used_at', { ascending: false });
      
      if (error) throw error;
      return data as XmlSource[];
    }
  });

  // Save or update XML source
  const saveSourceMutation = useMutation({
    mutationFn: async ({ url, mapping }: { url: string; mapping?: Record<string, string> }) => {
      const existingSource = xmlSources.find(s => s.url === url);
      
      if (existingSource) {
        const { error } = await supabase
          .from('xml_import_sources')
          .update({ 
            last_used_at: new Date().toISOString(),
            import_count: existingSource.import_count + 1,
            ...(mapping && { last_mapping: mapping })
          })
          .eq('id', existingSource.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('xml_import_sources')
          .insert({ 
            url,
            name: new URL(url).hostname,
            ...(mapping && { last_mapping: mapping })
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml_import_sources'] });
    }
  });

  // Delete XML source
  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('xml_import_sources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml_import_sources'] });
      toast({
        title: "Sursă ștearsă",
        description: "Sursa XML a fost eliminată din istoric",
      });
    }
  });

  // Rename XML source
  const renameSourceMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('xml_import_sources')
        .update({ name: name.trim() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml_import_sources'] });
      setEditingSourceId(null);
      setEditingName('');
      toast({
        title: "Sursă redenumită",
        description: "Numele sursei a fost actualizat",
      });
    }
  });

  const handleStartRename = (e: React.MouseEvent, source: XmlSource) => {
    e.stopPropagation();
    setEditingSourceId(source.id);
    setEditingName(source.name || new URL(source.url).hostname);
  };

  const handleConfirmRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingSourceId && editingName.trim()) {
      renameSourceMutation.mutate({ id: editingSourceId, name: editingName });
    }
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSourceId(null);
    setEditingName('');
  };

  const handleSelectSource = (source: XmlSource) => {
    setXmlUrl(source.url);
    setSelectedSourceId(source.id);
    setXmlAnalysis(null);
  };

  const handleAnalyzeXml = async () => {
    if (!xmlUrl.trim()) {
      toast({
        title: "Eroare",
        description: "Introdu un URL XML valid",
        variant: "destructive",
      });
      return;
    }
    const result = await analyzeXmlStructure(xmlUrl);
    if (result) {
      console.log('XML Structure Analysis:', result);
      setXmlAnalysis(result);
      toast({
        title: "Analiză XML Completă",
        description: `Structură analizată. Găsite ${result.data?.summary?.estimatedPropertyCount || 0} proprietăți potențiale.`,
      });
    }
  };

  const handleOpenMappingDialog = async () => {
    if (!xmlUrl.trim()) {
      toast({
        title: "Eroare",
        description: "Introdu un URL XML valid",
        variant: "destructive",
      });
      return;
    }
    
    // Analyze first if not already done
    if (!xmlAnalysis) {
      const result = await analyzeXmlStructure(xmlUrl);
      if (result) {
        setXmlAnalysis(result);
      } else {
        return;
      }
    }
    
    setMappingDialogOpen(true);
  };

  const handleConfirmMapping = async (mapping: Record<string, string>) => {
    const res = await importXmlWithMapping(xmlUrl, mapping);
    if (res?.success) {
      setMappingDialogOpen(false);
      setXmlAnalysis(null);
      saveSourceMutation.mutate({ url: xmlUrl, mapping });
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] });
    }
  };

  const handleQuickImport = async () => {
    if (!xmlUrl.trim()) {
      toast({
        title: "Eroare",
        description: "Introdu un URL XML valid",
        variant: "destructive",
      });
      return;
    }
    const res = await importXmlFeed(xmlUrl);
    if (res?.success) {
      saveSourceMutation.mutate({ url: xmlUrl });
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] });
    }
  };

  // ID Scraping functions
  const scrapeProperty = async (propertyId: string, index: number) => {
    if (!propertyId.trim()) {
      toast({
        title: "Eroare",
        description: "Te rog să introduci un ID valid",
        variant: "destructive",
      });
      return;
    }

    const url = `https://web.immoflux.ro/publicproperty/p${propertyId.trim()}`;
    setLoadingStates((prev) => prev.map((state, i) => (i === index ? true : state)));

    try {
      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url },
      });

      if (error) throw error;

      if (data?.success) {
        const insertData = {
          title: data.property.title,
          description: data.property.description,
          location: data.property.location,
          images: data.property.images,
          price_min: data.property.price_min,
          price_max: data.property.price_max,
          currency: data.property.currency,
          surface_min: data.property.surface_min || 0,
          surface_max: data.property.surface_max || 0,
          rooms: data.property.rooms,
          features: data.property.features,
          availability_status: "available",
        };

        const { data: adminInsertData, error: adminInsertError } =
          await supabase.functions.invoke("admin-offers", {
            body: { action: "insert_offer", offer: insertData },
          });

        if (adminInsertError) throw adminInsertError;
        if (!adminInsertData?.success)
          throw new Error(adminInsertData?.error || "Insert failed");

        // Trigger social auto-post for the new property
        if (adminInsertData?.data?.id) {
          await triggerSocialAutoPost(adminInsertData.data.id);
        }

        toast({
          title: "Succes!",
          description: `Proprietatea ${index + 1} (ID: ${propertyId}) a fost adăugată`,
        });

        setPropertyIds((prev) => prev.map((id, i) => (i === index ? "" : id)));
        queryClient.invalidateQueries({ queryKey: ["catalog_offers"] });
      } else {
        throw new Error(data?.error || "Eroare la preluarea datelor");
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: `ID ${propertyId}: ${error.message || "Nu am putut prelua datele"}`,
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => prev.map((state, i) => (i === index ? false : state)));
    }
  };

  const scrapeAllProperties = async () => {
    const validIds = propertyIds.filter((id) => id && typeof id === 'string' && id.trim() !== "");

    if (validIds.length === 0) {
      toast({
        title: "Eroare",
        description: "Te rog să introduci cel puțin un ID valid",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingLoading(true);

    try {
      const promises = validIds.map((propertyId, index) => {
        return scrapeProperty(propertyId, index);
      });

      await Promise.all(promises);

      toast({
        title: "Procesare completă!",
        description: `Am procesat ${validIds.length} proprietăți`,
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: "Eroare la procesarea proprietăților",
        variant: "destructive",
      });
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const updatePropertyId = (index: number, value: string) => {
    setPropertyIds((prev) => prev.map((id, i) => (i === index ? value : id)));
  };

  // Get saved mapping for current URL
  const currentSourceMapping = xmlSources.find(s => s.url === xmlUrl)?.last_mapping;

  const handleFixZones = async (dryRun = false) => {
    setIsFixingZones(true);
    setZoneFixResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('fix-property-zones', {
        body: { dry_run: dryRun, limit: 50 },
      });
      if (error) throw error;
      setZoneFixResult(data);
      toast({
        title: dryRun ? 'Verificare completă' : 'Zone corectate',
        description: data?.message || 'Operațiune finalizată',
      });
      if (!dryRun) {
        queryClient.invalidateQueries({ queryKey: ['catalog_offers'] });
      }
    } catch (err: any) {
      toast({
        title: 'Eroare',
        description: err.message || 'Eroare la corectarea zonelor',
        variant: 'destructive',
      });
    } finally {
      setIsFixingZones(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ID Scraping Section */}
      <Card className="border-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-gold" />
            Adaugă Proprietăți via ID
          </CardTitle>
          <CardDescription>
            Importă proprietăți rapid folosind ID-ul din Immoflux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {propertyIds.map((id, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`ID ${index + 1}`}
                  value={id}
                  onChange={(e) => updatePropertyId(index, e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Button
                  onClick={() => scrapeProperty(id, index)}
                  disabled={loadingStates[index] || !id.trim()}
                  size="sm"
                  variant="outline"
                  className="border-gold/30 h-9 w-9 p-0"
                >
                  {loadingStates[index] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={scrapeAllProperties}
            disabled={isScrapingLoading}
            className="w-full h-9 text-sm bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold"
          >
            {isScrapingLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se procesează...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Adaugă Toate
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      {/* XML Sources History */}
      {xmlSources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Surse XML Recente
            </CardTitle>
            <CardDescription>
              Selectează o sursă din istoric pentru a importa rapid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {xmlSources.map((source) => (
                  <div
                    key={source.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer group",
                      selectedSourceId === source.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => editingSourceId !== source.id && handleSelectSource(source)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {editingSourceId === source.id ? (
                          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmRename(e as any);
                                if (e.key === 'Escape') handleCancelRename(e as any);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={handleConfirmRename}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={handleCancelRename}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-sm truncate">
                              {source.name || new URL(source.url).hostname}
                            </p>
                            {source.last_mapping && (
                              <Badge variant="secondary" className="text-xs">
                                Mapare salvată
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {source.url}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(source.last_used_at), 'd MMM yyyy, HH:mm', { locale: ro })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {source.import_count} importuri
                        </span>
                      </div>
                    </div>
                    {editingSourceId !== source.id && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleStartRename(e, source)}
                          title="Redenumește"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSourceMutation.mutate(source.id);
                          }}
                          title="Șterge"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            XML Feed Import
          </CardTitle>
          <CardDescription>
            Importă proprietăți din feed-uri XML în catalogul tău
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* XML Import Section */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="xml-url">XML Feed URL</Label>
                <Input
                  id="xml-url"
                  type="url"
                  value={xmlUrl}
                  onChange={(e) => {
                    setXmlUrl(e.target.value);
                    setSelectedSourceId(null);
                  }}
                  placeholder="https://example.com/properties.xml"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={handleAnalyzeXml}
                  disabled={isLoading || !xmlUrl.trim()}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizare...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Analizează XML
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleOpenMappingDialog}
                  disabled={isLoading || !xmlUrl.trim()}
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Pregătire...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Import cu Mapare
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleQuickImport}
                  disabled={isLoading || !xmlUrl.trim()}
                  variant="secondary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import Rapid
                    </>
                  )}
                </Button>
              </div>

              {currentSourceMapping && (
                <p className="text-sm text-muted-foreground">
                  ✓ Mapare salvată disponibilă pentru această sursă
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cum funcționează</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Import cu Mapare:</strong> Analizează structura XML, apoi definește manual maparea câmpurilor pentru control complet. Ideal pentru feed-uri recurente.</p>
            <p><strong>Import Rapid:</strong> Folosește auto-detecția pentru mapare automată. Cel mai rapid, dar poate necesita ajustări ulterior.</p>
            <p><strong>Formate Suportate:</strong> OFERTE360, feed-uri XML generice imobiliare, și majoritatea formatelor standard XML.</p>
            <p><strong>Istoric Surse:</strong> URL-urile XML utilizate sunt salvate automat pentru acces rapid la importuri viitoare.</p>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Dialog */}
      {xmlAnalysis && (
        <XmlFieldMappingDialog
          open={mappingDialogOpen}
          onOpenChange={setMappingDialogOpen}
          detectedFields={xmlAnalysis.data?.summary?.samplePropertyFields || []}
          sampleData={xmlAnalysis.data?.sampleProperty || {}}
          onConfirmMapping={handleConfirmMapping}
          isImporting={isLoading}
          savedMapping={currentSourceMapping || undefined}
        />
      )}
    </div>
  );
};

export default WebsiteScrapingManager;