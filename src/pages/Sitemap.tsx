import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Sitemap = () => {
  const sections = [
    {
      title: "Pagini Principale",
      links: [
        { label: "Acasă", url: "/" },
        { label: "Proprietăți", url: "/proprietati" },
        { label: "Ansambluri Rezidențiale", url: "/complexe" },
        { label: "Servicii", url: "/servicii" },
        { label: "Blog", url: "/blog" },
        { label: "Contact", url: "/contact" },
      ],
    },
    {
      title: "Despre Companie",
      links: [
        { label: "Despre Noi", url: "/despre-noi" },
        { label: "De ce să ne alegi", url: "/de-ce-noi" },
        { label: "Cariere", url: "/cariera" },
        { label: "Întrebări Frecvente", url: "/faq" },
      ],
    },
    {
      title: "Ansambluri Rezidențiale",
      links: [
        { label: "Militari Residence", url: "/militari-residence" },
        { label: "Renew Residence", url: "/renew-residence" },
        { label: "Eurocasa Residence", url: "/eurocasa-residence" },
      ],
    },
    {
      title: "Instrumente",
      links: [
        { label: "Calculator Credit", url: "/calculator-credit" },
      ],
    },
    {
      title: "Politici și Legal",
      links: [
        { label: "Politica de Confidențialitate", url: "/politica-confidentialitate" },
        { label: "Termeni și Condiții", url: "/termeni-conditii" },
        { label: "Politici Editoriale", url: "/politici-editoriale" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Hartă Site (Sitemap) | MVA Imobiliare</title>
        <meta name="description" content="Harta completă a site-ului MVA Imobiliare — toate paginile și secțiunile importante într-un singur loc." />
        <link rel="canonical" href="https://mvaimobiliare.ro/sitemap" />
      </Helmet>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Hartă Site</h1>
          <p className="text-muted-foreground mb-12">Navigare completă prin toate paginile site-ului MVA Imobiliare.</p>

          <div className="grid sm:grid-cols-2 gap-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-gold mb-4">{section.title}</h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.url}>
                      <Link to={link.url} className="text-foreground hover:text-gold transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sitemap;
