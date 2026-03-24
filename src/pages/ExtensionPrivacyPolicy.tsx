import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";

const ExtensionPrivacyPolicy = () => {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: "Politica de Confidențialitate — Extensie Chrome", url: "/extensie-chrome-privacy" }
      ]} />
      <Helmet>
        <title>Politica de Confidențialitate — Extensie Chrome MVA Admin Panel</title>
        <meta name="description" content="Politica de confidențialitate pentru extensia Chrome MVA Admin Panel. Află ce date colectăm și cum le protejăm." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mvaimobiliare.ro/extensie-chrome-privacy" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">
            Politica de Confidențialitate — Extensie Chrome „MVA Admin Panel"
          </h1>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none space-y-6 sm:space-y-8">
            <p className="text-muted-foreground">Ultima actualizare: Martie 2026</p>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                1. Introducere
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Această politică de confidențialitate se aplică exclusiv extensiei Chrome „MVA Admin Panel" (denumită în continuare „Extensia"), 
                dezvoltată de MVA Imobiliare SRL. Extensia este destinată exclusiv echipei interne MVA Imobiliare și nu colectează, 
                nu stochează și nu transmite date personale ale utilizatorilor externi sau ale publicului larg.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                2. Ce face Extensia
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                Extensia oferă funcționalități administrative pentru agenții imobiliari MVA:
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li>Notificări push pentru emailuri noi primite în panoul de administrare</li>
                <li>Notificări push pentru programările de vizionare noi</li>
                <li>Afișarea numărului de emailuri necitite pe iconița extensiei (badge)</li>
                <li>Acces rapid către secțiunile panoului de administrare MVA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                3. Date colectate și stocate
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                Extensia colectează și stochează <strong>local pe dispozitivul utilizatorului</strong> (prin <code>chrome.storage.local</code>) 
                doar următoarele informații tehnice:
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li><strong>Timestamp-ul ultimei verificări</strong> — pentru a preveni notificările duplicate</li>
                <li><strong>Preferințe de notificare</strong> — activare/dezactivare notificări (emailuri și vizionări)</li>
              </ul>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
                <strong>Extensia NU colectează:</strong>
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li>Date personale ale utilizatorilor (nume, email, telefon)</li>
                <li>Istoricul de navigare sau activitatea în browser</li>
                <li>Cookie-uri sau date de autentificare</li>
                <li>Informații despre alte extensii sau aplicații instalate</li>
                <li>Date de localizare sau adresa IP</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                4. Comunicare cu serverul
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Extensia comunică exclusiv cu serverul backend MVA Imobiliare pentru a verifica existența emailurilor noi necitite 
                și a programărilor de vizionare. Aceste cereri folosesc o cheie publică (anon key) și nu transmit date personale. 
                Comunicarea este criptată prin HTTPS. Nu se transmit date către servicii terțe, rețele de publicitate sau platforme de analiză.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                5. Permisiuni utilizate
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base text-muted-foreground border border-border rounded-lg">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left p-2 sm:p-3 font-semibold text-foreground border-b border-border">Permisiune</th>
                      <th className="text-left p-2 sm:p-3 font-semibold text-foreground border-b border-border">Motiv</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm">notifications</td>
                      <td className="p-2 sm:p-3">Afișarea notificărilor push pentru emailuri noi și vizionări</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm">alarms</td>
                      <td className="p-2 sm:p-3">Verificarea periodică (polling la 60 secunde) a datelor noi</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm">storage</td>
                      <td className="p-2 sm:p-3">Salvarea locală a preferințelor și timestamp-urilor</td>
                    </tr>
                    <tr>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm">host_permissions</td>
                      <td className="p-2 sm:p-3">Acces la API-ul backend MVA pentru verificarea emailurilor și vizionărilor</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                6. Partajarea datelor
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                <strong>Nu partajăm, nu vindem și nu transferăm</strong> nicio informație către terți. 
                Extensia nu conține reclame, trackere, module de analiză sau SDK-uri terțe. 
                Datele rămân exclusiv pe dispozitivul utilizatorului și pe serverul intern MVA.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                7. Retenția datelor
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Datele stocate local (timestamp-uri, preferințe) sunt șterse automat la dezinstalarea extensiei. 
                Utilizatorul poate șterge manual datele din <code>chrome://extensions</code> → MVA Admin Panel → „Elimină".
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                8. Securitate
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Toate comunicările cu serverul sunt criptate prin HTTPS/TLS. Extensia utilizează exclusiv 
                cheia publică (anon key) pentru autentificarea cererilor API, fără a stoca sau transmite credențiale sensibile. 
                Extensia respectă standardele Manifest V3 impuse de Google Chrome.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                9. Drepturile utilizatorilor
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                Conform GDPR, aveți dreptul la:
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li>Informare cu privire la datele stocate</li>
                <li>Ștergerea datelor (prin dezinstalarea extensiei)</li>
                <li>Dezactivarea notificărilor din popup-ul extensiei</li>
                <li>Solicitarea de informații suplimentare prin email</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                10. Modificări ale politicii
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Ne rezervăm dreptul de a actualiza această politică. Orice modificare va fi reflectată pe această pagină 
                cu data ultimei actualizări. Vă recomandăm să verificați periodic această pagină.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                11. Contact
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Pentru întrebări legate de confidențialitate sau pentru a vă exercita drepturile, contactați-ne la:
              </p>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm sm:text-base text-foreground font-medium">MVA Imobiliare SRL</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Email: contact@mvaimobiliare.ro</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Telefon: 0767 941 512</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Adresă: București, România</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Website: https://mvaimobiliare.ro</p>
              </div>
            </section>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ExtensionPrivacyPolicy;
