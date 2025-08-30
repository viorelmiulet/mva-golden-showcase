import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OffersSync from '@/components/OffersSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, Globe, BarChart } from 'lucide-react';

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Panou de Administrare
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gestionați integrările și sincronizați ofertele de pe platformele externe
            </p>
          </div>

          <Tabs defaultValue="integrations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Integrări
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Baza de Date
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                Analiză
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Setări
              </TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="space-y-6">
              <OffersSync />
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Storia.ro Integration</CardTitle>
                    <CardDescription>
                      Conectare automată cu contul MVA Imobiliare de pe Storia.ro
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        <span className="text-sm text-green-600 font-medium">Conectat</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">URL Monitorizat</span>
                        <span className="text-sm text-muted-foreground">storia.ro/mva-imobiliare</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ultimul Update</span>
                        <span className="text-sm text-muted-foreground">Automat</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>OLX.ro Integration</CardTitle>
                    <CardDescription>
                      Monitorizare oferte apartamente în zonele Militari și Chiajna
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        <span className="text-sm text-green-600 font-medium">Conectat</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Zone Monitorizate</span>
                        <span className="text-sm text-muted-foreground">Militari, Chiajna</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Filtru Preț</span>
                        <span className="text-sm text-muted-foreground">€20k - €150k</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistici Bază de Date</CardTitle>
                  <CardDescription>
                    Informații despre ofertele stocate în sistemul local
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-primary">--</div>
                      <div className="text-sm text-muted-foreground">Total Oferte</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-green-600">--</div>
                      <div className="text-sm text-muted-foreground">Storia</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-blue-600">--</div>
                      <div className="text-sm text-muted-foreground">OLX</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-orange-600">--</div>
                      <div className="text-sm text-muted-foreground">Proprii</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analiză Performanță</CardTitle>
                  <CardDescription>
                    Statistici despre sincronizarea și actualizarea ofertelor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Funcționalitatea de analiză va fi disponibilă în curând</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurări Sistem</CardTitle>
                  <CardDescription>
                    Setări pentru integrările externe și API-uri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Firecrawl API</div>
                        <div className="text-sm text-muted-foreground">API pentru extragerea datelor web</div>
                      </div>
                      <div className="text-sm text-green-600 font-medium">Configurat</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Supabase Database</div>
                        <div className="text-sm text-muted-foreground">Baza de date pentru stocarea ofertelor</div>
                      </div>
                      <div className="text-sm text-green-600 font-medium">Conectat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;