import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PoliticiEditoriale = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Politici Editoriale | MVA Imobiliare</title>
        <meta name="description" content="Standardele editoriale și principiile redacționale ale MVA Imobiliare pentru conținutul publicat pe blog și site." />
        <link rel="canonical" href="https://mvaimobiliare.ro/politici-editoriale" />
      </Helmet>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-28">
        <article className="max-w-3xl mx-auto prose prose-invert">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Politici Editoriale</h1>
          <p className="text-muted-foreground mb-8">Ultima actualizare: aprilie 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Misiunea noastră editorială</h2>
            <p>
              MVA Imobiliare publică conținut imobiliar credibil, util și actualizat pentru cumpărători,
              vânzători și investitori din zona Bucureștiului și Ilfov. Toate articolele noastre sunt
              redactate de specialiști cu experiență directă pe piața locală.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Standarde de acuratețe</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verificăm toate datele despre proprietăți direct cu dezvoltatorii sau proprietarii.</li>
              <li>Prețurile și disponibilitatea sunt actualizate săptămânal.</li>
              <li>Statisticile de piață provin din surse oficiale (INS, ANCPI, rapoarte sectoriale).</li>
              <li>Corectăm prompt orice eroare semnalată de cititori.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Independență editorială</h2>
            <p>
              Articolele de pe blog reflectă opinii independente. Conținutul sponsorizat sau parteneriatele
              comerciale sunt etichetate clar ca atare. Nu acceptăm plăți pentru recenzii pozitive sau
              acoperire favorabilă a unor proprietăți.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Autorii noștri</h2>
            <p>
              Echipa editorială este formată din agenți imobiliari licențiați și consultanți cu minimum
              5 ani de experiență pe piața din Sectorul 6 și Chiajna. Pentru detalii despre echipă,
              consultați pagina <a href="/despre-noi" className="text-gold hover:underline">Despre Noi</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Corecții și feedback</h2>
            <p>
              Pentru sesizări privind conținutul, ne poți contacta la{" "}
              <a href="mailto:contact@mvaimobiliare.ro" className="text-gold hover:underline">
                contact@mvaimobiliare.ro
              </a>{" "}
              sau prin pagina de <a href="/contact" className="text-gold hover:underline">Contact</a>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PoliticiEditoriale;
