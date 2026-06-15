import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailSkeleton, MapSkeleton, FooterSkeleton, LightboxSkeleton, SectionDialogSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Maximize, Building, Calendar, MapPin, AlertCircle, Zap, Sofa, PaintBucket, Phone, Mail, Home, ClipboardList, ArrowUpDown, Building2 } from "lucide-react";
import Header from "@/components/Header";
import { useState, lazy, Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { extractImmofluxIdFromSlug } from "@/lib/propertySlug";
import { parseFloor, parseTotalFloors } from "@/lib/floorParsing";
import { filterStatItems } from "@/lib/statItem";
import PropertySeo from "@/components/PropertySeo";
import { composePropertyDescription, composeMetaDescription } from "@/lib/propertyDescription";

const Footer = lazy(() => import("@/components/Footer"));
const ApproximateLocationMap = lazy(() => import("@/components/ApproximateLocationMap").then(m => ({ default: m.ApproximateLocationMap })));
const ImageLightbox = lazy(() => import("@/components/ImageLightbox").then(m => ({ default: m.ImageLightbox })));
const SectionDialog = lazy(() => import("@/components/property/PropertySectionDialog"));

const LazyMapMount = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect(); } },
      { rootMargin: '300px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);
  return <div ref={ref}>{visible ? children : <MapSkeleton />}</div>;
};

// Fetch the Immoflux property directly from catalog_offers (PostgREST, fast).
// Lookup order: immoflux_slug → external_id (from numeric trailing id) → slug (legacy).
async function fetchImmofluxFromCatalog(urlSlug: string): Promise<any | null> {
  if (!urlSlug) return null;
  // 1. by stored immoflux_slug
  {
    const { data } = await supabase
      .from('catalog_offers')
      .select('*')
      .eq('immoflux_slug', urlSlug)
      .maybeSingle();
    if (data) return data;
  }
  // 2. by external_id parsed from trailing numeric id in the slug
  const trailingId = extractImmofluxIdFromSlug(urlSlug);
  if (trailingId) {
    const { data } = await supabase
      .from('catalog_offers')
      .select('*')
      .eq('external_id', `immoflux-${trailingId}`)
      .maybeSingle();
    if (data) return data;
  }
  // 3. legacy slug column
  {
    const { data } = await supabase
      .from('catalog_offers')
      .select('*')
      .eq('slug', urlSlug)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

// Map a catalog_offers row → the shape the render code below expects (Immoflux-flavored).
function rowToProperty(row: any) {
  if (!row) return null;
  const idnum = Number((row.external_id || '').replace(/^immoflux-/, '')) || 0;
  const imagesArr = Array.isArray(row.images) ? row.images : [];
  const images = imagesArr.map((src: string, i: number) => ({ src, pozitie: i, tip: 'image' }));
  const isSale = row.transaction_type === 'sale';
  const contact = row.contact_info || {};
  const extra = row.extra_sections || {};
  return {
    idnum,
    idstr: row.external_id || String(idnum),
    titlu: { ro: row.title || '' },
    descriere: { ro: row.description || row.descriere_lunga || '' },
    pretvanzare: isSale ? (row.price_min || 0) : 0,
    pretinchiriere: !isSale ? (row.price_min || 0) : 0,
    monedavanzare: row.currency || 'EUR',
    monedainchiriere: row.currency || 'EUR',
    devanzare: isSale ? 1 : 0,
    nrcamere: row.rooms || null,
    nrbai: row.bathrooms || null,
    nrbalcoane: row.balconies || null,
    anconstructie: row.year_built || null,
    suprafatautila: row.surface_min || null,
    etaj: row.floor_label || (row.floor !== null && row.floor !== undefined ? String(row.floor) : ''),
    floor: row.floor,
    nrnivele: row.total_floors,
    total_floors: row.total_floors,
    zona: row.zone || null,
    localitate: row.city || null,
    adresa: row.location || null,
    latitudine: row.latitude,
    longitudine: row.longitude,
    images,
    top: row.is_featured ? 1 : 0,
    exclusivitate: row.exclusivity ? 1 : 0,
    publicare: row.is_published ? 1 : 0,
    tiplocuinta: row.property_type || 'apartament',
    mobilat_value: row.furnished || null,
    utilitati: extra.utilitati || null,
    finisaje: extra.finisaje || null,
    dotari: extra.dotari || null,
    altedetaliizona: extra.altedetaliizona || null,
    vecinatati: extra.vecinatati || null,
    opinieagent: extra.opinieagent || null,
    agent_info: contact?.name ? {
      nume: contact.name,
      email: contact.email || null,
      telefon: contact.phone || null,
      functie: undefined,
    } : null,
    proiect: row.project_name || null,
    complex: row.project_name || null,
    datapublicare: row.date_added || row.created_at || null,
    datacreare: row.created_at || null,
    pret: row.price_min || 0,
    immoflux_slug: row.immoflux_slug || null,
    _row: row,
  };
}

function formatPrice(p: any) {
  if (!p) return '';
  if (p.devanzare === 1 && p.pretvanzare) return `${Number(p.pretvanzare).toLocaleString('ro-RO')} ${p.monedavanzare || 'EUR'}`;
  if (p.pretinchiriere) return `${Number(p.pretinchiriere).toLocaleString('ro-RO')} ${p.monedainchiriere || 'EUR'}/lună`;
  if (p.pretvanzare) return `${Number(p.pretvanzare).toLocaleString('ro-RO')} ${p.monedavanzare || 'EUR'}`;
  return 'Preț la cerere';
}
function getTitle(p: any) { return p?.titlu?.ro || `Proprietate #${p?.idnum || ''}`; }
function getDescription(p: any) { return p?.descriere?.ro || ''; }
function getSurface(p: any) { const v = p?.suprafatautila; return typeof v === 'number' ? v : parseFloat(String(v || '0')) || 0; }
function getImmofluxItemUrl(row: any) {
  const stored = row?.immoflux_slug;
  if (stored) return `/proprietate/${stored}`;
  if (row?.slug) return `/proprietati/${row.slug}`;
  return `/proprietati`;
}

const ImmofluxPropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const urlSlug = slug || '';

  const { data: row, isLoading, isError } = useQuery({
    queryKey: ['catalog-immoflux', urlSlug],
    queryFn: () => fetchImmofluxFromCatalog(urlSlug),
    enabled: !!urlSlug,
    staleTime: 5 * 60 * 1000,
  });
  const property = row ? rowToProperty(row) : null;

  // Similar properties from same catalog (fast)
  const { data: similarPool } = useQuery({
    queryKey: ['catalog-immoflux-similar', row?.transaction_type || 'sale', row?.id || ''],
    queryFn: async () => {
      const { data } = await supabase
        .from('catalog_offers')
        .select('id, external_id, immoflux_slug, slug, title, images, price_min, currency, transaction_type, zone, city, rooms')
        .eq('crm_source', 'immoflux')
        .eq('is_published', true)
        .neq('availability_status', 'sold')
        .neq('id', row?.id || '00000000-0000-0000-0000-000000000000')
        .limit(12);
      return data || [];
    },
    enabled: !!row?.id,
    staleTime: 5 * 60 * 1000,
  });

  const [contactForm, setContactForm] = useState({ nume: '', telefon: '', email: '', mesaj: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openSection, setOpenSection] = useState<null | { title: string; items: string[] }>(null);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSubmitting(true);
    try {
      const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/immoflux-proxy`;
      const res = await fetch(`${PROXY_BASE}/contact`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ ...contactForm, id: property.idnum }),
      });
      if (!res.ok) throw new Error('contact failed');
      toast.success('Cererea a fost trimisă cu succes!');
      setContactForm({ nume: '', telefon: '', email: '', mesaj: '' });
    } catch {
      toast.error('Nu am putut trimite cererea. Încercați din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Slug-derived SEO seed (used while loading) ──
  const slugCanonicalPath = `/proprietate/${urlSlug}`;
  const slugCanonicalUrl = `https://www.mvaimobiliare.ro${slugCanonicalPath}`;
  const slugSeed = (() => {
    if (!urlSlug) return { rooms: null as number | null, surface: null as number | null, floor: null as number | null, h1: 'Proprietate', desc: '' };
    const garsoniera = /(^|-)garsoniera(-|$)/.test(urlSlug);
    const roomsM = urlSlug.match(/apartament-(\d+)-camere/);
    const surfaceM = urlSlug.match(/(\d+)mp/);
    const floorM = urlSlug.match(/etaj-(\d+)/);
    const parter = /(^|-)parter(-|$)/.test(urlSlug);
    const rooms = garsoniera ? 1 : (roomsM ? Number(roomsM[1]) : null);
    const surface = surfaceM ? Number(surfaceM[1]) : null;
    const floor = floorM ? Number(floorM[1]) : (parter ? 0 : null);
    const head = rooms === 1 ? 'Garsonieră' : rooms ? `Apartament ${rooms} camere` : 'Proprietate';
    const bits: string[] = [];
    if (surface) bits.push(`${surface} mp`);
    if (floor !== null) bits.push(floor === 0 ? 'parter' : `etaj ${floor}`);
    const h1 = bits.length ? `${head}, ${bits.join(', ')}` : head;
    const desc = `${h1} de vânzare prin MVA Imobiliare. Detalii complete, fotografii și programare vizionare.`;
    return { rooms, surface, floor, h1, desc };
  })();

  // NOTE: Do NOT mount PropertySeo / real-looking head meta during loading.
  // The prerenderer (Hado) treats a ready-looking <head> + skeleton <body> as
  // "page ready" and snapshots an empty body → soft 404. Mirror catalog
  // PropertyDetail.tsx: loading branch = skeleton only, no SEO meta. Head + body
  // land together in the success branch.
  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <main className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-6xl">
          <PropertyDetailSkeleton />
        </div>
      </main>
      <Suspense fallback={<FooterSkeleton />}><Footer /></Suspense>
    </div>
  );

  if (isError || !property || !row) return <ImmofluxNotFound />;

  const p = property as any;
  const images = property.images || [];
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

  const furnishedLabel = (() => {
    const raw = (p.mobilat_value || p.dotari || '').toString().toLowerCase();
    if (/nemobilat/.test(raw)) return 'Nemobilat';
    if (/parțial|partial/.test(raw)) return 'Parțial mobilat';
    if (/mobilat/.test(raw)) return 'Mobilat';
    return null;
  })();

  const statCards = filterStatItems<any>([
    { label: 'Camere', value: p.nrcamere, icon: Home, tone: 'text-sky-400' },
    { label: 'Grup Sanitar', value: p.nrbai, icon: Building, tone: 'text-cyan-400' },
    { label: 'm² Util', value: fmtMp(surface), icon: Maximize, tone: 'text-emerald-400' },
    { label: 'Etaj', value: parseFloor(p.etaj, p.nretaj, p.floor), icon: ArrowUpDown, tone: 'text-indigo-400' },
    { label: 'Total Etaje', value: parseTotalFloors(p.nrnivele, p.nivele, p.regimsuprateran, p.total_floors), icon: Building2, tone: 'text-fuchsia-400' },
    { label: 'An Construcție', value: p.anconstructie, icon: Calendar, tone: 'text-slate-300' },
    { label: 'Mobilare', value: furnishedLabel, icon: Sofa, tone: 'text-amber-400' },
  ]);

  const addedDate = p.datapublicare || p.datacreare;
  const formattedAddedDate = (() => {
    if (!addedDate) return null;
    const d = new Date(addedDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
  })();

  const agentInfo = p.agent_info;
  const utilitati = p.utilitati?.trim?.();
  const finisaje = p.finisaje?.trim?.();
  const dotari = p.dotari?.trim?.();
  const altedetaliizona = p.altedetaliizona?.trim?.();
  const vecinatati = p.vecinatati?.trim?.();
  const opinieagent = p.opinieagent?.trim?.();

  // Canonical = stored immoflux_slug when present, else URL slug.
  const canonicalSlug = p.immoflux_slug || urlSlug;
  const canonicalPath = `/proprietate/${canonicalSlug}`;
  const propertyUrl = `https://www.mvaimobiliare.ro${canonicalPath}`;
  const ogImage = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-image?type=immoflux&id=${p.idnum}`;
  const priceAmount = p.pret ? String(p.pret) : null;
  const currency = (isSale ? p.monedavanzare : p.monedainchiriere) || 'EUR';

  const rooms = p.nrcamere ? Number(p.nrcamere) : null;
  const zona = (p.zona || '').trim() || null;
  const localitate = (p.localitate || 'București').trim();
  const lat = p.latitudine ?? null;
  const lng = p.longitudine ?? null;

  const composedDescription = composePropertyDescription({
    rooms,
    surface: surface || null,
    floor: parseFloor(p.etaj, p.nretaj, p.floor),
    totalFloors: parseTotalFloors(p.nrnivele, p.nivele, p.regimsuprateran, p.total_floors),
    price: priceAmount ? Number(priceAmount) : null,
    currency,
    isSale,
    projectName: p.proiect || p.complex || null,
    zone: zona,
    city: localitate,
    bathrooms: p.nrbai ? Number(p.nrbai) : null,
    yearBuilt: p.anconstructie ? Number(p.anconstructie) : null,
    furnished: furnishedLabel,
    propertyType: (p.tiplocuinta || 'apartament').trim(),
    storedDescription: description || null,
  });
  const metaDesc = composeMetaDescription(composedDescription);

  return (
    <>
      <PropertySeo
        title={title}
        description={composedDescription}
        metaDescription={metaDesc}
        canonicalPath={canonicalPath}
        images={images.map((i: any) => i.src)}
        price={priceAmount ? Number(priceAmount) : null}
        currency={currency}
        isAvailable={true}
        rooms={rooms}
        bathrooms={p.nrbai ? Number(p.nrbai) : null}
        surface={surface || null}
        floor={parseFloor(p.etaj, p.nretaj, p.floor)}
        yearBuilt={p.anconstructie ? Number(p.anconstructie) : null}
        zone={zona}
        city={localitate}
        street={p.adresa || null}
        latitude={lat ? Number(lat) : null}
        longitude={lng ? Number(lng) : null}
        datePosted={addedDate || null}
        isSale={isSale}
        projectName={p.proiect || p.complex || null}
      />
      <Helmet>
        <meta name="twitter:url" content={propertyUrl} />
        <meta property="og:image" content={ogImage} />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/proprietati" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" /> Înapoi la proprietăți
          </Link>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 rounded-xl overflow-hidden">
              {images.slice(0, 1).map((img: any, i: number) => (
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
                    {thumbs.map((img: any, i: number) => (
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
                {p.top === 1 && <Badge className="bg-gold text-black font-bold">TOP</Badge>}
                {p.exclusivitate === 1 && <Badge variant="outline" className="border-gold text-gold">Exclusivitate</Badge>}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>

              <div className="flex flex-wrap items-baseline gap-4">
                <p className="text-2xl font-bold text-gold">{formatPrice(property)}</p>
              </div>

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
                        <div key={i} className="rounded-xl bg-muted/40 border border-border/50 p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
                          <Icon className={`h-6 w-6 mb-2 ${s.tone}`} />
                          <div className="text-2xl font-bold text-foreground leading-tight">{s.value}</div>
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
                const renderCardSection = (raw: string | null | undefined, sectionTitle: string, Icon: any) => {
                  if (!raw) return null;
                  const items = raw.split(',').map(s => s.trim()).filter(Boolean);
                  if (items.length === 0) return null;
                  const hasMore = items.length > PREVIEW_LIMIT;
                  const visible = hasMore ? items.slice(0, PREVIEW_LIMIT) : items;
                  return (
                    <section className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                          <Icon className="h-5 w-5 text-gold" /> {sectionTitle}
                        </h2>
                        {hasMore && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-sm text-gold hover:text-gold/80 shrink-0" onClick={() => setOpenSection({ title: sectionTitle, items })}>
                            Vezi toate ({items.length})
                          </Button>
                        )}
                      </div>
                      <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr items-stretch">
                        {visible.map((item, i) => (
                          <div key={i} title={item} className="h-full min-w-0 max-w-full rounded-md bg-muted/40 border border-border/50 px-3 py-2 text-xs sm:text-sm text-foreground break-words [overflow-wrap:anywhere] hyphens-auto leading-snug text-left flex items-center justify-start">
                            <span className="line-clamp-2 w-full">{item}</span>
                          </div>
                        ))}
                        {hasMore && (
                          <button type="button" onClick={() => setOpenSection({ title: sectionTitle, items })} className="h-full min-w-0 max-w-full rounded-md border border-dashed border-border px-3 py-2 text-xs sm:text-sm text-muted-foreground hover:text-gold hover:border-gold transition-colors text-center flex items-center justify-center">
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
                  <SectionDialog open={!!openSection} onOpenChange={(o) => !o && setOpenSection(null)} title={openSection?.title} items={openSection?.items} />
                </Suspense>
              )}

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Descriere</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {description && description.length > 150 ? description : composedDescription}
                </p>
              </div>

              {vecinatati && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Vecinătăți</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{vecinatati}</p>
                </div>
              )}

              {opinieagent && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Opinia agentului</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line italic">{opinieagent}</p>
                </div>
              )}

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

            <div className="lg:col-span-1 space-y-4">
              {agentInfo && (
                <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground">Agent</h2>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm">{agentInfo.nume}</p>
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

              <div className="sticky top-28 rounded-xl border bg-card p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Solicită informații</h2>
                <form onSubmit={handleContact} className="space-y-3">
                  <Input placeholder="Nume *" required value={contactForm.nume} onChange={e => setContactForm(f => ({ ...f, nume: e.target.value }))} />
                  <Input placeholder="Telefon *" required type="tel" value={contactForm.telefon} onChange={e => setContactForm(f => ({ ...f, telefon: e.target.value }))} />
                  <Input placeholder="Email" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
                  <Textarea placeholder="Mesaj" rows={3} value={contactForm.mesaj} onChange={e => setContactForm(f => ({ ...f, mesaj: e.target.value }))} />
                  <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black" disabled={submitting}>
                    {submitting ? 'Se trimite...' : 'Trimite cererea'}
                  </Button>
                </form>
              </div>
            </div>

            {(() => {
              const pool = (similarPool || []).filter((s: any) => s.id !== row.id);
              const sameSale = pool.filter((s: any) => s.transaction_type === row.transaction_type);
              const sameRooms = sameSale.filter((s: any) => Number(s.rooms) === Number(row.rooms));
              const ranked = [...sameRooms, ...sameSale.filter(s => !sameRooms.includes(s)), ...pool.filter(s => !sameSale.includes(s))];
              const similar = ranked.slice(0, 6);
              if (similar.length === 0) return null;
              return (
                <section aria-label="Proprietăți similare" className="mt-12">
                  <h2 className="text-xl md:text-2xl font-bold mb-5">Proprietăți similare</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {similar.map((s: any) => {
                      const img = Array.isArray(s.images) ? s.images[0] : null;
                      return (
                        <Link key={s.id} to={getImmofluxItemUrl(s)} className="rounded-xl border bg-card overflow-hidden hover:border-gold transition-colors group">
                          {img && (
                            <img src={img} alt={s.title} loading="lazy" decoding="async" className="w-full h-44 object-cover group-hover:opacity-95" />
                          )}
                          <div className="p-4">
                            <div className="font-semibold line-clamp-2 text-sm">{s.title}</div>
                            <div className="text-gold font-bold mt-2">
                              {s.price_min ? `${Number(s.price_min).toLocaleString('ro-RO')} ${s.currency || 'EUR'}${s.transaction_type === 'rent' ? '/lună' : ''}` : 'Preț la cerere'}
                            </div>
                            {s.zone && <div className="text-xs text-muted-foreground mt-1 truncate">{s.zone}{s.city ? `, ${s.city}` : ''}</div>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })()}
          </div>
        </div>
      </main>
      {lightboxOpen && (
        <Suspense fallback={<LightboxSkeleton />}>
          <ImageLightbox
            images={images.map((img: any) => img.src)}
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

const ImmofluxNotFound = () => {
  return (
    <>
      <Helmet>
        <title>Proprietate negăsită — MVA Imobiliare</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Proprietatea căutată nu mai este disponibilă. Vezi alte oferte similare pe MVA Imobiliare." />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16 container mx-auto px-4 min-h-[60vh]">
        <div className="flex flex-col items-center text-center mb-10">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Proprietatea nu a fost găsită</h1>
          <p className="text-muted-foreground max-w-xl">
            Anunțul căutat a fost retras sau adresa este greșită. Explorează lista completă de proprietăți active.
          </p>
          <Link to="/proprietati" className="mt-6">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Vezi toate proprietățile</Button>
          </Link>
        </div>
      </main>
      <Suspense fallback={<FooterSkeleton />}><Footer /></Suspense>
    </>
  );
};

export default ImmofluxPropertyDetail;
