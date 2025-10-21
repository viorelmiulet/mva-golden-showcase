import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const blogPosts = {
  "ghidul-complet-cumparare-proprietate": {
    title: "Ghidul Complet pentru Cumpărarea unei Proprietăți în București",
    date: "15 Octombrie 2025",
    author: "Viorel Miulet",
    category: "Ghiduri",
    content: `
      <h2>Introducere</h2>
      <p>Cumpărarea unei proprietăți este una dintre cele mai importante decizii financiare din viața oricărei persoane. În București, piața imobiliară este dinamică și oferă numeroase oportunități, dar procesul poate părea copleșitor pentru cumpărătorii la prima casă.</p>

      <h2>1. Stabilirea Bugetului</h2>
      <p>Primul pas esențial este să vă evaluați capacitatea financiară realistă. Luați în considerare:</p>
      <ul>
        <li><strong>Avansul:</strong> De obicei 15-20% din valoarea proprietății</li>
        <li><strong>Rata lunară:</strong> Nu ar trebui să depășească 40% din venitul net lunar</li>
        <li><strong>Costuri suplimentare:</strong> Notariat, comision agenție, taxe de transfer</li>
        <li><strong>Fond de rezervă:</strong> Pentru renovări și mobilare</li>
      </ul>

      <h2>2. Alegerea Zonei Potrivite</h2>
      <p>Locația este factorul cel mai important în valoarea pe termen lung a proprietății. Analizați:</p>
      <ul>
        <li>Proximitatea față de locul de muncă</li>
        <li>Accesul la transport în comun</li>
        <li>Facilități în apropiere: școli, grădinițe, magazine, spitale</li>
        <li>Siguranța cartierului</li>
        <li>Potențialul de dezvoltare al zonei</li>
      </ul>

      <h2>3. Vizionarea Proprietăților</h2>
      <p>La vizionare, fiți atenți la:</p>
      <ul>
        <li>Starea structurii: pereți, tavan, fundație</li>
        <li>Instalații: electrică, sanitară, termică</li>
        <li>Orientarea față de punctele cardinale</li>
        <li>Izolația fonică și termică</li>
        <li>Vecinătățile și atmosfera blocului</li>
      </ul>

      <h2>4. Verificarea Documentelor</h2>
      <p>Documentele necesare pentru verificare includ:</p>
      <ul>
        <li>Actul de proprietate</li>
        <li>Certificatul de urbanism</li>
        <li>Extrasul de carte funciară actualizat</li>
        <li>Certificatul energetic</li>
        <li>Autorizația de construcție (pentru imobile noi)</li>
      </ul>

      <h2>5. Negocierea Prețului</h2>
      <p>Sfaturi pentru negociere:</p>
      <ul>
        <li>Informați-vă despre prețurile din zonă</li>
        <li>Identificați punctele slabe ale proprietății</li>
        <li>Faceți o ofertă realistă dar avantajoasă</li>
        <li>Fiți pregătiți să plecați dacă prețul nu este corect</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Procesul de cumpărare a unei proprietăți necesită timp, răbdare și atenție la detalii. Colaborarea cu o agenție imobiliară de încredere vă poate simplifica semnificativ procesul și vă poate proteja de posibile probleme.</p>
    `,
  },
  "tendinte-piata-imobiliara-2025": {
    title: "Tendințe pe Piața Imobiliară în 2025",
    date: "10 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "Piața Imobiliară",
    content: `
      <h2>Situația Actuală a Pieței Imobiliare</h2>
      <p>Piața imobiliară din București și Ilfov continuă să fie una dintre cele mai dinamice din Europa de Est. Anul 2025 aduce cu sine schimbări importante în comportamentul cumpărătorilor și în dinamica prețurilor.</p>

      <h2>Evoluția Prețurilor</h2>
      <p>În prima parte a anului 2025, am observat următoarele tendințe:</p>
      <ul>
        <li><strong>Sectorul 1:</strong> Prețuri medii de 2.200-2.800 €/mp pentru apartamente noi</li>
        <li><strong>Sectorul 3:</strong> Creștere de 8% față de 2024, prețuri de 1.900-2.300 €/mp</li>
        <li><strong>Sectorul 4:</strong> Cel mai accesibil, cu prețuri de 1.600-2.000 €/mp</li>
        <li><strong>Ilfov:</strong> Zonele limitrofe Bucureștiului sunt în plină expansiune</li>
      </ul>

      <h2>Zonele în Dezvoltare</h2>
      <p>Zonele care înregistrează cel mai mare interes în 2025:</p>
      <ul>
        <li><strong>Voluntari:</strong> Creștere explozivă datorită infrastructurii moderne</li>
        <li><strong>Pipera:</strong> Rămâne zona premium a Bucureștiului</li>
        <li><strong>Drumul Taberei:</strong> Beneficiază de metrou și investiții în infrastructură</li>
        <li><strong>Băneasa:</strong> Zona verde cu dezvoltări rezidențiale de lux</li>
      </ul>

      <h2>Preferințele Cumpărătorilor</h2>
      <p>Cerințele au evoluat semnificativ:</p>
      <ul>
        <li>Spații de lucru dedicate (home office)</li>
        <li>Balcoane și terase generoase</li>
        <li>Sisteme de climatizare</li>
        <li>Parcări subterane</li>
        <li>Facilități în complex: sală fitness, spații verzi</li>
      </ul>

      <h2>Finanțare și Credite</h2>
      <p>Condițiile de creditare în 2025:</p>
      <ul>
        <li>Dobânzi în scădere ușoară față de 2024</li>
        <li>Programe guvernamentale pentru prima casă</li>
        <li>Creșterea perioadei de creditare (până la 35-40 ani)</li>
      </ul>

      <h2>Predicții pentru Finalul Anului</h2>
      <p>Ne așteptăm ca până la finalul lui 2025:</p>
      <ul>
        <li>Stabilizarea prețurilor în zonele centrale</li>
        <li>Creștere continuă în zonele periferice</li>
        <li>Dezvoltarea de noi proiecte în Ilfov</li>
        <li>Creșterea cererii pentru proprietăți eco-friendly</li>
      </ul>
    `,
  },
  "pregatirea-casei-pentru-vanzare": {
    title: "Cum Pregătești Casa pentru Vânzare: 10 Sfaturi Esențiale",
    date: "5 Octombrie 2025",
    author: "Viorel Miulet",
    category: "Sfaturi",
    content: `
      <h2>Introducere</h2>
      <p>Prima impresie contează enorm când vine vorba de vânzarea unei proprietăți. O casă bine pregătită poate face diferența între o vânzare rapidă la un preț bun și luni de așteptare.</p>

      <h2>1. Curățenie Generală Profundă</h2>
      <p>Începeți cu o curățenie completă a întregii case:</p>
      <ul>
        <li>Spălați toate ferestrele și oglinzile</li>
        <li>Curățați covoarele și tapițeria</li>
        <li>Igienizați grupurile sanitare</li>
        <li>Eliminați praful de pe toate suprafețele</li>
        <li>Curățați balcoanele și terasele</li>
      </ul>

      <h2>2. Declutter - Eliminați Dezordinea</h2>
      <p>O casă aerisită pare mai mare și mai primitor:</p>
      <ul>
        <li>Eliminați obiectele personale în exces</li>
        <li>Goliți parțial dulapurile</li>
        <li>Organizați spațiile de depozitare</li>
        <li>Donați sau aruncați lucrurile neutilizate</li>
      </ul>

      <h2>3. Reparații Minore</h2>
      <p>Rezolvați problemele mici care pot crea o impresie negativă:</p>
      <ul>
        <li>Robinetele care picură</li>
        <li>Mânerele stricate</li>
        <li>Fisurile în pereți</li>
        <li>Becurile arse</li>
        <li>Prizele defecte</li>
      </ul>

      <h2>4. Vopsea Proaspătă</h2>
      <p>O vopsea nouă poate transforma complet aspectul casei:</p>
      <ul>
        <li>Alegeți culori neutre și luminoase</li>
        <li>Alb, bej, gri deschis sunt sigure</li>
        <li>Vopsiți tavanele pentru un efect de prospețime</li>
        <li>Nu uitați de băi și bucătărie</li>
      </ul>

      <h2>5. Îmbunătățirea Iluminatului</h2>
      <p>Lumina face casa să pară mai mare și mai primitoare:</p>
      <ul>
        <li>Înlocuiți becurile cu unele mai puternice</li>
        <li>Curățați corpurile de iluminat</li>
        <li>Deschideți draperiile la vizionări</li>
        <li>Adăugați lămpi suplimentare în colțurile întunecate</li>
      </ul>

      <h2>6. Curb Appeal - Prima Impresie Contează</h2>
      <p>Exteriorul este prima vedere a cumpărătorului:</p>
      <ul>
        <li>Întreținerea gazonului și plantelor</li>
        <li>Curățarea aleilor și intrării</li>
        <li>Vopsirea sau curățarea ușii de intrare</li>
        <li>Adăugarea de ghivece cu flori</li>
      </ul>

      <h2>7. Neutralizarea Mirosurilor</h2>
      <p>Mirosurile pot fi un factor decisiv:</p>
      <ul>
        <li>Aerisiți casa zilnic</li>
        <li>Eliminați mirosurile de animale</li>
        <li>Evitați parfumurile puternice</li>
        <li>Folosiți difuzoare discrete cu arome neutre</li>
      </ul>

      <h2>8. Staging - Aranjarea Mobilierului</h2>
      <p>Prezentați casa în cea mai bună lumină:</p>
      <ul>
        <li>Aranjați mobila pentru a maximiza spațiul</li>
        <li>Creați zone funcționale clare</li>
        <li>Adăugați perne și accesorii decorative</li>
        <li>Evidențiați punctele forte ale fiecărei camere</li>
      </ul>

      <h2>9. Fotografii Profesionale</h2>
      <p>Majoritatea cumpărătorilor văd anunțul online mai întâi:</p>
      <ul>
        <li>Angajați un fotograf profesionist</li>
        <li>Fotografiați în timpul zilei cu lumină naturală</li>
        <li>Includeți imagini din toate camerele</li>
        <li>Faceți și fotografii exterioarelor</li>
      </ul>

      <h2>10. Flexibilitate la Vizionări</h2>
      <p>Cu cât mai mulți cumpărători potențiali, cu atât mai bine:</p>
      <ul>
        <li>Fiți disponibili pentru vizionări și în weekend</li>
        <li>Mențineți casa curată permanent</li>
        <li>Plecați din casă în timpul vizionărilor</li>
        <li>Lăsați agenția să gestioneze procesul</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Investiția de timp și bani în pregătirea casei pentru vânzare se întoarce de obicei sub formă de preț mai bun și vânzare mai rapidă. O casă bine pregătită demonstrează că a fost îngrijită și valorificată corect.</p>
    `,
  },
  "investitii-imobiliare-ghid": {
    title: "Investiții Imobiliare: Ce Trebuie să Știi Înainte să Începi",
    date: "1 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "Investiții",
    content: `
      <h2>De Ce Investiții Imobiliare?</h2>
      <p>Investițiile imobiliare rămân una dintre cele mai sigure și profitabile modalități de a-ți construi averea pe termen lung. Spre deosebire de alte forme de investiții, proprietățile imobiliare oferă venit pasiv constant și protecție împotriva inflației.</p>

      <h2>Tipuri de Investiții Imobiliare</h2>
      
      <h3>1. Buy-to-Let (Cumpără pentru Închiriere)</h3>
      <ul>
        <li><strong>Venit lunar constant</strong> din chirie</li>
        <li><strong>Rentabilitate:</strong> 5-8% anual în București</li>
        <li><strong>Ideal pentru:</strong> Investitori care doresc venit pasiv</li>
      </ul>

      <h3>2. Flip (Renovează și Vinde)</h3>
      <ul>
        <li><strong>Profit rapid</strong> din revânzare</li>
        <li><strong>Rentabilitate:</strong> 15-30% per proiect</li>
        <li><strong>Ideal pentru:</strong> Investitori activi cu experiență în renovări</li>
      </ul>

      <h3>3. Investiții în Ansambluri Rezidențiale Noi</h3>
      <ul>
        <li><strong>Apreciere</strong> în valoare pe măsură ce proiectul se finalizează</li>
        <li><strong>Rentabilitate:</strong> 10-20% până la predare</li>
        <li><strong>Ideal pentru:</strong> Investitori pe termen mediu</li>
      </ul>

      <h2>Calcularea Rentabilității</h2>
      
      <h3>Formula Rentabilității Brute</h3>
      <p><code>ROI = (Venit anual din chirie / Investiția totală) x 100</code></p>
      
      <h3>Exemplu Practic</h3>
      <ul>
        <li>Preț achiziție: 100.000 €</li>
        <li>Costuri achiziție (taxe, comision): 5.000 €</li>
        <li>Renovări: 10.000 €</li>
        <li>Investiție totală: 115.000 €</li>
        <li>Chirie lunară: 600 €</li>
        <li>Venit anual: 7.200 €</li>
        <li><strong>ROI brut: 6.26%</strong></li>
      </ul>

      <h2>Zonele Cele Mai Profitabile în București</h2>
      
      <h3>Pentru Închiriere</h3>
      <ul>
        <li><strong>Sectorul 1:</strong> Chirii mari, cerere constantă</li>
        <li><strong>Sectorul 6:</strong> Zona Politehnica - studenți și tineri profesioniști</li>
        <li><strong>Pipera-Băneasa:</strong> Expatriați și executivi</li>
      </ul>

      <h3>Pentru Apreciere în Valoare</h3>
      <ul>
        <li><strong>Ilfov:</strong> Zone în dezvoltare lângă București</li>
        <li><strong>Drumul Taberei:</strong> Beneficiază de metrou nou</li>
        <li><strong>Militari:</strong> Cartier în transformare</li>
      </ul>

      <h2>Riscuri și Cum să le Eviți</h2>
      
      <h3>Risc 1: Perioade de Neocupare</h3>
      <p><strong>Soluție:</strong> Alegeți zone cu cerere mare constantă și prețuri competitive.</p>

      <h3>Risc 2: Chiriași Problematici</h3>
      <p><strong>Soluție:</strong> Verificați atent potențialii chiriași, solicitați garanții și contracte clare.</p>

      <h3>Risc 3: Cheltuieli Neașteptate</h3>
      <p><strong>Soluție:</strong> Păstrați un fond de rezervă de 10-15% din investiție.</p>

      <h3>Risc 4: Lichiditate Scăzută</h3>
      <p><strong>Soluție:</strong> Nu investiți bani de care ați putea avea nevoie urgent.</p>

      <h2>Sfaturi pentru Începători</h2>
      
      <h3>1. Începeți cu Cercetare Amănunțită</h3>
      <ul>
        <li>Studiați piața timp de minimum 3-6 luni</li>
        <li>Vizitați multe proprietăți</li>
        <li>Vorbesc cu experți și investitori experimentați</li>
      </ul>

      <h3>2. Calculați Tot</h3>
      <ul>
        <li>Nu uitați de taxe, comisioane, renovări</li>
        <li>Includeți întreținerea anuală</li>
        <li>Considerați și perioadele de neocupare</li>
      </ul>

      <h3>3. Locație, Locație, Locație</h3>
      <ul>
        <li>Proximitatea față de transport</li>
        <li>Facilități în zonă</li>
        <li>Siguranța cartierului</li>
        <li>Potențial de dezvoltare</li>
      </ul>

      <h3>4. Nu vă Supraîndatorați</h3>
      <ul>
        <li>Păstrați un raport sănătos datorie/venit</li>
        <li>Asigurați-vă că puteți acoperi rata și în perioade dificile</li>
        <li>Diversificați investițiile</li>
      </ul>

      <h2>Aspecte Fiscale</h2>
      <p>În România, veniturile din chirii sunt impozitate cu:</p>
      <ul>
        <li><strong>Impozit pe venit:</strong> 10% din venitul brut</li>
        <li><strong>CAS:</strong> 25% (pentru venituri peste plafonul anual)</li>
        <li><strong>CASS:</strong> 10% (pentru venituri peste plafonul anual)</li>
        <li><strong>Impozit pe profit vânzare:</strong> 3% din valoarea tranzacției (sub 3 ani)</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Investițiile imobiliare pot fi extrem de profitabile dacă sunt făcute corect. Educația, răbdarea și o analiză atentă sunt cheia succesului. Începeți mic, învățați din experiență și extindeți-vă portofoliul gradual.</p>

      <p><strong>Nu uitați:</strong> Consultați întotdeauna profesioniști - agenți imobiliari, avocați, contabili - înainte de a face investiții majore.</p>
    `,
  },
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogPosts[slug as keyof typeof blogPosts] : null;

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Articol negăsit</h1>
            <Link to="/blog">
              <Button>Înapoi la Blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | MVA Imobiliare Blog</title>
        <meta name="description" content={post.title} />
        <link rel="canonical" href={`https://mvaimobiliare.ro/blog/${slug}`} />
        
        <meta property="og:title" content={`${post.title} | MVA Imobiliare Blog`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://mvaimobiliare.ro/blog/${slug}`} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <article className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link to="/blog">
                <Button variant="ghost" className="mb-8">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Înapoi la Blog
                </Button>
              </Link>

              <div className="mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-gold/10 text-gold text-sm mb-4">
                  {post.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  {post.title}
                </h1>
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </div>

              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-bold mb-4">Ai întrebări despre piața imobiliară?</h3>
                <p className="text-muted-foreground mb-6">
                  Echipa MVA Imobiliare este aici să te ajute cu sfaturi personalizate.
                </p>
                <Link to="/">
                  <Button variant="luxury">
                    Contactează-ne
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;
