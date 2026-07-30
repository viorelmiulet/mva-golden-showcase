import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import {
  ArrowLeft,
  MapPin,
  Euro,
  Ruler,
  Home,
  Share2,
  ExternalLink,
  Phone,
  Mail,
  Copy,
  CheckCircle,
  Calendar,
  Building,
  Bath,
  Car,
  Thermometer,
  Sofa,
  Layers,
  Construction,
  Square,
  Video,
  View,
  Tag,
  MapPinned,
  User,
  Briefcase,
  Hash,
  Link2,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { Helmet } from "react-helmet-async";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { usePlausible } from "@/hooks/usePlausible";
import { useInternalAnalytics } from "@/hooks/useInternalAnalytics";
import { useGA4 } from "@/hooks/useGA4";
import { generatePropertySlug, extractShortIdFromSlug, isUUID, getPropertyUrl } from "@/lib/propertySlug";
import { usePropertyViews } from "@/hooks/usePropertyViews";
import { Eye } from "lucide-react";
import PropertySeo from "@/components/PropertySeo";
import PropertyGallery from "@/components/property/PropertyGallery";
import SpecRail from "@/components/SpecRail";
import PropertyCard from "@/components/PropertyCard";
import { composePropertyDescription, composeMetaDescription } from "@/lib/propertyDescription";

const NotFoundInline = lazy(() => import("@/pages/NotFound"));

// Lazy load heavy below-fold components
const ApproximateLocationMap = lazy(() => import("@/components/ApproximateLocationMap").then(m => ({ default: m.ApproximateLocationMap })));

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price_min: number;
  price_max: number;
  currency: string;
  surface_min: number;
  surface_max: number;
  rooms: number;
  images: any;
  features: any;
  amenities: any;
  project_name: string | null;
  storia_link: string | null;
  availability_status: string;
  // Additional fields from XML import
  floor?: number | null;
  total_floors?: number | null;
  bathrooms?: number | null;
  year_built?: number | null;
  property_type?: string | null;
  building_type?: string | null;
  compartment?: string | null;
  heating?: string | null;
  parking?: number | null;
  balconies?: number | null;
  furnished?: string | null;
  external_id?: string | null;
  source_url?: string | null;
  zone?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  agent?: string | null;
  agency?: string | null;
  surface_land?: number | null;
  comfort?: string | null;
  project_id?: string | null;
  video?: string | null;
  virtual_tour?: string | null;
  contact_info?: any;
  transaction_type?: string | null;
  descriere_lunga?: string | null;
  floor_plan?: string | null;
  created_at?: string | null;
}

// Check if a string looks like GPS coordinates
const isCoordinates = (str: string): boolean => {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,?\s*-?\d+\.\d+$/.test(str.trim());
};

// Get display-friendly location (fallback to zone/city if location contains coordinates)
const getDisplayLocation = (p: Property): string => {
  if (p.zone && !isCoordinates(p.zone)) return p.zone;
  if (p.location && !isCoordinates(p.location)) return p.location;
  if (p.city && !isCoordinates(p.city)) return p.city;
  if (p.project_name) return p.project_name;
  return 'București';
};

const generateAutoDescription = (p: Property): string => {
  const parts: string[] = [];

  const tipTranzactie = p.transaction_type === 'rent' ? 'închiriere' : 'vânzare';
  const numarCamere = p.rooms || 1;
  const camereTxt = numarCamere === 1 ? 'cameră' : 'camere';
  const tipLocuinta = numarCamere === 1 ? 'garsonieră' : `apartament cu ${numarCamere} ${camereTxt}`;
  const ansamblu = p.project_name || 'zonă rezidențială';
  const zona = getDisplayLocation(p);
  const suprafata = p.surface_min || '';
  const etaj = p.floor ?? '';
  const totalEtaje = p.total_floors ?? '';
  const pret = p.price_min ? p.price_min.toLocaleString('ro-RO') : '';

  // Paragraph 1 – Introduction
  parts.push(`Prezentăm spre ${tipTranzactie} ${tipLocuinta} situat${numarCamere === 1 ? 'ă' : ''} în ${ansamblu}, zona ${zona}, Chiajna, județul Ilfov. Această proprietate reprezintă o oportunitate excelentă atât pentru locuire, cât și pentru investiție, fiind amplasată într-una dintre cele mai dinamice zone rezidențiale din vestul Bucureștiului.`);

  // Paragraph 2 – Surface & floor details
  if (suprafata) {
    let surfaceLine = `Proprietatea dispune de o suprafață utilă de ${suprafata} mp`;
    if (etaj !== '') {
      surfaceLine += `, fiind poziționată la etajul ${etaj}${totalEtaje ? ` dintr-un bloc cu ${totalEtaje} etaje` : ''}`;
    }
    surfaceLine += `. Compartimentarea${p.compartment ? ` de tip ${p.compartment}` : ' funcțională'} oferă un spațiu bine organizat, cu luminozitate naturală și ventilație optimă.`;
    parts.push(surfaceLine);
  }

  // Paragraph 3 – Features / amenities
  const dotari: string[] = [];
  if (p.bathrooms) dotari.push(`${p.bathrooms} ${p.bathrooms === 1 ? 'baie' : 'băi'}`);
  if (p.balconies) dotari.push(`${p.balconies} ${p.balconies === 1 ? 'balcon' : 'balcoane'}`);
  if (p.parking) dotari.push(`${p.parking} ${p.parking === 1 ? 'loc de parcare' : 'locuri de parcare'}`);
  if (p.heating) dotari.push(`sistem de încălzire ${p.heating}`);
  if (p.building_type) dotari.push(`structură de rezistență din ${p.building_type}`);
  if (p.comfort) dotari.push(`confort ${p.comfort}`);
  if (p.year_built) dotari.push(`an construcție ${p.year_built}`);
  if (p.amenities && Array.isArray(p.amenities) && p.amenities.length > 0) {
    dotari.push(...(p.amenities as string[]));
  }
  if (p.features && Array.isArray(p.features) && p.features.length > 0) {
    const existing = new Set(dotari.map(d => d.toLowerCase()));
    (p.features as string[]).forEach(f => {
      if (!existing.has(f.toLowerCase())) dotari.push(f);
    });
  }
  if (dotari.length > 0) {
    parts.push(`Dotările și facilitățile incluse sunt: ${dotari.join(', ')}. Toate aceste elemente contribuie la un standard ridicat de locuire și la menținerea valorii investiției pe termen lung.`);
  }

  // Paragraph 4 – Price
  if (pret) {
    const tipFinantare = p.transaction_type === 'rent' 
      ? 'Chiria lunară este' 
      : 'Prețul de vânzare este';
    parts.push(`${tipFinantare} de ${pret} euro${p.currency && p.currency !== 'EUR' ? ` (${p.currency})` : ''}. ${p.transaction_type !== 'rent' ? 'Proprietatea poate fi achiziționată cu plata integrală, prin credit ipotecar sau cu avans, existând flexibilitate în negocierea condițiilor de plată.' : 'Prețul include cheltuielile de administrare ale imobilului.'}`);
  }

  // Paragraph 5 – Complex/neighborhood
  parts.push(`Ansamblul rezidențial ${ansamblu} din zona ${zona} este unul dintre cele mai căutate proiecte imobiliare din sectorul de vest al Bucureștiului. Zona beneficiază de infrastructură modernă, acces facil la transportul în comun, proximitate față de centre comerciale, școli, grădinițe și spații verzi. De asemenea, dezvoltarea continuă a zonei Militari–Chiajna, inclusiv extinderea rețelei de metrou și a drumurilor de acces, contribuie la creșterea constantă a valorii proprietăților.`);

  // Paragraph 6 – Why choose this property
  parts.push(`Această proprietate este ideală pentru familii tinere, persoane care lucrează în zona de vest a capitalei sau pentru investitori care doresc un randament atractiv al investiției. Combinația dintre localizarea strategică, calitatea construcției și prețul competitiv face din acest ${tipLocuinta} una dintre cele mai bune opțiuni disponibile în prezent pe piața imobiliară din ${zona}.`);

  // Paragraph 7 – About MVA Imobiliare + CTA
  parts.push(`MVA Imobiliare este o agenție imobiliară specializată în tranzacții cu apartamente noi și vechi în zona Militari, Chiajna și Ilfov. Oferim consultanță completă, de la identificarea proprietății potrivite, vizionare gratuită, negociere, până la asistență la notar și predarea cheilor. Echipa noastră vă stă la dispoziție pentru orice întrebare legată de această proprietate sau de alte oportunități similare disponibile în portofoliul nostru.`);

  parts.push(`Pentru programarea unei vizionări sau informații suplimentare, nu ezitați să ne contactați la numărul de telefon 0767 941 512 sau prin WhatsApp. De asemenea, puteți vizita site-ul nostru mvaimobiliare.ro pentru a vedea toate proprietățile disponibile.`);

  return parts.join('\n\n');
};

/**
 * Generate a comprehensive SEO text block (always 300+ words) for the property page.
 * This is rendered as a visible section in the DOM to ensure crawlability.
 */
const generateSeoSection = (p: Property): string => {
  const tipTranzactie = p.transaction_type === 'rent' ? 'închiriere' : 'vânzare';
  const numarCamere = p.rooms || 1;
  const camereTxt = numarCamere === 1 ? 'cameră' : 'camere';
  const tipLocuinta = numarCamere === 1 ? 'Garsonieră' : `Apartament ${numarCamere} ${camereTxt}`;
  const ansamblu = p.project_name || 'zonă rezidențială';
  const zona = getDisplayLocation(p);
  const suprafata = p.surface_min || '-';
  const etaj = p.floor ?? '-';
  const totalEtaje = p.total_floors ?? '-';
  const pret = p.price_min ? p.price_min.toLocaleString('ro-RO') : '-';
  const an = p.year_built || '-';

  const lines: string[] = [];

  lines.push(`${tipLocuinta} de ${tipTranzactie} în ${ansamblu}, ${zona}`);
  lines.push('');
  lines.push(`Tip proprietate: ${tipLocuinta}`);
  lines.push(`Ansamblu rezidențial: ${ansamblu}`);
  lines.push(`Zonă / Cartier: ${zona}, Chiajna, Ilfov`);
  lines.push(`Suprafață utilă: ${suprafata} mp`);
  lines.push(`Număr camere: ${numarCamere}`);
  if (p.bathrooms) lines.push(`Băi: ${p.bathrooms}`);
  if (p.balconies) lines.push(`Balcoane: ${p.balconies}`);
  lines.push(`Etaj: ${etaj}${totalEtaje !== '-' ? ` / ${totalEtaje}` : ''}`);
  lines.push(`Preț: ${pret} ${p.currency || 'EUR'}`);
  lines.push(`An construcție: ${an}`);
  if (p.parking) lines.push(`Parcare: ${p.parking} ${p.parking === 1 ? 'loc' : 'locuri'}`);
  if (p.building_type) lines.push(`Tip construcție: ${p.building_type}`);
  if (p.heating) lines.push(`Încălzire: ${p.heating}`);
  lines.push('');
  lines.push(`Această proprietate este intermediată de MVA Imobiliare, agenție specializată în vânzări și închirieri imobiliare în zona Militari, Chiajna și Ilfov. Oferim consultanță gratuită, vizionări fără obligații și asistență completă pe tot parcursul tranzacției. Contactați-ne la 0767 941 512 pentru detalii sau programarea unei vizionări.`);

  return lines.join('\n');
};


const PropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [complexSlug, setComplexSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGone, setIsGone] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { trackProperty, trackContact } = usePlausible();
  const { trackEvent } = useInternalAnalytics();
  const { trackPropertyView } = useGA4();
  const propertyPath = property ? getPropertyUrl(property) : undefined;
  const { data: viewCount } = usePropertyViews(propertyPath);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    fetchProperty();
  }, [slug]);

  useEffect(() => {
    if (property) {
      fetchSimilarProperties();
      fetchComplexSlug();
      trackProperty('view', property.id, property.title);
      trackPropertyView(property.id, property.title, property.project_name || 'Unknown');
      trackEvent('property_view', {
        property_id: property.id,
        property_name: property.title,
        project: property.project_name,
      });
      addToRecentlyViewed({
        id: property.id,
        title: property.title,
        images: property.images,
        price_min: property.price_min,
        location: property.location,
        rooms: property.rooms,
        surface_min: property.surface_min,
      });
    }
  }, [property]);

  const fetchComplexSlug = async () => {
    if (!property?.project_id && !property?.project_name) return;
    try {
      let query = supabase.from("real_estate_projects").select("slug, name, id").limit(1);
      if (property.project_id) {
        query = query.eq("id", property.project_id);
      } else if (property.project_name) {
        query = query.ilike("name", property.project_name);
      }
      const { data } = await query.maybeSingle();
      if (data?.slug) {
        setComplexSlug(data.slug);
      } else if (data?.name && data?.id) {
        // fallback: build slug like complexSlug.ts
        const kebab = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const shortId = String(data.id).replace(/-/g, '').slice(0, 4);
        setComplexSlug(`${kebab}-${shortId}`);
      }
    } catch (e) {
      console.error('[fetchComplexSlug]', e);
    }
  };

  const fetchProperty = async () => {
    try {
      if (!slug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // 1. If UUID — redirect to SEO slug
      if (isUUID(slug)) {
        const { data: prop, error: uuidError } = await supabase
          .from("catalog_offers")
          .select("*")
          .eq("id", slug)
          .maybeSingle();

        if (uuidError || !prop) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const seoSlug = generatePropertySlug(prop as Property);
        window.location.replace(`/proprietati/${seoSlug}`);
        return;
      }

      // 2. First try to find by slug column in database
      const { data: slugMatch } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (slugMatch) {
        setProperty(slugMatch as Property);
        return;
      }

      // 3. Fallback: Extract short ID from slug and query matching properties via RPC
      const shortId = extractShortIdFromSlug(slug);
      const { data: candidates, error } = await supabase
        .rpc("find_properties_by_id_prefix", { prefix: shortId });

      if (error) throw error;

      // Try exact slug match first
      const exactMatch = candidates?.find(
        (p) => generatePropertySlug(p as Property) === slug
      );

      if (exactMatch) {
        setProperty(exactMatch as Property);
        return;
      }

      // If no exact match but ONE candidate with same short-id exists,
      // its slug has changed → redirect to canonical slug (fixes GSC duplicates)
      if (candidates && candidates.length === 1) {
        const canonical = candidates[0] as Property;
        const canonicalSlug = (canonical as any).slug || generatePropertySlug(canonical);
        if (canonicalSlug && canonicalSlug !== slug) {
          window.location.replace(`/proprietati/${canonicalSlug}`);
          return;
        }
        setProperty(canonical);
        return;
      }

      // No match found — return 404 (noindex) instead of cross-route redirect.
      // Bouncing /proprietati/... → /proprietate/... caused GSC "Page with redirect" errors.

      setNotFound(true);
      setIsLoading(false);
      return;
    } catch (error) {
      console.error("Error fetching property:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimilarProperties = async () => {
    if (!property) return;

    try {
      // Same zone or same complex, fallback to same room count
      const orParts: string[] = [];
      if (property.project_name) orParts.push(`project_name.eq.${property.project_name}`);
      if (property.zone && !isCoordinates(property.zone)) orParts.push(`zone.ilike.%${property.zone}%`);
      if (orParts.length === 0 && property.rooms) orParts.push(`rooms.eq.${property.rooms}`);

      let query = supabase
        .from("catalog_offers")
        .select("*")
        .neq("id", property.id)
        .is("project_id", null)
        .eq("availability_status", "available")
        .limit(3);

      if (orParts.length > 0) query = query.or(orParts.join(","));

      const { data, error } = await query;

      if (error) throw error;

      setSimilarProperties((data as Property[]) || []);
    } catch (error) {
      console.error("Error fetching similar properties:", error);
    }
  };


  const shareProperty = useCallback(async () => {
    const url = window.location.href;
    
    trackProperty('share', property?.id || '', property?.title);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || "Proprietate MVA",
          text: property?.description || "",
          url: url,
        });
      } catch (error) {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copiat în clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Nu am putut copia link-ul");
      }
    }
  }, [property?.id, property?.title, property?.description, trackProperty]);

  const contactWhatsApp = useCallback(() => {
    trackContact('whatsapp', 'property_detail', property?.id);
    
    const message = `Bună ziua! Sunt interesat de proprietatea: ${property?.title} - ${window.location.href}`;
    window.open(
      `https://wa.me/40767941512?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }, [property?.id, property?.title, trackContact]);

  const formatPrice = useCallback((min: number, max: number) => {
    if (min === max) return `€${min.toLocaleString("de-DE")}`;
    return `€${min.toLocaleString("de-DE")} - €${max.toLocaleString("de-DE")}`;
  }, []);

  const formatSurface = useCallback((min: number, max: number) => {
    if (min === max) return `${min} mp`;
    return `${min} - ${max} mp`;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink/40 to-secondary/20">
        <Header />
        <main className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            <PropertyDetailSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show 404 inline without redirect (avoids GSC "page with redirect" errors)
  if (notFound || isGone) {
    return (
      <Suspense fallback={null}>
        <NotFoundInline />
      </Suspense>
    );
  }

  if (!property) return null;

  // Helper variables
  const zona = property ? getDisplayLocation(property) : 'București';
  const isSale = property.transaction_type !== 'rent';
  const titleForSeo = property.title || `Apartament ${property.rooms || ''} camere ${zona}`;

  // Compose unique, factual description from real fields (or use stored if rich)
  const composedDescription = composePropertyDescription({
    rooms: property.rooms,
    surface: property.surface_min,
    floor: property.floor,
    totalFloors: property.total_floors,
    price: property.price_min,
    currency: property.currency,
    isSale,
    projectName: property.project_name,
    zone: property.zone || zona,
    city: property.city,
    balconies: property.balconies,
    bathrooms: property.bathrooms,
    parking: property.parking,
    yearBuilt: property.year_built,
    heating: property.heating,
    furnished: property.furnished,
    buildingType: property.building_type,
    compartment: property.compartment,
    comfort: property.comfort,
    propertyType: property.property_type,
    storedDescription: property.description,
  });
  const metaDesc = composeMetaDescription(composedDescription);

  return (
    <>
      <PropertySeo
        title={titleForSeo}
        description={composedDescription}
        metaDescription={metaDesc}
        canonicalPath={getPropertyUrl(property)}
        images={Array.isArray(property.images) ? property.images : []}
        price={property.price_min}
        currency={property.currency}
        isAvailable={property.availability_status === 'available'}
        rooms={property.rooms}
        bathrooms={property.bathrooms}
        surface={property.surface_min}
        floor={property.floor}
        yearBuilt={property.year_built}
        zone={property.zone || zona}
        city={property.city}
        street={zona}
        latitude={property.latitude}
        longitude={property.longitude}
        datePosted={property.created_at}
        isSale={isSale}
        projectName={property.project_name}
      />
      {property.images?.[0] && (
        <Helmet>
          <link rel="preload" as="image" href={property.images[0]} fetchPriority="high" />
        </Helmet>
      )}

      {(() => {
        const images: string[] = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
        const surface = property.surface_min || property.surface_max || null;
        const pricePerSqm =
          property.price_min && surface ? Math.round(property.price_min / surface) : null;
        const refCode = property.external_id || String(property.id).replace(/-/g, "").slice(0, 8).toUpperCase();
        const listedAt = property.created_at
          ? new Date(property.created_at).toLocaleDateString("ro-RO", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : null;
        const propertyUrl = `https://www.mvaimobiliare.ro${getPropertyUrl(property)}`;
        const waMessage = `Bună ziua! Sunt interesat de proprietatea: ${property.title} — ${propertyUrl}`;
        const mailSubject = `Cerere informații: ${property.title} (Ref. ${refCode})`;

        const specItems = [
          property.rooms ? `${property.rooms} CAM` : null,
          surface ? `${surface} MP` : null,
          property.floor === 0
            ? "PARTER"
            : typeof property.floor === "number"
              ? `ET ${property.floor}${property.total_floors ? `/${property.total_floors}` : ""}`
              : null,
          property.year_built ? String(property.year_built) : null,
          property.compartment ? String(property.compartment).toUpperCase() : null,
        ];

        const featureSet = new Set<string>();
        if (Array.isArray(property.features)) property.features.forEach((f: string) => f && featureSet.add(f));
        if (Array.isArray(property.amenities)) property.amenities.forEach((a: string) => a && featureSet.add(a));
        const features = Array.from(featureSet);

        const details: { label: string; value: string }[] = [];
        const push = (label: string, value: any, suffix = "") => {
          if (value === null || value === undefined || value === "") return;
          details.push({ label, value: `${value}${suffix}` });
        };
        push("Tip proprietate", property.property_type);
        push("Tranzacție", property.transaction_type === "rent" ? "Închiriere" : "Vânzare");
        push("Camere", property.rooms);
        push("Suprafață utilă", surface, " mp");
        push("Suprafață teren", property.surface_land, " mp");
        push("Băi", property.bathrooms);
        push("Balcoane", property.balconies);
        push(
          "Etaj",
          property.floor === 0
            ? "Parter"
            : typeof property.floor === "number"
              ? `${property.floor}${property.total_floors ? ` / ${property.total_floors}` : ""}`
              : null
        );
        push("Etaje bloc", typeof property.floor === "number" ? null : property.total_floors);
        push("An construcție", property.year_built);
        push("Compartimentare", property.compartment);
        push("Confort", property.comfort);
        push("Tip clădire", property.building_type);
        push("Încălzire", property.heating);
        push("Mobilat", property.furnished);
        push("Parcare", property.parking, property.parking === 1 ? " loc" : " locuri");
        push("Ansamblu", property.project_name);
        push("Zonă", zona);
        push("Referință", refCode);

        const descText =
          property.descriere_lunga ||
          (property.description && property.description.trim().split(/\s+/).length >= 150
            ? property.description
            : `${property.description ? property.description + "\n\n" : ""}${generateAutoDescription(property)}`);

        return (
          <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-16 pb-24 md:pb-16" role="main">
              <div className="container mx-auto px-4 lg:px-6 max-w-6xl">
                <div className="py-4">
                  <Breadcrumbs
                    items={[{ label: "Proprietăți", href: "/proprietati" }, { label: property.title }]}
                  />
                </div>

                {property.availability_status && property.availability_status !== "available" && (
                  <div className="mb-6 border border-stone rounded-sm p-4">
                    <p className="text-body text-foreground">
                      {property.availability_status === "sold"
                        ? "Această proprietate a fost vândută."
                        : "Această proprietate nu mai este disponibilă."}
                    </p>
                  </div>
                )}

                {/* Title block */}
                <header className="mb-6">
                  <p className="text-spec text-muted-foreground mb-2">
                    REF. {refCode}
                    {listedAt ? ` · LISTAT ${listedAt.toUpperCase()}` : ""}
                  </p>
                  <h1 className="text-display-md text-foreground">{property.title}</h1>
                </header>

                {/* Above the fold: 60/40 */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                  <div className="lg:col-span-3">
                    <PropertyGallery
                      images={images}
                      title={property.title}
                      alt={`${property.title} — ${zona}`}
                    />
                  </div>

                  <aside className="lg:col-span-2 lg:sticky lg:top-24">
                    <div className="border border-stone rounded-sm p-6">
                      <p className="font-sans font-semibold text-[2rem] leading-none tabular-nums text-foreground">
                        {property.price_min
                          ? `${property.price_min.toLocaleString("ro-RO")} €`
                          : "Preț la cerere"}
                      </p>
                      {pricePerSqm && (
                        <p className="text-small text-muted-foreground mt-2">
                          {pricePerSqm.toLocaleString("ro-RO")} € / mp
                        </p>
                      )}

                      <p className="text-body text-foreground mt-4">
                        {zona}
                        {property.project_name && (
                          <>
                            {" · "}
                            {complexSlug ? (
                              <Link to={`/complexe/${complexSlug}`} className="text-brass hover:underline">
                                {property.project_name}
                              </Link>
                            ) : (
                              <span className="text-brass">{property.project_name}</span>
                            )}
                          </>
                        )}
                      </p>

                      <div className="mt-4">
                        <SpecRail items={specItems} className="whitespace-normal" />
                      </div>

                      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-stone">
                        <img
                          src="/mva-logo-3d.png"
                          alt="Agent MVA Imobiliare"
                          width={48}
                          height={48}
                          loading="lazy"
                          className="w-12 h-12 rounded-sm object-contain bg-ink p-1"
                        />
                        <div className="min-w-0">
                          <p className="text-body text-foreground truncate">
                            {property.agent || "MVA Imobiliare"}
                          </p>
                          <p className="text-spec text-muted-foreground">AGENT MVA</p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <a
                          href="tel:+40767941512"
                          onClick={() => trackContact("phone", "property_detail", property.id)}
                          className="flex items-center justify-center gap-2 w-full h-12 bg-brass text-ink rounded-sm text-small font-medium hover:bg-brass-dark transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Sună 0767 941 512
                        </a>
                        <a
                          href={`https://wa.me/40767941512?text=${encodeURIComponent(waMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackContact("whatsapp", "property_detail", property.id)}
                          className="flex items-center justify-center gap-2 w-full h-12 border border-pine text-pine rounded-sm text-small font-medium hover:bg-pine/10 transition-colors"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                          Scrie pe WhatsApp
                        </a>
                        <a
                          href={`mailto:contact@mvaimobiliare.ro?subject=${encodeURIComponent(mailSubject)}`}
                          className="block text-center text-small text-muted-foreground hover:text-brass underline"
                        >
                          Trimite pe email
                        </a>
                      </div>
                    </div>
                  </aside>
                </div>

                {/* Below the fold */}
                <div className="max-w-[720px] mt-16 space-y-16">
                  {descText && (
                    <section aria-labelledby="descriere">
                      <h2 id="descriere" className="text-title text-foreground mb-4">
                        Descriere
                      </h2>
                      <p className="text-body text-muted-foreground leading-[1.6] whitespace-pre-line">
                        {descText}
                      </p>
                    </section>
                  )}

                  {features.length > 0 && (
                    <section aria-labelledby="caracteristici">
                      <h2 id="caracteristici" className="text-title text-foreground mb-4">
                        Caracteristici
                      </h2>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        {features.map((f, i) => (
                          <li key={`${f}-${i}`} className="text-body text-muted-foreground flex gap-2">
                            <span aria-hidden="true" className="text-brass">
                              ✓
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {details.length > 0 && (
                    <section aria-labelledby="detalii">
                      <h2 id="detalii" className="text-title text-foreground mb-4">
                        Detalii
                      </h2>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        {details.map((d) => (
                          <div
                            key={d.label}
                            className="flex items-baseline justify-between gap-4 py-2 border-b border-stone"
                          >
                            <dt className="text-spec text-muted-foreground">{d.label.toUpperCase()}</dt>
                            <dd className="text-body text-foreground text-right">{d.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}

                  <section aria-labelledby="locatie">
                    <h2 id="locatie" className="text-title text-foreground mb-4">
                      Locație
                    </h2>
                    <p className="text-body text-muted-foreground mb-4">{zona}</p>
                    {property.latitude && property.longitude && (
                      <Suspense
                        fallback={<div className="h-[320px] bg-muted animate-pulse rounded-sm" />}
                      >
                        <ApproximateLocationMap
                          latitude={property.latitude}
                          longitude={property.longitude}
                          locationLabel={zona}
                        />
                      </Suspense>
                    )}
                  </section>
                </div>

                {similarProperties.length > 0 && (
                  <section className="mt-16" aria-labelledby="similare">
                    <h2 id="similare" className="text-title text-foreground mb-6">
                      Proprietăți similare
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {similarProperties.slice(0, 3).map((prop) => (
                        <PropertyCard key={prop.id} property={prop} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </main>

            {/* Mobile fixed action bar */}
            <div
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-ink bg-background"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <a
                href="tel:+40767941512"
                onClick={() => trackContact("phone", "property_detail_mobile", property.id)}
                className="w-1/2 h-14 flex items-center justify-center gap-2 bg-brass text-ink text-small font-medium"
              >
                <Phone className="w-4 h-4" />
                Sună
              </a>
              <a
                href={`https://wa.me/40767941512?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContact("whatsapp", "property_detail_mobile", property.id)}
                className="w-1/2 h-14 flex items-center justify-center gap-2 border-l border-ink text-pine text-small font-medium"
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </a>
            </div>

            <Footer />
          </div>
        );
      })()}

    </>
  );
};

export default PropertyDetail;
