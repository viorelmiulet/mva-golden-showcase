import { ShieldCheck, MapPinned, Handshake, FileCheck2 } from "lucide-react";

const ITEMS = [
  {
    icon: MapPinned,
    title: "Expertiză locală reală",
    text: "Peste 10 ani în piața Bucureștiului, cu cunoaștere în detaliu a vestului Capitalei.",
  },
  {
    icon: ShieldCheck,
    title: "Proprietăți verificate",
    text: "Fiecare anunț este verificat: acte, disponibilitate, preț și date tehnice actualizate.",
  },
  {
    icon: Handshake,
    title: "Consultanță de la A la Z",
    text: "De la prima vizionare până la semnare: negociere, credit, evaluare și acte.",
  },
  {
    icon: FileCheck2,
    title: "Transparență totală",
    text: "Comision comunicat clar de la început, fără costuri ascunse pe parcurs.",
  },
];

const WhyUsBand = () => (
  <section className="border-t border-stone bg-background py-14 sm:py-20">
    <div className="container mx-auto px-4 lg:px-6">
      <p className="text-spec text-brass mb-2">DE CE MVA IMOBILIARE</p>
      <h2 className="text-display-md text-foreground max-w-2xl">
        Un partener care îți apără interesul, nu doar un intermediar
      </h2>

      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-stone bg-stone sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-card p-6">
            <Icon className="h-6 w-6 text-brass" aria-hidden="true" />
            <h3 className="text-title text-foreground mt-4">{title}</h3>
            <p className="text-small text-muted-foreground mt-2">{text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyUsBand;
