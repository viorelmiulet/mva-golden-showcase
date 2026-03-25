import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useProperty, useSubmitContact, formatPrice, getTitle, getDescription, getSurface, type ImmofluxContactData } from "@/hooks/useImmoflux";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BedDouble, Bath, Maximize, Building, Calendar, MapPin, AlertCircle, Zap, Sofa, PaintBucket, Wrench, Phone, Mail, User, SquareStack, Home, Thermometer } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, lazy, Suspense } from "react";
import { toast } from "sonner";

const ImageLightbox = lazy(() => import("@/components/ImageLightbox").then(m => ({ default: m.ImageLightbox })));

const ImmofluxPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = useProperty(id || '');
  const contactMutation = useSubmitContact();

  const [contactForm, setContactForm] = useState({ nume: '', telefon: '', email: '', mesaj: '' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const details = [
    { icon: BedDouble, label: 'Camere', value: property.nrcamere },
    { icon: Bath, label: 'Băi', value: property.nrbai },
    { icon: Maximize, label: 'Suprafață utilă', value: surface ? `${surface} mp` : null },
    { icon: Maximize, label: 'Suprafață construită', value: p.suprafataconstruita ? `${p.suprafataconstruita} mp` : null },
    { icon: Maximize, label: 'Teren', value: property.suprafatateren ? `${property.suprafatateren} mp` : null },
    { icon: Building, label: 'Etaj', value: property.etaj },
    { icon: SquareStack, label: 'Nr. nivele', value: p.nrnivele },
    { icon: Home, label: 'Balcoane', value: p.nrbalcoane },
    { icon: Calendar, label: 'An construcție', value: property.anconstructie },
    { icon: Sofa, label: 'Compartimentare', value: p.tipcompartimentare },
    { icon: Building, label: 'Confort', value: p.confort ? `Confort ${p.confort}` : null },
    { icon: Wrench, label: 'Structură', value: p.structurarezistenta },
    { icon: Home, label: 'Tip locuință', value: p.tiplocuinta },
    { icon: Home, label: 'Tip imobil', value: p.tipimobil },
    { icon: Thermometer, label: 'Eficiență energetică', value: p.eficienta_energetica ? `Clasa ${p.eficienta_energetica}` : null },
    { icon: Calendar, label: 'Stadiu construcție', value: p.stadiuconstructie },
    { icon: Home, label: 'Destinație', value: p.destinatie },
    { icon: Calendar, label: 'Disponibilitate', value: p.disponibilitateproprietare || p.disponibilitateproprietate },
    { icon: MapPin, label: 'Adresă', value: p.adresa?.trim() },
    { icon: MapPin, label: 'Localitate', value: property.localitate },
    { icon: MapPin, label: 'Zonă', value: property.zona },
  ].filter(d => d.value);

  const pricePerSqm = p.pretm2 ? `${Number(p.pretm2).toLocaleString('ro-RO')} EUR/mp` : null;

  const agentInfo = p.agent_info;

  // Parse text sections
  const utilitati = p.utilitati?.trim();
  const finisaje = p.finisaje?.trim();
  const dotari = p.dotari?.trim();
  const altedetaliizona = p.altedetaliizona?.trim();
  const vecinatati = typeof p.vecinatati === 'object' ? p.vecinatati?.ro?.trim() : p.vecinatati?.trim?.();
  const opinieagent = typeof p.opinieagent === 'object' ? p.opinieagent?.ro?.trim() : p.opinieagent?.trim?.();

  return (
    <>
      <Helmet>
        <title>{title} | MVA Imobiliare</title>
        <meta name="description" content={description?.substring(0, 160) || title} />
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
                {pricePerSqm && <p className="text-sm text-muted-foreground">({pricePerSqm})</p>}
              </div>

              {/* Caracteristici */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <d.icon className="h-4 w-4 text-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">{d.label}</p>
                      <p className="font-semibold text-xs truncate">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Descriere */}
              {description && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Descriere</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{description}</p>
                </div>
              )}

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
