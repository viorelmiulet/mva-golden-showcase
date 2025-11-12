import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebsiteScraper } from '../hooks/useWebsiteScraper';
import { Loader2, Download, FileText, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { XmlFieldMappingDialog } from './XmlFieldMappingDialog';

const WebsiteScrapingManager = () => {
  const [xmlUrl, setXmlUrl] = useState('https://web.immoflux.ro/api/bridges/oferte360/68d0ec5a4a1e5.xml');
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [xmlAnalysis, setXmlAnalysis] = useState<any>(null);
  const { 
    importXmlFeed,
    analyzeXmlStructure,
    importXmlWithMapping,
    isLoading, 
    error 
  } = useWebsiteScraper();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            XML Feed Import
          </CardTitle>
          <CardDescription>
            Import properties from XML feeds into your catalog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* XML Import Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">XML Feed Import</h3>
              <Badge variant="outline">XML</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="xml-url">XML Feed URL</Label>
                <Input
                  id="xml-url"
                  type="url"
                  value={xmlUrl}
                  onChange={(e) => setXmlUrl(e.target.value)}
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
            <p><strong>Mapări Salvate:</strong> Salvează configurațiile de mapare pentru a le refolosi la importurile viitoare din același feed.</p>
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
        />
      )}
    </div>
  );
};

export default WebsiteScrapingManager;