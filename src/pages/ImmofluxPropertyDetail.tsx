import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useProperty, useSubmitContact, formatPrice, getTitle, getDescription, getSurface, type ImmofluxContactData } from "@/hooks/useImmoflux";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BedDouble, Bath, Maximize, Building, Calendar, MapPin, AlertCircle } from "lucide-react";
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

  const images = [...(property.images || [])].sort((a, b) => a.pozitie - b.pozitie);
  const title = getTitle(property);
  const description = getDescription(property);
  const isSale = property.devanzare === 1;
  const surface = getSurface(property);

  const details = [
    { icon: BedDouble, label: 'Camere', value: property.nrcamere },
    { icon: Bath, label: 'Băi', value: property.nrbai },
    { icon: Maximize, label: 'Suprafață utilă', value: surface ? `${surface} mp` : null },
    { icon: Maximize, label: 'Teren', value: property.suprafatateren ? `${property.suprafatateren} mp` : null },
    { icon: Building, label: 'Etaj', value: property.etaj },
    { icon: Calendar, label: 'An construcție', value: property.anconstructie },
    { icon: MapPin, label: 'Localitate', value: property.localitate },
    { icon: MapPin, label: 'Zonă', value: property.zona },
  ].filter(d => d.value);

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
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
              <p className="text-2xl font-bold text-gold">{formatPrice(property)}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <d.icon className="h-5 w-5 text-gold shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                      <p className="font-semibold text-sm">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {description && (
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Descriere</h2>
                  <p className="whitespace-pre-line">{description}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-xl border bg-card p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Solicită informații</h2>
                <form onSubmit={handleContact} className="space-y-3">
                  <Input
                    placeholder="Nume *"
                    required
                    value={contactForm.nume}
                    onChange={e => setContactForm(f => ({ ...f, nume: e.target.value }))}
                  />
                  <Input
                    placeholder="Telefon *"
                    required
                    type="tel"
                    value={contactForm.telefon}
                    onChange={e => setContactForm(f => ({ ...f, telefon: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Mesaj"
                    rows={3}
                    value={contactForm.mesaj}
                    onChange={e => setContactForm(f => ({ ...f, mesaj: e.target.value }))}
                  />
                  <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black" disabled={contactMutation.isPending}>
                    {contactMutation.isPending ? 'Se trimite...' : 'Trimite cererea'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ImmofluxPropertyDetail;
