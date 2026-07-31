import { useParams, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailSkeleton, MapSkeleton, FooterSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Phone } from "lucide-react";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SpecRail from "@/components/SpecRail";
import PropertyCard from "@/components/PropertyCard";
import PropertyGallery from "@/components/property/PropertyGallery";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { extractImmofluxIdFromSlug } from "@/lib/propertySlug";
import { parseFloor, parseTotalFloors } from "@/lib/floorParsing";
import { composePropertyDescription } from "@/lib/propertyDescription";

const Footer = lazy(() => import("@/components/Footer"));
const ApproximateLocationMap = lazy(() => import("@/components/ApproximateLocationMap").then(m => ({ default: m.ApproximateLocationMap })));

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
export async function fetchImmofluxFromCatalog(urlSlug: string): Promise<any | null> {
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
  if (stored) return `/proprietati/${stored}`;
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
        .select('id, external_id, immoflux_slug, slug, title, images, price_min, currency, transaction_type, zone, city, rooms, surface_min, floor, floor_label, year_built, created_at, commission_value, commission_type, project_name, location')
        .eq('crm_source', 'immoflux')
        .eq('is_published', true)
        .neq('availability_status', 'sold')
        .neq('id', row?.id || '00000000-0000-0000-0000-000000000000')
        .limit(24);
      return data || [];
    },
    enabled: !!row?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background">
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
  const images: string[] = (property.images || []).map((img: any) => img.src).filter(Boolean);
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

  const floorValue = parseFloor(p.etaj, p.nretaj, p.floor);
  const totalFloors = parseTotalFloors(p.nrnivele, p.nivele, p.regimsuprateran, p.total_floors);

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
  const canonicalPath = `/proprietati/${canonicalSlug}`;
  const priceAmount = p.pret ? String(p.pret) : null;
  const currency = (isSale ? p.monedavanzare : p.monedainchiriere) || 'EUR';

  const rooms = p.nrcamere ? Number(p.nrcamere) : null;
  const zona = (p.zona || '').trim() || null;
  const localitate = (p.localitate || 'București').trim();
  const lat = p.latitudine ?? null;
  const lng = p.longitudine ?? null;
  const zoneLabel = [zona, localitate].filter(Boolean).join(', ') || 'București';

  const composedDescription = composePropertyDescription({
    rooms,
    surface: surface || null,
    floor: floorValue,
    totalFloors,
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

  const priceValue = Number(p.pret) || 0;
  const pricePerSqm = priceValue && surface ? Math.round(priceValue / surface) : null;
  const refCode = String(p.idstr || p.idnum || '').toUpperCase();
  const propertyUrl = `https://www.mvaimobiliare.ro${canonicalPath}`;
  const waMessage = `Bună ziua! Sunt interesat de proprietatea: ${title} — ${propertyUrl}`;
  const mailSubject = `Cerere informații: ${title} (Ref. ${refCode})`;

  const specItems = [
    rooms ? `${rooms} CAM` : null,
    surface ? `${fmtMp(surface)} MP` : null,
    floorValue ? `ET ${floorValue}${totalFloors ? `/${totalFloors}` : ''}` : null,
    p.anconstructie ? String(p.anconstructie) : null,
    p.compartimentare ? String(p.compartimentare).toUpperCase() : null,
  ];

  // Feature lists (plain text, brass check glyph)
  const splitTopLevel = (raw: string) => {
    const out: string[] = [];
    let depth = 0, buf = '';
    for (const ch of raw) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) { if (buf.trim()) out.push(buf.trim()); buf = ''; }
      else buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  };
  const featureGroups = [
    { title: 'Utilități', items: utilitati ? splitTopLevel(utilitati) : [] },
    { title: 'Finisaje', items: finisaje ? splitTopLevel(finisaje) : [] },
    { title: 'Dotări', items: dotari ? splitTopLevel(dotari) : [] },
    { title: 'Detalii zonă', items: altedetaliizona ? splitTopLevel(altedetaliizona) : [] },
  ].filter((g) => g.items.length > 0);

  const details: { label: string; value: string }[] = [];
  const pushDetail = (label: string, value: any, suffix = '') => {
    if (value === null || value === undefined || value === '') return;
    details.push({ label, value: `${value}${suffix}` });
  };
  pushDetail('Tip proprietate', p.tiplocuinta);
  pushDetail('Tranzacție', isSale ? 'Vânzare' : 'Închiriere');
  pushDetail('Camere', p.nrcamere);
  pushDetail('Suprafață utilă', fmtMp(surface), ' mp');
  pushDetail('Băi', p.nrbai);
  pushDetail('Balcoane', p.nrbalcoane);
  pushDetail('Etaj', floorValue ? `${floorValue}${totalFloors ? ` / ${totalFloors}` : ''}` : null);
  pushDetail('An construcție', p.anconstructie);
  pushDetail('Mobilat', furnishedLabel);
  pushDetail('Ansamblu', p.proiect || p.complex);
  pushDetail('Zonă', zoneLabel);
  pushDetail('Adăugat', formattedAddedDate);
  pushDetail('Referință', refCode);

  const descText = description && description.length > 150 ? description : composedDescription;

  // Similar: same zone within ±30% price, ranked by price proximity; then zone-only.
  const pool = (similarPool || []).filter((s: any) => s.id !== row.id && s.transaction_type === row.transaction_type);
  const sameZone = pool.filter((s: any) => (s.zone || '').trim().toLowerCase() === (zona || '').trim().toLowerCase() && zona);
  const inRange = sameZone
    .filter((s: any) => priceValue && s.price_min && Math.abs(s.price_min - priceValue) <= priceValue * 0.3)
    .sort((a: any, b: any) => Math.abs(a.price_min - priceValue) - Math.abs(b.price_min - priceValue));
  const zoneRest = sameZone.filter((s: any) => !inRange.includes(s));
  const ranked = [...inRange, ...zoneRest, ...pool.filter((s: any) => !sameZone.includes(s))];
  const similar = ranked.slice(0, 3);

  return (
    <>
      {images[0] && (
        <Helmet>
          <link rel="preload" as="image" href={images[0]} fetchPriority="high" />
        </Helmet>
      )}
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-24 md:pb-16" role="main">
          <div className="container mx-auto px-4 lg:px-6 max-w-6xl">
            <div className="py-4">
              <Breadcrumbs items={[{ label: 'Proprietăți', href: '/proprietati' }, { label: title }]} />
            </div>

            {/* Title block */}
            <header className="mb-6">
              <p className="text-spec text-muted-foreground mb-2">
                REF. {refCode}
                {formattedAddedDate ? ` · LISTAT ${formattedAddedDate.toUpperCase()}` : ''}
              </p>
              <h1 className="text-display-md text-foreground">{title}</h1>
            </header>

            {/* Above the fold: 60/40 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              <div className="lg:col-span-3">
                <PropertyGallery images={images} title={title} alt={`${title} — ${zoneLabel}`} />
              </div>

              <aside className="lg:col-span-2 lg:sticky lg:top-24">
                <div className="border border-stone rounded-sm p-6">
                  <p className="font-sans font-semibold text-[2rem] leading-none tabular-nums text-foreground">
                    {priceValue
                      ? `${priceValue.toLocaleString('ro-RO')} €${isSale ? '' : '/lună'}`
                      : 'Preț la cerere'}
                  </p>
                  {pricePerSqm && (
                    <p className="text-small text-muted-foreground mt-2">
                      {pricePerSqm.toLocaleString('ro-RO')} € / mp
                    </p>
                  )}

                  <p className="text-body text-foreground mt-4">
                    {zoneLabel}
                    {(p.proiect || p.complex) && (
                      <>
                        {' · '}
                        <span className="text-brass">{p.proiect || p.complex}</span>
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
                      <p className="text-body text-foreground truncate">{agentInfo?.nume || 'MVA Imobiliare'}</p>
                      <p className="text-spec text-muted-foreground">AGENT MVA</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <a
                      href="tel:+40767941512"
                      className="flex items-center justify-center gap-2 w-full h-12 bg-brass text-ink rounded-sm text-small font-medium hover:bg-brass-dark transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Sună 0767 941 512
                    </a>
                    <a
                      href={`https://wa.me/40767941512?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <h2 id="descriere" className="text-title text-foreground mb-4">Descriere</h2>
                  <p className="text-body text-muted-foreground leading-[1.6] whitespace-pre-line">{descText}</p>
                </section>
              )}

              {featureGroups.length > 0 && (
                <section aria-labelledby="caracteristici">
                  <h2 id="caracteristici" className="text-title text-foreground mb-4">Caracteristici</h2>
                  <div className="space-y-8">
                    {featureGroups.map((group) => (
                      <div key={group.title}>
                        <p className="text-spec text-muted-foreground mb-2">{group.title.toUpperCase()}</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                          {group.items.map((item, i) => (
                            <li key={`${item}-${i}`} className="text-body text-muted-foreground flex gap-2">
                              <span aria-hidden="true" className="text-brass">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {details.length > 0 && (
                <section aria-labelledby="detalii">
                  <h2 id="detalii" className="text-title text-foreground mb-4">Detalii</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    {details.map((d) => (
                      <div key={d.label} className="flex items-baseline justify-between gap-4 py-2 border-b border-stone">
                        <dt className="text-spec text-muted-foreground">{d.label.toUpperCase()}</dt>
                        <dd className="text-body text-foreground text-right">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {vecinatati && (
                <section aria-labelledby="vecinatati">
                  <h2 id="vecinatati" className="text-title text-foreground mb-4">Vecinătăți</h2>
                  <p className="text-body text-muted-foreground leading-[1.6] whitespace-pre-line">{vecinatati}</p>
                </section>
              )}

              {opinieagent && (
                <section aria-labelledby="opinie">
                  <h2 id="opinie" className="text-title text-foreground mb-4">Opinia agentului</h2>
                  <p className="text-body text-muted-foreground leading-[1.6] whitespace-pre-line">{opinieagent}</p>
                </section>
              )}

              <section aria-labelledby="locatie">
                <h2 id="locatie" className="text-title text-foreground mb-4">Locație</h2>
                <p className="text-body text-muted-foreground mb-4">{zoneLabel}</p>
                {lat && lng && (
                  <LazyMapMount>
                    <Suspense fallback={<MapSkeleton />}>
                      <ApproximateLocationMap
                        latitude={Number(lat)}
                        longitude={Number(lng)}
                        locationLabel={zoneLabel}
                      />
                    </Suspense>
                  </LazyMapMount>
                )}
              </section>
            </div>

            {similar.length > 0 && (
              <section className="mt-16" aria-labelledby="similare">
                <h2 id="similare" className="text-title text-foreground mb-6">Proprietăți similare</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similar.map((s: any) => (
                    <PropertyCard key={s.id} property={s} to={getImmofluxItemUrl(s)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Mobile fixed action bar */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-ink bg-background"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <a
            href="tel:+40767941512"
            className="w-1/2 h-14 flex items-center justify-center gap-2 bg-brass text-ink text-small font-medium"
          >
            <Phone className="w-4 h-4" />
            Sună
          </a>
          <a
            href={`https://wa.me/40767941512?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-1/2 h-14 flex items-center justify-center gap-2 border-l border-ink text-pine text-small font-medium"
          >
            <WhatsAppIcon className="w-4 h-4" />
            WhatsApp
          </a>
        </div>

        <Suspense fallback={null}><Footer /></Suspense>
      </div>
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
