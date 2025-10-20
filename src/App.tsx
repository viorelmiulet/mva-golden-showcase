import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import CookieConsent from "@/components/CookieConsent";

// Lazy load pages for code splitting
const WhyChooseUs = lazy(() => import("./pages/WhyChooseUs"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Projects = lazy(() => import("./pages/Projects"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const Admin = lazy(() => import("./pages/Admin"));
const CarteVizita = lazy(() => import("./pages/CarteVizita"));
const ApiKeysAdmin = lazy(() => import("./pages/ApiKeysAdmin"));
const Cariera = lazy(() => import("./pages/Cariera"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-gold">Se încarcă...</div>
          </div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/de-ce-sa-ne-alegi" element={<WhyChooseUs />} />
              <Route path="/proprietati" element={<Properties />} />
              <Route path="/proprietati/:id" element={<PropertyDetail />} />
              <Route path="/proiecte" element={<Projects />} />
              <Route path="/adauga" element={<AddProperty />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/api-keys" element={<ApiKeysAdmin />} />
              <Route path="/carte-vizita" element={<CarteVizita />} />
              <Route path="/cariera" element={<Cariera />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Index />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <CookieConsent />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
