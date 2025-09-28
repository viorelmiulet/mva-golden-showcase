import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebsiteScraper } from '../hooks/useWebsiteScraper';
import { Loader2, Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const WebsiteScrapingManager = () => {
  const [xmlUrl, setXmlUrl] = useState('https://web.immoflux.ro/api/bridges/oferte360/68d0ec5a4a1e5.xml');
  const { 
    importXmlFeed,
    analyzeXmlStructure,
    isLoading, 
    error 
  } = useWebsiteScraper();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAnalyzeXml = async () => {
    if (!xmlUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid XML URL",
        variant: "destructive",
      });
      return;
    }
    const result = await analyzeXmlStructure(xmlUrl);
    if (result) {
      console.log('XML Structure Analysis:', result);
      toast({
        title: "XML Analysis Complete",
        description: `XML structure analyzed. Check console for details. Length: ${result.data?.fullLength} chars`,
      });
    }
  };

  const handleImportXml = async () => {
    if (!xmlUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid XML URL",
        variant: "destructive",
      });
      return;
    }
    const res = await importXmlFeed(xmlUrl);
    if (res?.success) {
      // Refresh properties lists
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleAnalyzeXml}
                  disabled={isLoading || !xmlUrl.trim()}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Analyze XML
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleImportXml}
                  disabled={isLoading || !xmlUrl.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import XML
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
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>XML Feed Import:</strong> Analyze and import properties from XML feeds. The system automatically detects the XML structure and maps property data to your catalog format.</p>
            <p><strong>Supported Formats:</strong> OFERTE360, generic property XML feeds, and most real estate XML formats.</p>
            <p><strong>Data Processing:</strong> All imported properties are automatically formatted to match your catalog structure with titles, descriptions, prices, images, and features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteScrapingManager;