import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useProperty, useProperties, useSubmitContact, formatPrice, getTitle, getDescription, getSurface, type ImmofluxContactData, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { MapSkeleton, FooterSkeleton, LightboxSkeleton, SectionDialogSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, BedDouble, Bath, Maximize, Building, Calendar, MapPin, AlertCircle, Zap, Sofa, PaintBucket, Wrench, Phone, Mail, User, SquareStack, Home, Thermometer, ClipboardList, ArrowUpDown, Building2 } from "lucide-react";
import Header from "@/components/Header";
import { useState, lazy, Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { extractImmofluxIdFromSlug, getImmofluxPropertyUrl } from "@/lib/propertySlug";
import { parseFloor, parseTotalFloors } from "@/lib/floorParsing";
import { filterStatItems, type StatItem } from "@/lib/statItem";

// Heavy / below-the-fold components — split into separate chunks
const Footer = lazy(() => import("@/components/Footer"));
const ApproximateLocationMap = lazy(() => import("@/components/ApproximateLocationMap").then(m => ({ default: m.ApproximateLocationMap })));
const ImageLightbox = lazy(() => import("@/components/ImageLightbox").then(m => ({ default: m.ImageLightbox })));
const SectionDialog = lazy(() => import("@/components/property/PropertySectionDialog"));

/** Montează copiii doar când wrapper-ul intră (sau e aproape de) viewport. */
const LazyMapMount = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);
  return <div ref={ref}>{visible ? children : <MapSkeleton />}</div>;
};

const ImmofluxPropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Support both old numeric IDs and new SEO slugs
  const propertyId = slug ? (extractImmofluxIdFromSlug(slug) || slug) : '';
  const { data: property, isLoading, isError } = useProperty(propertyId);
  const contactMutation = useSubmitContact();

  const [contactForm, setContactForm] = useState({ nume: '', telefon: '', email: '', mesaj: '' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openSection, setOpenSection] = useState<null | { title: string; items: string[] }>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    const payload: ImmofluxContactData = {
      ...contactForm,
      id: property.idnum,
    };
    contactMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Cererea a fost trimisă cu succes!');
        setContactForm({ nume: '', telefon: '', email: '', mesaj: '' });
      },
      onError: () => toast.error('Nu am putut trimite cererea. Încercați din nou.'),
    });
  };

  if (isLoading) return (
    <>
      <Header />
      <main className="pt-24 pb-16 container mx-auto px-4"><PropertyDetailSkeleton /></main>
      <Suspense fallback={<FooterSkeleton />}><Footer /></Suspense>
    </>
  );

  if (isError || !property) return (
    <>
      <Header />
      <main className="pt-24 pb-16 container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg">Proprietatea nu a fost găsită.</p>
        <Link to="/proprietati" className="mt-4">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la proprietăți</Button>
        </Link>
      </main>
      <Suspense fallback={<FooterSkeleton />}><Footer /></Suspense>
    </>
  );

  const p = property as any;
  const images = [...(property.images || [])].sort((a, b) => a.pozitie - b.pozitie);
  const title = getTitle(property);
  const description = getDescription(property);
  const isSale = property.devanzare === 1;
  const surface = getSurface(property);

  

  const fmtMp = (v: any) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return Number.isInteger(n) ? `${n}` : n.toFixed(2);
  };

  // Detect furnished status and normalize to: Mobilat / Parțial mobilat / Nemobilat
  const furnishedLabel = (() => {
    const codeMap: Record<string, string> = {
      '30301': 'Nemobilat',
      '30302': 'Parțial mobilat',
      '30303': 'Mobilat',
      '30304': 'Mobilat',
    };
    const normalize = (raw: string): string | null => {
      const v = raw.toLowerCase();
      if (/nemobilat/.test(v)) return 'Nemobilat';
      if (/parțial|partial/.test(v)) return 'Parțial mobilat';
      if (/mobilat/.test(v)) return 'Mobilat';
      return null;
    };
    const raw = p.mobilat_value ? String(p.mobilat_value).trim() : '';
    if (raw) {
      if (codeMap[raw]) return codeMap[raw];
      const n = normalize(raw);
      if (n) return n;
    }
    const src = (p.dotari || '').toString();
    const n = normalize(src);
    if (n) return n;
    for (const [code, label] of Object.entries(codeMap)) {
      if (src.includes(code)) return label;
    }
    return null;
  })();

  const statCards = filterStatItems<any>([
    { label: 'Camere', value: p.nrcamere, icon: Home, tone: 'text-sky-400' },
    { label: 'Dormitoare', value: p.nrdormitoare ?? p.dormitoare, icon: Home, tone: 'text-violet-400' },
    { label: 'Grup Sanitar', value: p.nrbai, icon: Building, tone: 'text-cyan-400' },
    { label: 'm² Util', value: fmtMp(surface), icon: Maximize, tone: 'text-emerald-400' },
    { label: 'Etaj', value: parseFloor(p.etaj, p.nretaj, p.floor), icon: ArrowUpDown, tone: 'text-indigo-400' },
    { label: 'Total Etaje', value: parseTotalFloors(p.nrnivele, p.nivele, p.regimsuprateran, p.total_floors), icon: Building2, tone: 'text-fuchsia-400' },
    { label: 'An Construcție', value: p.anconstructie, icon: Calendar, tone: 'text-slate-300' },
    { label: 'Mobilare', value: furnishedLabel, icon: Sofa, tone: 'text-amber-400' },
  ]);

  const addedDate = p.datapublicare || p.data_publicare || p.datacreare || p.created_at || null;
  const formattedAddedDate = (() => {
    if (!addedDate) return null;
    const d = new Date(addedDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
  })();


  const agentInfo = p.agent_info;

  // Parse text sections
  const utilitati = p.utilitati?.trim();
  const finisaje = p.finisaje?.trim();
  const dotari = p.dotari?.trim();
  const altedetaliizona = p.altedetaliizona?.trim();
  const vecinatati = typeof p.vecinatati === 'object' ? p.vecinatati?.ro?.trim() : p.vecinatati?.trim?.();
  const opinieagent = typeof p.opinieagent === 'object' ? p.opinieagent?.ro?.trim() : p.opinieagent?.trim?.();

  const canonicalPath = getImmofluxPropertyUrl(property as any);
  const canonicalSlug = canonicalPath.replace('/proprietate/', '');
  // Client-side redirect to canonical slug if URL slug is outdated (helps consolidate duplicates in GSC)
  if (typeof window !== 'undefined' && slug && canonicalSlug && slug !== canonicalSlug) {
    window.location.replace(canonicalPath);
  }
  const propertyUrl = `https://www.mvaimobiliare.ro${canonicalPath}`;
  const ogImage = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-image?type=immoflux&id=${propertyId}`;
  const ogType = isSale ? "product" : "website";
  const priceAmount = p.pret ? String(p.pret) : null;
  const currency = (isSale ? p.monedavanzare : p.monedainchiriere) || 'EUR';

  // ── Auto-generated SEO title & description from API data ──
  const rooms = p.nrcamere ? Number(p.nrcamere) : null;
  const zona = (p.zona || '').trim();
  const localitate = (p.localitate || p.oras || 'București').trim();
  const locationLabel = [zona, localitate].filter(Boolean).join(', ') || 'București';
  const propertyType = (p.tiplocuinta || 'Apartament').trim();
  const actionLabel = isSale ? 'de vânzare' : 'de închiriat';
  const priceLabel = priceAmount
    ? `${Number(priceAmount).toLocaleString('ro-RO')} ${currency}${!isSale ? '/lună' : ''}`
    : 'Preț la cerere';
  const surfaceLabel = surface ? `${fmtMp(surface)} mp` : null;
  const floorLabel = parseFloor(p.etaj, p.nretaj, p.floor);
  const yearLabel = p.anconstructie ? `construit ${p.anconstructie}` : null;
  const bathsLabel = p.nrbai ? `${p.nrbai} băi` : null;

  const autoTitle = [
    propertyType,
    rooms ? `${rooms} camere` : null,
    actionLabel,
    locationLabel,
  ].filter(Boolean).join(' ');
  const seoTitle = `${autoTitle} – ${priceLabel} | MVA Imobiliare`.slice(0, 70);

  const autoDescParts = [
    `${propertyType}${rooms ? ` cu ${rooms} camere` : ''} ${actionLabel} în ${locationLabel}`,
    surfaceLabel,
    floorLabel ? `etaj ${floorLabel}` : null,
    bathsLabel,
    yearLabel,
    furnishedLabel,
    `${priceLabel}.`,
    'Detalii, poze și programare vizionare la MVA Imobiliare.',
  ].filter(Boolean);
  const autoDesc = autoDescParts.join(', ').replace(', .', '.').replace(/, ([A-ZĂÎȘȚÂa-z])/g, (m, c, i) => i === autoDescParts[0].length ? `. ${c}` : m);
  const metaDesc = ((description && description.length > 60 ? description : autoDesc)).replace(/\s+/g, ' ').trim().substring(0, 160);
  const seoTitleFinal = seoTitle;
  const lat = p.latitudine ?? p.latitude ?? null;
  const lng = p.longitudine ?? p.longitude ?? null;

  const propertySchema: any = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": title,
    "description": metaDesc,
    "url": propertyUrl,
    "image": images.slice(0, 10).map((i: any) => i.src),
    "datePosted": addedDate || new Date().toISOString(),
    ...(p.nrcamere ? { "numberOfRooms": Number(p.nrcamere) } : {}),
    ...(p.nrbai ? { "numberOfBathroomsTotal": Number(p.nrbai) } : {}),
    ...(p.anconstructie ? { "yearBuilt": Number(p.anconstructie) } : {}),
    ...(surface ? { "floorSize": { "@type": "QuantitativeValue", "value": Number(surface), "unitCode": "MTK" } } : {}),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": p.localitate || p.oras || "București",
      ...(p.zona ? { "addressRegion": p.zona } : {}),
      ...(p.adresa ? { "streetAddress": p.adresa } : {}),
      "addressCountry": "RO",
    },
    ...(lat && lng ? { "geo": { "@type": "GeoCoordinates", "latitude": Number(lat), "longitude": Number(lng) } } : {}),
    ...(priceAmount ? {
      "offers": {
        "@type": "Offer",
        "price": Number(priceAmount),
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
        "url": propertyUrl,
        "seller": {
          "@type": "RealEstateAgent",
          "name": "MVA Imobiliare",
          "url": "https://www.mvaimobiliare.ro",
          "telephone": "+40767941512",
        },
      },
    } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Acasă", "item": "https://www.mvaimobiliare.ro/" },
      { "@type": "ListItem", "position": 2, "name": "Proprietăți", "item": "https://www.mvaimobiliare.ro/proprietati" },
      { "@type": "ListItem", "position": 3, "name": title, "item": propertyUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitleFinal}</title>
        <meta name="description" content={metaDesc} />
        <meta name="author" content="MVA Imobiliare" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="keywords" content={[propertyType, rooms ? `${rooms} camere` : null, actionLabel, zona, localitate, 'apartament', 'imobiliare', 'MVA Imobiliare'].filter(Boolean).join(', ')} />
        <link rel="canonical" href={propertyUrl} />

        {/* Open Graph */}
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content="MVA Imobiliare" />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:url" content={propertyUrl} />
        <meta property="og:title" content={seoTitleFinal} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={autoTitle} />
        {priceAmount && <meta property="product:price:amount" content={priceAmount} />}
        {priceAmount && <meta property="product:price:currency" content={currency} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MVAImobiliare" />
        <meta name="twitter:creator" content="@MVAImobiliare" />
        <meta name="twitter:title" content={seoTitleFinal} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={autoTitle} />

        <script type="application/ld+json">{JSON.stringify(propertySchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/proprietati" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" /> Înapoi la proprietăți
          </Link>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 rounded-xl overflow-hidden">
              {images.slice(0, 1).map((img, i) => (
                <img
                  key={i}
                  src={img.src}
                  alt={title}
                  className="col-span-2 row-span-2 w-full h-64 md:h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  loading="eager"
                  // @ts-ignore
                  fetchpriority="high"
                  decoding="async"
                  width={1200}
                  height={800}
                  onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                />
              ))}
              {(() => {
                const hasMore = images.length > 5;
                const thumbs = images.slice(1, hasMore ? 4 : 5);
                return (
                  <>
                    {thumbs.map((img, i) => (
                      <img
                        key={i + 1}
                        src={img.src}
                        alt={`${title} ${i + 2}`}
                        className="w-full h-32 md:h-[calc(12rem-0.25rem)] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                        decoding="async"
                        // @ts-ignore
                        fetchpriority="low"
                        width={600}
                        height={400}
                        onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}
                      />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => { setLightboxIndex(4); setLightboxOpen(true); }}
                        className="relative w-full h-32 md:h-[calc(12rem-0.25rem)] overflow-hidden group"
                      >
                        <img
                          src={images[4].src}
                          alt={`${title} 5`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          // @ts-ignore
                          fetchpriority="low"
                          width={600}
                          height={400}
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold group-hover:bg-black/70 transition-colors">
                          +{images.length - 4} imagini
                        </div>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="min-w-0 lg:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={isSale ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                  {isSale ? "De vânzare" : "De închiriat"}
                </Badge>
                {property.top === 1 && <Badge className="bg-gold text-black font-bold">TOP</Badge>}
                {p.exclusivitate === 1 && <Badge variant="outline" className="border-gold text-gold">Exclusivitate</Badge>}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
              
              <div className="flex flex-wrap items-baseline gap-4">
                <p className="text-2xl font-bold text-gold">{formatPrice(property)}</p>
                
              </div>

              {/* Detalii Anunț */}
              {statCards.length > 0 && (
                <section className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-emerald-400" />
                    Detalii Anunț
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {statCards.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={i}
                          className="rounded-xl bg-muted/40 border border-border/50 p-4 flex flex-col items-center justify-center text-center min-h-[120px]"
                        >
                          <Icon className={`h-6 w-6 mb-2 ${s.tone}`} />
                          <div className="text-2xl font-bold text-foreground leading-tight">
                            {s.value}
                          </div>
                          <div className={`text-xs mt-1 ${s.tone}`}>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  {formattedAddedDate && (
                    <div className="mt-5 pt-4 border-t border-border/50 flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Adăugat</div>
                        <div className="text-sm font-semibold text-foreground">{formattedAddedDate}</div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {(() => {
                const PREVIEW_LIMIT = 12;
                const renderCardSection = (
                  raw: string | undefined,
                  title: string,
                  Icon: any,
                ) => {
                  if (!raw) return null;
                  const items = raw.split(',').map(s => s.trim()).filter(Boolean);
                  if (items.length === 0) return null;
                  const hasMore = items.length > PREVIEW_LIMIT;
                  const visible = hasMore ? items.slice(0, PREVIEW_LIMIT) : items;
                  return (
                    <section className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                          <Icon className="h-5 w-5 text-gold" /> {title}
                        </h2>
                        {hasMore && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-sm text-gold hover:text-gold/80 shrink-0"
                            onClick={() => setOpenSection({ title, items })}
                          >
                            Vezi toate ({items.length})
                          </Button>
                        )}
                      </div>
                      <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr items-stretch">
                        {visible.map((item, i) => (
                          <div
                            key={i}
                            title={item}
                            className="h-full min-w-0 max-w-full rounded-md bg-muted/40 border border-border/50 px-3 py-2 text-xs sm:text-sm text-foreground break-words [overflow-wrap:anywhere] hyphens-auto leading-snug text-left flex items-center justify-start"
                          >
                            <span className="line-clamp-2 w-full">{item}</span>
                          </div>
                        ))}
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => setOpenSection({ title, items })}
                            className="h-full min-w-0 max-w-full rounded-md border border-dashed border-border px-3 py-2 text-xs sm:text-sm text-muted-foreground hover:text-gold hover:border-gold transition-colors text-center flex items-center justify-center"
                          >
                            +{items.length - PREVIEW_LIMIT} mai multe
                          </button>
                        )}
                      </div>
                    </section>
                  );
                };
                return (
                  <>
                    {renderCardSection(utilitati, 'Utilități', Zap)}
                    {renderCardSection(finisaje, 'Finisaje', PaintBucket)}
                    {renderCardSection(dotari, 'Dotări', Sofa)}
                    {renderCardSection(altedetaliizona, 'Detalii zonă', MapPin)}
                  </>
                );
              })()}

              {openSection && (
                <Suspense fallback={<SectionDialogSkeleton />}>
                  <SectionDialog
                    open={!!openSection}
                    onOpenChange={(o) => !o && setOpenSection(null)}
                    title={openSection?.title}
                    items={openSection?.items}
                  />
                </Suspense>
              )}

              {/* Descriere */}
              {description && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Descriere</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{description}</p>
                </div>
              )}

              {/* Vecinătăți */}
              {vecinatati && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Vecinătăți</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{vecinatati}</p>
                </div>
              )}

              {/* Opinie agent */}
              {opinieagent && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Opinia agentului</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line italic">{opinieagent}</p>
                </div>
              )}

              {/* Locație aproximativă — montată doar când intră în viewport */}
              {lat && lng && (
                <LazyMapMount>
                  <Suspense fallback={<MapSkeleton />}>
                    <ApproximateLocationMap
                      latitude={Number(lat)}
                      longitude={Number(lng)}
                      locationLabel={[p.zona, p.localitate].filter(Boolean).join(', ')}
                    />
                  </Suspense>
                </LazyMapMount>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Agent info */}
              {agentInfo && (
                <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground">Agent</h2>
                  <div className="flex items-center gap-3">
                    {agentInfo.src && (
                      <img src={agentInfo.src} alt={agentInfo.nume} className="w-12 h-12 rounded-full object-cover border-2 border-gold/30" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{agentInfo.nume}</p>
                      {agentInfo.functie?.ro && <p className="text-xs text-muted-foreground">{agentInfo.functie.ro}</p>}
                    </div>
                  </div>
                  {agentInfo.telefon && (
                    <a href={`tel:${agentInfo.telefon}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
                      <Phone className="h-4 w-4" /> {agentInfo.telefon}
                    </a>
                  )}
                  {agentInfo.email && (
                    <a href={`mailto:${agentInfo.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
                      <Mail className="h-4 w-4" /> {agentInfo.email}
                    </a>
                  )}
                </div>
              )}

              {/* Contact form */}
              <div className="sticky top-28 rounded-xl border bg-card p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Solicită informații</h2>
                <form onSubmit={handleContact} className="space-y-3">
                  <Input placeholder="Nume *" required value={contactForm.nume} onChange={e => setContactForm(f => ({ ...f, nume: e.target.value }))} />
                  <Input placeholder="Telefon *" required type="tel" value={contactForm.telefon} onChange={e => setContactForm(f => ({ ...f, telefon: e.target.value }))} />
                  <Input placeholder="Email" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
                  <Textarea placeholder="Mesaj" rows={3} value={contactForm.mesaj} onChange={e => setContactForm(f => ({ ...f, mesaj: e.target.value }))} />
                  <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black" disabled={contactMutation.isPending}>
                    {contactMutation.isPending ? 'Se trimite...' : 'Trimite cererea'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      {lightboxOpen && (
        <Suspense fallback={<LightboxSkeleton />}>
          <ImageLightbox
            images={images.map(img => img.src)}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            initialIndex={lightboxIndex}
          />
        </Suspense>
      )}
      <Suspense fallback={null}><Footer /></Suspense>
    </>
  );
};

export default ImmofluxPropertyDetail;
