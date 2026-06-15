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
import PropertySeo from "@/components/PropertySeo";
import { composePropertyDescription, composeMetaDescription } from "@/lib/propertyDescription";

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
  const { data: similarPool } = useProperties(1);

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

  // ── Slug-derived SEO seed (used while loading AND as the canonical for this URL) ──
  // We canonicalize to the SLUG IN THE URL (never to a recomputed one). This guarantees
  // canonical, og:url and twitter:url all share the same URL — no redirects, no divergence.
  const urlSlug = slug || '';
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

  // SEO + minimal visible body (H1 + description) emitted even while loading so bots
  // never snapshot an empty <body>.
  const LoadingSeoShell = (
    <>
      <PropertySeo
        title={slugSeed.h1}
        description={slugSeed.desc}
        metaDescription={slugSeed.desc}
        canonicalPath={slugCanonicalPath}
        images={[]}
        rooms={slugSeed.rooms}
        surface={slugSeed.surface}
        floor={slugSeed.floor}
        city="București"
        isSale
      />
      <Helmet>
        <meta name="twitter:url" content={slugCanonicalUrl} />
      </Helmet>
    </>
  );

  if (isLoading) return (
    <>
      {LoadingSeoShell}
      <Header />
      <main className="pt-24 pb-16 container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{slugSeed.h1}</h1>
        <p className="text-muted-foreground mb-6 max-w-2xl">{slugSeed.desc}</p>
        <PropertyDetailSkeleton />
      </main>
      <Suspense fallback={<FooterSkeleton />}><Footer /></Suspense>
    </>
  );

  if (isError || !property) return <ImmofluxNotFound />;

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

  // Canonical path is computed from the property payload and emitted via <link rel="canonical">
  // in PropertySeo. We intentionally do NOT redirect the browser — Google consolidates duplicates
  // via the canonical tag, and a hard redirect during render breaks bot prerendering (empty body).
  const canonicalPath = getImmofluxPropertyUrl(property as any);
  const propertyUrl = `https://www.mvaimobiliare.ro${canonicalPath}`;
  const ogImage = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-image?type=immoflux&id=${propertyId}`;
  const ogType = isSale ? "product" : "website";
  const priceAmount = p.pret ? String(p.pret) : null;
  const currency = (isSale ? p.monedavanzare : p.monedainchiriere) || 'EUR';

  // ── Auto-generated SEO title & description from API data ──
  const rooms = p.nrcamere ? Number(p.nrcamere) : null;
  const zona = (p.zona || '').trim() || null;
  const localitate = (p.localitate || p.oras || 'București').trim();
  const lat = p.latitudine ?? p.latitude ?? null;
  const lng = p.longitudine ?? p.longitude ?? null;

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

  // Keep an SEO-friendly H1/title source from the API title.
  const seoTitleSource = title;

  return (
    <>
      <PropertySeo
        title={seoTitleSource}
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
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Descriere</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {description && description.length > 150 ? description : composedDescription}
                </p>
              </div>

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

          {(() => {
            const pool = (similarPool?.data || []).filter((s: ImmofluxProperty) => s.idnum !== property.idnum);
            const sameSale = pool.filter(s => s.devanzare === property.devanzare);
            const sameRooms = sameSale.filter(s => Number(s.nrcamere) === Number(p.nrcamere));
            const ranked = [...sameRooms, ...sameSale.filter(s => !sameRooms.includes(s)), ...pool.filter(s => !sameSale.includes(s))];
            const similar = ranked.slice(0, 6);
            if (similar.length === 0) return null;
            return (
              <section aria-label="Proprietăți similare" className="mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-5">Proprietăți similare</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similar.map((s) => (
                    <Link
                      key={s.idnum}
                      to={getImmofluxPropertyUrl(s as any)}
                      className="rounded-xl border bg-card overflow-hidden hover:border-gold transition-colors group"
                    >
                      {s.images?.[0]?.src && (
                        <img
                          src={s.images[0].src}
                          alt={getTitle(s)}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-44 object-cover group-hover:opacity-95"
                        />
                      )}
                      <div className="p-4">
                        <div className="font-semibold line-clamp-2 text-sm">{getTitle(s)}</div>
                        <div className="text-gold font-bold mt-2">{formatPrice(s)}</div>
                        {s.zona && <div className="text-xs text-muted-foreground mt-1 truncate">{s.zona}, {s.localitate}</div>}
                      </div>
                    </Link>
                  ))}
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

const ImmofluxNotFound = () => {
  const { data } = useProperties(1);
  const suggestions = (data?.data || []).slice(0, 3);
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
        {suggestions.length > 0 && (
          <section aria-label="Proprietăți active">
            <h2 className="text-lg font-semibold mb-4">Proprietăți active recomandate</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestions.map((s) => (
                <Link
                  key={s.idnum}
                  to={getImmofluxPropertyUrl(s as any)}
                  className="rounded-xl border bg-card p-4 hover:border-gold transition-colors"
                >
                  {s.images?.[0]?.src && (
                    <img src={s.images[0].src} alt={getTitle(s)} loading="lazy" decoding="async" className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <div className="font-semibold line-clamp-2">{getTitle(s)}</div>
                  <div className="text-sm text-gold mt-1">{formatPrice(s)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Suspense fallback={<FooterSkeleton />}><Footer /></Suspense>
    </>
  );
};

export default ImmofluxPropertyDetail;
