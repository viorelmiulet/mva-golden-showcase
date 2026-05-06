import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useProperty, useSubmitContact, formatPrice, getTitle, getDescription, getSurface, type ImmofluxContactData } from "@/hooks/useImmoflux";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BedDouble, Bath, Maximize, Building, Calendar, MapPin, AlertCircle, Zap, Sofa, PaintBucket, Wrench, Phone, Mail, User, SquareStack, Home, Thermometer, ClipboardList, ArrowUpDown, Building2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, lazy, Suspense } from "react";
import { toast } from "sonner";
import { extractImmofluxIdFromSlug, getImmofluxPropertyUrl } from "@/lib/propertySlug";

const ImageLightbox = lazy(() => import("@/components/ImageLightbox").then(m => ({ default: m.ImageLightbox })));

const ImmofluxPropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Support both old numeric IDs and new SEO slugs
  const propertyId = slug ? (extractImmofluxIdFromSlug(slug) || slug) : '';
  const { data: property, isLoading, isError } = useProperty(propertyId);
  const contactMutation = useSubmitContact();

  const [contactForm, setContactForm] = useState({ nume: '', telefon: '', email: '', mesaj: '' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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
      <Footer />
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
      <Footer />
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

  type StatItem = { label: string; value: string | number; icon: any; tone: string };
  const statCards: StatItem[] = [
    { label: 'Camere', value: p.nrcamere, icon: Home, tone: 'text-sky-400' },
    { label: 'Dormitoare', value: p.nrdormitoare ?? p.dormitoare, icon: Home, tone: 'text-violet-400' },
    { label: 'Grup Sanitar', value: p.nrbai, icon: Building, tone: 'text-cyan-400' },
    { label: 'm² Util', value: fmtMp(surface), icon: Maximize, tone: 'text-emerald-400' },
    { label: 'm² Construit', value: fmtMp(p.suprafataconstruita), icon: Building2, tone: 'text-orange-400' },
    { label: 'Etaj', value: p.etaj, icon: ArrowUpDown, tone: 'text-indigo-400' },
    { label: 'An Construcție', value: p.anconstructie, icon: Calendar, tone: 'text-slate-300' },
  ].filter((s): s is StatItem => s.value !== null && s.value !== undefined && s.value !== '' && s.value !== 0);

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

  const propertyUrl = `https://mvaimobiliare.ro/proprietate/${slug}`;
  const ogImage = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-image?type=immoflux&id=${propertyId}`;
  const metaDesc = (description || title).substring(0, 160);
  const ogType = isSale ? "product" : "website";
  const priceAmount = p.pret ? String(p.pret) : null;

  return (
    <>
      <Helmet>
        <title>{title} | MVA Imobiliare</title>
        <meta name="description" content={metaDesc} />
        <meta name="author" content="MVA Imobiliare" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={propertyUrl} />

        {/* Open Graph */}
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content="MVA Imobiliare" />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:url" content={propertyUrl} />
        <meta property="og:title" content={`${title} | MVA Imobiliare`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        {priceAmount && <meta property="product:price:amount" content={priceAmount} />}
        {priceAmount && <meta property="product:price:currency" content="EUR" />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MVAImobiliare" />
        <meta name="twitter:creator" content="@MVAImobiliare" />
        <meta name="twitter:title" content={`${title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={title} />
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
                <img key={i} src={img.src} alt={title} className="col-span-2 row-span-2 w-full h-64 md:h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity" loading="eager" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} />
              ))}
              {images.slice(1, 5).map((img, i) => (
                <img key={i + 1} src={img.src} alt={`${title} ${i + 2}`} className="w-full h-32 md:h-[calc(12rem-0.25rem)] object-cover cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }} />
              ))}
              {images.length > 5 && (
                <button
                  onClick={() => { setLightboxIndex(5); setLightboxOpen(true); }}
                  className="relative w-full h-32 md:h-[calc(12rem-0.25rem)] bg-muted flex items-center justify-center text-foreground font-semibold hover:bg-muted/80 transition-colors"
                >
                  +{images.length - 5} imagini
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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

              {/* Detalii proprietate */}
              {allDetails.length > 0 && (() => {
                const mid = Math.ceil(allDetails.length / 2);
                const leftCol = allDetails.slice(0, mid);
                const rightCol = allDetails.slice(mid);
                // Inserăm zero-width space după separatori frecvenți (/, \, -, ., ,)
                // ca să permitem ruperea naturală fără să aplicăm hyphenation greșit.
                const softBreak = (val: any) => {
                  if (val === null || val === undefined) return val;
                  const s = String(val);
                  return s.replace(/([\/\\\-\.,])(?=\S)/g, "$1\u200B");
                };
                const softBreakLabel = (val: string) =>
                  val.replace(/([\/\\\-])(?=\S)/g, "$1\u200B");
                const renderRow = (d: { label: string; value: any }, i: number) => (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-start gap-x-3 sm:gap-x-4 py-2.5 md:py-3 text-[13px] md:text-sm leading-snug"
                  >
                    <dt className="text-muted-foreground font-normal min-w-0 break-words [overflow-wrap:anywhere]">
                      {softBreakLabel(d.label)}
                    </dt>
                    <dd className="font-semibold text-foreground text-right min-w-0 break-words [overflow-wrap:anywhere] [hyphens:none]">
                      {typeof d.value === "string" || typeof d.value === "number"
                        ? softBreak(d.value)
                        : d.value}
                    </dd>
                  </div>
                );
                const isLong = allDetails.length > 10;
                return (
                  <section className="rounded-xl border bg-card p-4 sm:p-5 md:p-6 shadow-sm overflow-hidden">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4 tracking-tight">
                      Detalii proprietate
                    </h2>
                    <div
                      className={
                        !isLong
                          ? ""
                          : detailsExpanded
                          ? "max-h-[70vh] overflow-y-auto overscroll-contain pr-1 -mr-1"
                          : "relative max-h-[420px] md:max-h-[460px] overflow-hidden"
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
                        <dl className="divide-y divide-border/50 min-w-0">{leftCol.map(renderRow)}</dl>
                        <dl className="divide-y divide-border/50 md:border-t-0 border-t border-border/50 min-w-0">
                          {rightCol.map(renderRow)}
                        </dl>
                      </div>
                      {isLong && !detailsExpanded && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent"
                        />
                      )}
                    </div>
                    {isLong && (
                      <div className="mt-3 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsExpanded((v) => !v)}
                          aria-expanded={detailsExpanded}
                          className="text-gold hover:text-gold"
                        >
                          {detailsExpanded ? "Vezi mai puțin" : "Vezi toate detaliile"}
                        </Button>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* Utilități */}
              {utilitati && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gold" /> Utilități
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {utilitati.split(',').map((item: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{item.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Finisaje */}
              {finisaje && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <PaintBucket className="h-5 w-5 text-gold" /> Finisaje
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {finisaje.split(',').map((item: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{item.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dotări */}
              {dotari && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sofa className="h-5 w-5 text-gold" /> Dotări
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {dotari.split(',').map((item: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{item.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalii zonă */}
              {altedetaliizona && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gold" /> Detalii zonă
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {altedetaliizona.split(',').map((item: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{item.trim()}</Badge>
                    ))}
                  </div>
                </div>
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
      <Suspense fallback={null}>
        <ImageLightbox
          images={images.map(img => img.src)}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          initialIndex={lightboxIndex}
        />
      </Suspense>
      <Footer />
    </>
  );
};

export default ImmofluxPropertyDetail;
