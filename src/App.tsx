import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { usePreloadCriticalRoutes } from "@/hooks/usePrefetch";
import { useWebVitals } from "@/hooks/useWebVitals";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Direct imports for always-rendered components
import CookieConsent from "@/components/CookieConsent";
import WhatsAppButton from "@/components/WhatsAppButton";
import PhoneButton from "@/components/PhoneButton";
import ScrollIndicator from "@/components/ScrollIndicator";

// Lazy load all pages including Index for better initial load
const Index = lazy(() => import("./pages/Index"));

// Mobile app pages - imported directly for better performance
import MobileAppLayout from "./layouts/MobileAppLayout";
import MobileHome from "./pages/mobile/MobileHome";
import MobileSearch from "./pages/mobile/MobileSearch";
import MobileComplexes from "./pages/mobile/MobileComplexes";
import MobileFavorites from "./pages/mobile/MobileFavorites";
import MobileAccount from "./pages/mobile/MobileAccount";
import MobilePropertyDetail from "./pages/mobile/MobilePropertyDetail";
import MobileComplexDetail from "./pages/mobile/MobileComplexDetail";

// Lazy load pages for code splitting
const WhyChooseUs = lazy(() => import("./pages/WhyChooseUs"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const PropertiesAdmin = lazy(() => import("./pages/admin/PropertiesAdmin"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const ProjectsAdminPage = lazy(() => import("./pages/admin/ProjectsAdminPage"));
const XmlImportPage = lazy(() => import("./pages/admin/XmlImportPage"));
const BusinessCardsPage = lazy(() => import("./pages/admin/BusinessCardsPage"));
const FacebookPage = lazy(() => import("./pages/admin/FacebookPage"));
const UsersAdminPage = lazy(() => import("./pages/admin/UsersAdminPage"));
const ViewingAppointmentsPage = lazy(() => import("./pages/admin/ViewingAppointmentsPage"));
const CommissionsPage = lazy(() => import("./pages/admin/CommissionsPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
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
const ClientsAdminPage = lazy(() => import("./pages/admin/ClientsAdminPage"));
const VirtualStagingPage = lazy(() => import("./pages/admin/VirtualStagingPage"));
const ContractsPage = lazy(() => import("./pages/admin/ContractsPage"));
const InventoryPresetsPage = lazy(() => import("./pages/admin/InventoryPresetsPage"));
const InstallAppPage = lazy(() => import("./pages/admin/InstallAppPage"));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogsPage"));
const SignContract = lazy(() => import("./pages/SignContract"));

const queryClient = new QueryClient();

const App = () => {
  // Preload critical routes after initial render
  usePreloadCriticalRoutes();
  
  // Report Core Web Vitals to analytics
  useWebVitals();

  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
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
                <Route index element={<DashboardPage />} />
                <Route path="proprietati" element={<PropertiesAdmin />} />
                <Route path="complexe" element={<ComplexesOverview />} />
                <Route path="complexe/add" element={<AddComplex />} />
                <Route path="complexe/:id" element={<ComplexDetailAdmin />} />
                <Route path="complexe/:id/edit" element={<EditComplex />} />
                <Route path="import" element={<XmlImportPage />} />
                <Route path="utilizatori" element={<UsersAdminPage />} />
                <Route path="vizionari" element={<ViewingAppointmentsPage />} />
                <Route path="comisioane" element={<CommissionsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="rapoarte" element={<ReportsPage />} />
                <Route path="setari" element={<SettingsPage />} />
                <Route path="carti-vizita" element={<BusinessCardsPage />} />
                <Route path="facebook" element={<FacebookPage />} />
                <Route path="clienti" element={<ClientsAdminPage />} />
                <Route path="virtual-staging" element={<VirtualStagingPage />} />
                <Route path="contracte" element={<ContractsPage />} />
                <Route path="inventar-presetat" element={<InventoryPresetsPage />} />
                <Route path="istoric" element={<AuditLogsPage />} />
                <Route path="instaleaza" element={<InstallAppPage />} />
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
              <Route path="/sign/:token" element={<SignContract />} />
              
              {/* Mobile App Routes */}
              <Route path="/app" element={<MobileAppLayout />}>
                <Route index element={<MobileHome />} />
                <Route path="cauta" element={<MobileSearch />} />
                <Route path="complexe" element={<MobileComplexes />} />
                <Route path="favorite" element={<MobileFavorites />} />
                <Route path="cont" element={<MobileAccount />} />
                <Route path="proprietate/:id" element={<MobilePropertyDetail />} />
                <Route path="complex/:id" element={<MobileComplexDetail />} />
              </Route>
              
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
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
