import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// Mobile app pages - lazy loaded for reduced initial bundle
const MobileAppLayout = lazy(() => import("./layouts/MobileAppLayout"));
const MobileHome = lazy(() => import("./pages/mobile/MobileHome"));
const MobileSearch = lazy(() => import("./pages/mobile/MobileSearch"));
const MobileComplexes = lazy(() => import("./pages/mobile/MobileComplexes"));
const MobileFavorites = lazy(() => import("./pages/mobile/MobileFavorites"));
const MobileAccount = lazy(() => import("./pages/mobile/MobileAccount"));
const MobilePropertyDetail = lazy(() => import("./pages/mobile/MobilePropertyDetail"));
const MobileComplexDetail = lazy(() => import("./pages/mobile/MobileComplexDetail"));

// Lazy load pages for code splitting
const WhyChooseUs = lazy(() => import("./pages/WhyChooseUs"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const PropertiesPage = lazy(() => import("./pages/admin/PropertiesPage"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const ProjectsAdminPage = lazy(() => import("./pages/admin/ProjectsAdminPage"));
const BusinessCardsPage = lazy(() => import("./pages/admin/BusinessCardsPage"));
const MarketingAIPage = lazy(() => import("./pages/admin/MarketingAIPage"));

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
const DespreNoi = lazy(() => import("./pages/DespreNoi"));
const Servicii = lazy(() => import("./pages/Servicii"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
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
const RegimHotelier = lazy(() => import("./pages/RegimHotelier"));
const MilitariResidence = lazy(() => import("./pages/MilitariResidence"));
const RenewResidence = lazy(() => import("./pages/RenewResidence"));
const EurocasaResidence = lazy(() => import("./pages/EurocasaResidence"));
const ShortTermRentalsPage = lazy(() => import("./pages/admin/ShortTermRentalsPage"));
const DownloadExtensionPage = lazy(() => import("./pages/admin/DownloadExtensionPage"));
const WatermarkPage = lazy(() => import("./pages/admin/WatermarkPage"));
const InboxPage = lazy(() => import("./pages/admin/InboxPage"));
const VoiceAgentPage = lazy(() => import("./pages/admin/VoiceAgentPage"));
const PoliticaConfidentialitate = lazy(() => import("./pages/PoliticaConfidentialitate"));
const TermeniConditii = lazy(() => import("./pages/TermeniConditii"));

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
              <Route path="/despre-noi" element={<DespreNoi />} />
              <Route path="/servicii" element={<Servicii />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/proprietati" element={<Properties />} />
              <Route path="/proprietati/:slug" element={<PropertyDetail />} />
              <Route path="/proiecte/:id" element={<ProjectDetail />} />
              <Route path="/complexe" element={<Complexe />} />
              <Route path="/complexe/:id" element={<ComplexDetailPublic />} />
              <Route path="/adauga" element={<AddProperty />} />
              <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
                <Route path="proprietati" element={<PropertiesPage />} />
                <Route path="complexe" element={<ComplexesOverview />} />
                <Route path="complexe/add" element={<AddComplex />} />
                <Route path="complexe/:id" element={<ComplexDetailAdmin />} />
                <Route path="complexe/:id/edit" element={<EditComplex />} />
                
                <Route path="vizionari" element={<ViewingAppointmentsPage />} />
                <Route path="comisioane" element={<CommissionsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="rapoarte" element={<ReportsPage />} />
                <Route path="setari" element={<SettingsPage />} />
                <Route path="carti-vizita" element={<BusinessCardsPage />} />
                <Route path="marketing-ai" element={<MarketingAIPage />} />
                <Route path="clienti" element={<ClientsAdminPage />} />
                <Route path="virtual-staging" element={<VirtualStagingPage />} />
                <Route path="contracte" element={<ContractsPage />} />
                <Route path="inventar-presetat" element={<InventoryPresetsPage />} />
                <Route path="istoric" element={<AuditLogsPage />} />
                <Route path="instaleaza" element={<InstallAppPage />} />
                <Route path="regim-hotelier" element={<ShortTermRentalsPage />} />
                <Route path="extensie-chrome" element={<DownloadExtensionPage />} />
                <Route path="watermark" element={<WatermarkPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="agent-vocal" element={<VoiceAgentPage />} />
              </Route>
              <Route path="/api-keys" element={<ApiKeysAdmin />} />
              <Route path="/carte-vizita" element={<CarteVizita />} />
              <Route path="/cariera" element={<Cariera />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/faq" element={<Navigate to="/intrebari-frecvente" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/favorite" element={<Favorites />} />
              <Route path="/calculator-credit" element={<CalculatorCredit />} />
              <Route path="/regim-hotelier" element={<RegimHotelier />} />
              <Route path="/militari-residence" element={<MilitariResidence />} />
              <Route path="/renew-residence" element={<RenewResidence />} />
              <Route path="/eurocasa-residence" element={<EurocasaResidence />} />
              <Route path="/politica-confidentialitate" element={<PoliticaConfidentialitate />} />
              <Route path="/termeni-conditii" element={<TermeniConditii />} />
              <Route path="/intrebari-frecvente" element={<FAQ />} />
              <Route path="/sign/:token" element={<SignContract />} />
              
              {/* Mobile App Routes */}
              <Route path="/app" element={<MobileAppLayout />}>
                <Route index element={<MobileHome />} />
                <Route path="cauta" element={<MobileSearch />} />
                <Route path="complexe" element={<MobileComplexes />} />
                <Route path="favorite" element={<MobileFavorites />} />
                <Route path="cont" element={<MobileAccount />} />
                <Route path="proprietate/:slug" element={<MobilePropertyDetail />} />
                <Route path="complex/:id" element={<MobileComplexDetail />} />
              </Route>
              
              {/* Legacy URL redirects (301-like) */}
              <Route path="/anunturi" element={<Navigate to="/proprietati" replace />} />
              <Route path="/oferte" element={<Navigate to="/proprietati" replace />} />
              <Route path="/apartamente" element={<Navigate to="/proprietati" replace />} />
              <Route path="/proiecte" element={<Navigate to="/complexe" replace />} />
              <Route path="/about" element={<Navigate to="/despre-noi" replace />} />
              <Route path="/services" element={<Navigate to="/servicii" replace />} />
              <Route path="/properties" element={<Navigate to="/proprietati" replace />} />
              
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
