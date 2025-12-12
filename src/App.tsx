import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import CookieConsent from "@/components/CookieConsent";
import WhatsAppButton from "@/components/WhatsAppButton";
import PhoneButton from "@/components/PhoneButton";
import ScrollIndicator from "@/components/ScrollIndicator";

// Lazy load pages for code splitting
const WhyChooseUs = lazy(() => import("./pages/WhyChooseUs"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const PropertiesAdmin = lazy(() => import("./pages/admin/PropertiesAdmin"));
const ProjectsAdminPage = lazy(() => import("./pages/admin/ProjectsAdminPage"));
const XmlImportPage = lazy(() => import("./pages/admin/XmlImportPage"));
const BusinessCardsPage = lazy(() => import("./pages/admin/BusinessCardsPage"));
const FacebookPage = lazy(() => import("./pages/admin/FacebookPage"));
const UsersAdminPage = lazy(() => import("./pages/admin/UsersAdminPage"));
const ViewingAppointmentsPage = lazy(() => import("./pages/admin/ViewingAppointmentsPage"));
const CommissionsPage = lazy(() => import("./pages/admin/CommissionsPage"));
const ComplexesOverview = lazy(() => import("./pages/admin/ComplexesOverview"));
const ComplexDetailAdmin = lazy(() => import("./pages/admin/ComplexDetail"));
const AddComplex = lazy(() => import("./pages/admin/AddComplex"));
const EditComplex = lazy(() => import("./pages/admin/EditComplex"));
const Complexe = lazy(() => import("./pages/Complexe"));
const ComplexDetailPublic = lazy(() => import("./pages/ComplexDetail"));
const CarteVizita = lazy(() => import("./pages/CarteVizita"));
const ApiKeysAdmin = lazy(() => import("./pages/ApiKeysAdmin"));
const Cariera = lazy(() => import("./pages/Cariera"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Auth = lazy(() => import("./pages/Auth"));
const Favorites = lazy(() => import("./pages/Favorites"));
const CalculatorCredit = lazy(() => import("./pages/CalculatorCredit"));
const Install = lazy(() => import("./pages/Install"));

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
              <Route path="/proiecte/:id" element={<ProjectDetail />} />
              <Route path="/complexe" element={<Complexe />} />
              <Route path="/complexe/:id" element={<ComplexDetailPublic />} />
              <Route path="/adauga" element={<AddProperty />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<PropertiesAdmin />} />
                <Route path="complexe" element={<ComplexesOverview />} />
                <Route path="complexe/add" element={<AddComplex />} />
                <Route path="complexe/:id" element={<ComplexDetailAdmin />} />
                <Route path="complexe/:id/edit" element={<EditComplex />} />
                <Route path="import" element={<XmlImportPage />} />
                <Route path="utilizatori" element={<UsersAdminPage />} />
                <Route path="vizionari" element={<ViewingAppointmentsPage />} />
                <Route path="comisioane" element={<CommissionsPage />} />
                <Route path="carti-vizita" element={<BusinessCardsPage />} />
                <Route path="facebook" element={<FacebookPage />} />
              </Route>
              <Route path="/api-keys" element={<ApiKeysAdmin />} />
              <Route path="/carte-vizita" element={<CarteVizita />} />
              <Route path="/cariera" element={<Cariera />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/favorite" element={<Favorites />} />
              <Route path="/calculator-credit" element={<CalculatorCredit />} />
              <Route path="/instaleaza" element={<Install />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Index />} />
            </Routes>
          </Suspense>
          <WhatsAppButton />
          <PhoneButton />
          <CookieConsent />
          <ScrollIndicator />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
