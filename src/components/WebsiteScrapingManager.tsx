import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useWebsiteScraper } from '../hooks/useWebsiteScraper';
import { Loader2, Globe, Download, TestTube, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const WebsiteScrapingManager = () => {
  const [websiteUrl, setWebsiteUrl] = useState('https://imobiliaremilitari.ro/crm/properties');
  const [xmlUrl, setXmlUrl] = useState('https://web.immoflux.ro/api/bridges/oferte360/68d0ec5a4a1e5.xml');
  const { 
    scrapeWebsite, 
    testImmofluxConnection, 
    syncImmofluxProperties,
    importXmlFeed,
    analyzeXmlStructure,
    isLoading, 
    error 
  } = useWebsiteScraper();
  const { toast } = useToast();

  const handleScrapeWebsite = async () => {
    if (!websiteUrl.trim()) {
      return;
    }
    await scrapeWebsite(websiteUrl);
  };

  const handleTestConnection = async () => {
    await testImmofluxConnection();
  };

  const handleSyncProperties = async () => {
    await syncImmofluxProperties();
  };

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
    await importXmlFeed(xmlUrl);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Import Properties from External Sources
          </CardTitle>
          <CardDescription>
            Import properties from external websites or API sources into your catalog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Website Scraping Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Website Scraping</h3>
              <Badge variant="secondary">Firecrawl</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com/properties"
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={handleScrapeWebsite}
                disabled={isLoading || !websiteUrl.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping Website...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Scrape Properties from Website
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

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

          <Separator />

          {/* Immoflux Integration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Immoflux API Integration</h3>
              <Badge variant="outline">API</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleTestConnection}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSyncProperties}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Properties
                  </>
                )}
              </Button>
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
            <p><strong>Website Scraping:</strong> Uses Firecrawl to extract property data from any real estate website. Properties are automatically parsed and imported into your catalog.</p>
            <p><strong>Immoflux API:</strong> Direct integration with Immoflux platform for seamless property synchronization.</p>
            <p><strong>Data Processing:</strong> All imported properties are automatically formatted to match your catalog structure with titles, descriptions, prices, images, and features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteScrapingManager;