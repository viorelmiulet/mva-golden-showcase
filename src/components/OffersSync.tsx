import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  success: boolean;
  total_offers: number;
  results: {
    storia: { success: boolean; offers: number; message: string };
    olx: { success: boolean; offers: number; message: string };
  };
  message: string;
}

const OffersSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log('Starting offers sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-all-offers', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setLastSync(data as SyncResult);
      
      toast({
        title: data.success ? "Sincronizare reușită!" : "Sincronizare parțială",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error syncing offers:', error);
      toast({
        title: "Eroare la sincronizare",
        description: error instanceof Error ? error.message : 'A apărut o eroare necunoscută',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Sincronizare Oferte Storia & OLX
        </CardTitle>
        <CardDescription>
          Conectat automat la Storia.ro și OLX.ro pentru actualizarea ofertelor în timp real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Storia.ro conectat
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            OLX.ro conectat
          </Badge>
        </div>

        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizare în curs...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizează ofertele acum
            </>
          )}
        </Button>

        {lastSync && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {lastSync.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
              <span className="font-medium">
                Ultima sincronizare: {lastSync.total_offers} oferte
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {lastSync.results.storia.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Storia.ro</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastSync.results.storia.offers} oferte
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSync.results.storia.message}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {lastSync.results.olx.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">OLX.ro</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastSync.results.olx.offers} oferte
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSync.results.olx.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>📡 Integrare automată cu:</p>
          <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
            <li>Storia.ro - oferte MVA Imobiliare</li>
            <li>OLX.ro - apartamente Militari & Chiajna</li>
            <li>Sincronizare inteligentă fără duplicate</li>
            <li>Actualizare prețuri și disponibilitate în timp real</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OffersSync;