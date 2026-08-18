import { useContactDialog } from "@/components/contact/ContactDialogProvider";

const STEPS = [
  { n: "01", t: "Evaluare gratuită", d: "Stabilim prețul corect de piață, pe baza tranzacțiilor reale din zonă." },
  { n: "02", t: "Promovare profesională", d: "Fotografii, descriere completă și distribuție pe toate canalele relevante." },
  { n: "03", t: "Vizionări și negociere", d: "Filtrăm cumpărătorii serioși și negociem în interesul tău." },
  { n: "04", t: "Acte și semnare", d: "Te asistăm până la notar, cu toate documentele pregătite." },
];

const OwnersBand = () => {
  const { openContactForm } = useContactDialog();

  return (
    <section className="bg-ink py-14 sm:py-20 text-paper">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
          <div>
            <p className="text-spec text-brass mb-2">PENTRU PROPRIETARI</p>
            <h2 className="text-display-md text-paper">Vinzi sau închiriezi o proprietate?</h2>
            <p className="text-body text-paper/70 mt-4">
              Îți evaluăm gratuit locuința și îți prezentăm un plan clar de vânzare sau închiriere,
              cu termene și comision comunicate transparent de la început.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openContactForm({ reason: "vand", title: "Evaluare gratuită a proprietății" })}
                className="inline-flex h-12 items-center rounded-sm bg-brass px-7 text-small font-semibold uppercase tracking-wide text-ink transition-colors duration-200 hover:bg-brass-light"
              >
                Cere evaluare gratuită
              </button>
              <button
                type="button"
                onClick={() => openContactForm({ reason: "inchiriez-proprietatea", title: "Închiriază prin MVA" })}
                className="inline-flex h-12 items-center rounded-sm border border-paper/25 px-7 text-small font-semibold uppercase tracking-wide text-paper transition-colors duration-200 hover:border-brass hover:text-brass"
              >
                Vreau să închiriez
              </button>
            </div>
          </div>

          <ol className="grid gap-px overflow-hidden rounded-sm bg-paper/10 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-graphite p-6">
                <span className="text-spec text-brass">{s.n}</span>
                <h3 className="text-title text-paper mt-2">{s.t}</h3>
                <p className="text-small text-paper/65 mt-1.5">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default OwnersBand;
