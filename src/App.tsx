import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect, useState } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppErrorBoundary from "@/components/AppErrorBoundary";
const NotFound = lazy(() => import("./pages/NotFound"));
const NavigateToComplex = lazy(() => import("@/components/NavigateToComplex"));
import TrailingSlashRedirect from "@/components/TrailingSlashRedirect";
import { seoLandingPresets } from "@/lib/seoLandingPresets";
const SeoLanding = lazy(() => import("./pages/SeoLanding"));

// Eager-load main entry points (homepage + property detail) — main ad/share landing pages
import Index from "./pages/Index";
import ImmofluxPropertyDetail from "./pages/ImmofluxPropertyDetail";

// Mobile app pages - lazy loaded for reduced initial bundle
const MobileAppLayout = lazy(() => import("./layouts/MobileAppLayout"));
const MobileHome = lazy(() => import("./pages/mobile/MobileHome"));
const MobileSearch = lazy(() => import("./pages/mobile/MobileSearch"));
const MobileComplexes = lazy(() => import("./pages/mobile/MobileComplexes"));

const MobileAccount = lazy(() => import("./pages/mobile/MobileAccount"));
const MobilePropertyDetail = lazy(() => import("./pages/mobile/MobilePropertyDetail"));
const MobileComplexDetail = lazy(() => import("./pages/mobile/MobileComplexDetail"));

// Lazy load pages for code splitting
const WhyChooseUs = lazy(() => import("./pages/WhyChooseUs"));
const Properties = lazy(() => import("./pages/Properties"));
import PropertyDetail from "./pages/PropertyDetail";
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
const PropertyViewsPage = lazy(() => import("./pages/admin/PropertyViewsPage"));
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
const CalculatorCredit = lazy(() => import("./pages/CalculatorCredit"));
const ClientsAdminPage = lazy(() => import("./pages/admin/ClientsAdminPage"));
const VirtualStagingPage = lazy(() => import("./pages/admin/VirtualStagingPage"));
const ContractsPage = lazy(() => import("./pages/admin/ContractsPage"));
const InventoryPresetsPage = lazy(() => import("./pages/admin/InventoryPresetsPage"));
const InstallAppPage = lazy(() => import("./pages/admin/InstallAppPage"));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogsPage"));
const SignContract = lazy(() => import("./pages/SignContract"));
const MilitariResidence = lazy(() => import("./pages/MilitariResidence"));
const GhidMilitariResidence = lazy(() => import("./pages/GhidMilitariResidence"));
const FacilitatiMilitariResidence = lazy(() => import("./pages/FacilitatiMilitariResidence"));
const MilitariVsChiajna = lazy(() => import("./pages/MilitariVsChiajna"));
const ViataInMilitariResidence = lazy(() => import("./pages/ViataInMilitariResidence"));
const PareriMilitariResidence = lazy(() => import("./pages/PareriMilitariResidence"));
const ComparatieComplexuriMilitariChiajna = lazy(() => import("./pages/ComparatieComplexuriMilitariChiajna"));
const CosturiTranzactieImobiliara = lazy(() => import("./pages/CosturiTranzactieImobiliara"));
const GhidNouaCasa2024 = lazy(() => import("./pages/GhidNouaCasa2024"));
const TopAnsambluriRezidentialeSector6 = lazy(() => import("./pages/TopAnsambluriRezidentialeSector6"));
const GarsoniereMilitariResidence = lazy(() => import("./pages/GarsoniereMilitariResidence"));
const RenewResidence = lazy(() => import("./pages/RenewResidence"));
const EurocasaResidence = lazy(() => import("./pages/EurocasaResidence"));
const ImmofluxProperties = lazy(() => import("./pages/ImmofluxProperties"));

const OfertaRedirect = lazy(() => import("./components/OfertaRedirect"));

const WatermarkPage = lazy(() => import("./pages/admin/WatermarkPage"));
const BlogAdminPage = lazy(() => import("./pages/admin/BlogAdminPage"));
const NewsAdminPage = lazy(() => import("./pages/admin/NewsAdminPage"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const InboxPage = lazy(() => import("./pages/admin/InboxPage"));
const VoiceAgentPage = lazy(() => import("./pages/admin/VoiceAgentPage"));
const ImmofluxDashboard = lazy(() => import("./pages/admin/ImmofluxDashboard"));
const FacebookQueuePage = lazy(() => import("./pages/admin/FacebookQueuePage"));
const FacebookGroupsPage = lazy(() => import("./pages/admin/FacebookGroupsPage"));
const RentalLayout = lazy(() => import("./pages/admin/rental/RentalLayout"));
const RentalDashboard = lazy(() => import("./pages/admin/rental/RentalDashboard"));
const RentalProperties = lazy(() => import("./pages/admin/rental/RentalProperties"));
const RentalTenants = lazy(() => import("./pages/admin/rental/RentalTenants"));
const RentalCalendar = lazy(() => import("./pages/admin/rental/RentalCalendar"));
const RentalPlaceholder = lazy(() => import("./pages/admin/rental/RentalPlaceholder"));
const PoliticaConfidentialitate = lazy(() => import("./pages/PoliticaConfidentialitate"));
const ExtensionPrivacyPolicy = lazy(() => import("./pages/ExtensionPrivacyPolicy"));
const TermeniConditii = lazy(() => import("./pages/TermeniConditii"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const PoliticiEditoriale = lazy(() => import("./pages/PoliticiEditoriale"));
const CookieConsent = lazy(() => import("@/components/CookieConsent"));
const ScrollIndicator = lazy(() => import("@/components/ScrollIndicator"));
const DeferredAnalytics = lazy(() => import("@/components/DeferredAnalytics"));
const DeferredShell = lazy(() => import("@/components/DeferredShell"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — avoid refetching on every mount
      gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Inner component that has access to Router context
const AppRoutes = () => {
  const [showDeferredUi, setShowDeferredUi] = useState(false);
  const [showDeferredAnalytics, setShowDeferredAnalytics] = useState(false);

  useEffect(() => {
    const enableDeferredUi = () => setShowDeferredUi(true);
    const enableDeferredAnalytics = () => setShowDeferredAnalytics(true);
    let analyticsTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let analyticsIdleId: number | null = null;

    const scheduleDeferredAnalytics = () => {
      if ('requestIdleCallback' in window) {
        analyticsIdleId = window.requestIdleCallback(enableDeferredAnalytics, { timeout: 2500 });
        return;
      }

      analyticsTimeoutId = globalThis.setTimeout(enableDeferredAnalytics, 1500);
    };

    const clearDeferredAnalytics = () => {
      if (analyticsIdleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(analyticsIdleId);
      }

      if (analyticsTimeoutId !== null) {
        window.clearTimeout(analyticsTimeoutId);
      }
    };

    if (document.readyState === 'complete') {
      const idleId = globalThis.setTimeout(enableDeferredUi, 0);
      scheduleDeferredAnalytics();

      return () => {
        window.clearTimeout(idleId);
        clearDeferredAnalytics();
      };
    }

    window.addEventListener('load', enableDeferredUi, { once: true });
    const loadHandler = () => {
      scheduleDeferredAnalytics();
    };

    window.addEventListener('load', loadHandler, { once: true });
    return () => {
      window.removeEventListener('load', enableDeferredUi);
      window.removeEventListener('load', loadHandler);
    };
  }, []);

  return (
    <>
      <TrailingSlashRedirect />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-10 w-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" aria-label="Se încarcă" />
        </div>
      }>

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
              <Route path="/complexe/:slug" element={<ComplexDetailPublic />} />
              <Route path="/ansambluri-rezidentiale/:slug" element={<NavigateToComplex />} />
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
                <Route path="vizualizari-proprietati" element={<PropertyViewsPage />} />
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
                <Route path="watermark" element={<WatermarkPage />} />
                <Route path="blog" element={<BlogAdminPage />} />
                <Route path="news" element={<NewsAdminPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="agent-vocal" element={<VoiceAgentPage />} />
                <Route path="immoflux" element={<ImmofluxDashboard />} />
                <Route path="facebook-queue" element={<FacebookQueuePage />} />
                <Route path="facebook-groups" element={<FacebookGroupsPage />} />
                <Route path="gestiune-chirii" element={<RentalLayout />}>
                  <Route index element={<RentalDashboard />} />
                  <Route path="proprietati" element={<RentalProperties />} />
                  <Route path="proprietati/adauga" element={<RentalProperties />} />
                  <Route path="proprietari" element={<RentalPlaceholder title="Proprietari" description="Gestionează proprietarii imobilelor din portofoliu." />} />
                  <Route path="chiriasi" element={<RentalTenants />} />
                  <Route path="utilitati" element={<RentalPlaceholder title="Utilități" description="Monitorizează și gestionează plățile la utilități." />} />
                  <Route path="calendar" element={<RentalCalendar />} />
                  <Route path="raport" element={<RentalPlaceholder title="Rapoarte" description="Generează rapoarte de venituri, cheltuieli și ocupare." />} />
                  <Route path="inventar" element={<RentalPlaceholder title="Inventar" description="Gestionează inventarul imobilelor închiriate." />} />
                  <Route path="servicii" element={<RentalPlaceholder title="Servicii" description="Administrează serviciile asociate proprietăților." />} />
                  <Route path="tichete" element={<RentalPlaceholder title="Tichete" description="Urmărește și rezolvă problemele raportate de chiriași." />} />
                </Route>
              </Route>
              <Route path="/api-keys" element={<ApiKeysAdmin />} />
              <Route path="/carte-vizita" element={<CarteVizita />} />
              <Route path="/cariera" element={<Cariera />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsDetail />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/intrebari-frecvente" element={<Navigate to="/faq" replace />} />
              <Route path="/calculator-credit" element={<CalculatorCredit />} />
              
              <Route path="/militari-residence" element={<MilitariResidence />} />
              <Route path="/ghid-militari-residence" element={<GhidMilitariResidence />} />
              <Route path="/facilitati-militari-residence" element={<FacilitatiMilitariResidence />} />
              <Route path="/militari-vs-chiajna-comparatie" element={<MilitariVsChiajna />} />
              <Route path="/viata-in-militari-residence" element={<ViataInMilitariResidence />} />
              <Route path="/pareri-militari-residence" element={<PareriMilitariResidence />} />
              <Route path="/comparatie-complexuri-militari-chiajna" element={<ComparatieComplexuriMilitariChiajna />} />
              <Route path="/costuri-tranzactie-imobiliara" element={<CosturiTranzactieImobiliara />} />
              <Route path="/ghid-noua-casa-2024" element={<GhidNouaCasa2024 />} />
              <Route path="/top-ansambluri-rezidentiale-sector-6" element={<TopAnsambluriRezidentialeSector6 />} />
              <Route path="/garsoniere-militari-residence" element={<GarsoniereMilitariResidence />} />
              <Route path="/renew-residence" element={<RenewResidence />} />
              <Route path="/eurocasa-residence" element={<EurocasaResidence />} />
              <Route path="/proprietate/:slug" element={<ImmofluxPropertyDetail />} />
              <Route path="/oferta-:id" element={<OfertaRedirect />} />
              <Route path="/politica-confidentialitate" element={<PoliticaConfidentialitate />} />
              <Route path="/extensie-chrome-privacy" element={<ExtensionPrivacyPolicy />} />
              <Route path="/termeni-conditii" element={<TermeniConditii />} />
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/politici-editoriale" element={<PoliticiEditoriale />} />
              {seoLandingPresets.map((preset) => (
                <Route
                  key={preset.slug}
                  path={`/${preset.slug}`}
                  element={<SeoLanding preset={preset} />}
                />
              ))}
              <Route path="/sign/:token" element={<SignContract />} />
              <Route path="/404" element={<NotFound />} />
              
              {/* Mobile App Routes */}
              <Route path="/app" element={<MobileAppLayout />}>
                <Route index element={<MobileHome />} />
                <Route path="cauta" element={<MobileSearch />} />
                <Route path="complexe" element={<MobileComplexes />} />
                
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
              <Route path="*" element={<NotFound />} />
            </Routes>
      </Suspense>
      {showDeferredUi && (
        <AppErrorBoundary>
          <Suspense fallback={null}>
            <DeferredShell />
            <CookieConsent />
            <ScrollIndicator />
          </Suspense>
        </AppErrorBoundary>
      )}
      {showDeferredAnalytics && (
        <AppErrorBoundary>
          <Suspense fallback={null}>
            <DeferredAnalytics />
          </Suspense>
        </AppErrorBoundary>
      )}
    </>
  );
};

const App = () => {
  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
