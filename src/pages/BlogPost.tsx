import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, User, ArrowLeft, ArrowRight, Clock, Home, TrendingUp, Lightbulb, PiggyBank, Scale, Building2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const blogPosts: Record<string, {
  title: string;
  date: string;
  author: string;
  category: string;
  categoryId: string;
  readTime: string;
  content: string;
}> = {
  "ghidul-complet-cumparare-proprietate": {
    title: "Ghidul Complet pentru Cumpărarea unei Proprietăți în București",
    date: "15 Octombrie 2025",
    author: "Viorel Miulet",
    category: "Ghiduri",
    categoryId: "ghiduri",
    readTime: "8 min",
    content: `
      <h2>Introducere</h2>
      <p>Cumpărarea unei proprietăți este una dintre cele mai importante decizii financiare din viața oricărei persoane. În București, piața imobiliară este dinamică și oferă numeroase oportunități, dar procesul poate părea copleșitor pentru cumpărătorii la prima casă. Nu-ți face griji - suntem aici să te ghidăm pas cu pas!</p>

      <h2>1. Stabilirea Bugetului</h2>
      <p>Primul pas esențial este să vă evaluați capacitatea financiară realistă. Luați în considerare:</p>
      <ul>
        <li><strong>Avansul:</strong> De obicei 15-20% din valoarea proprietății</li>
        <li><strong>Rata lunară:</strong> Nu ar trebui să depășească 40% din venitul net lunar</li>
        <li><strong>Costuri suplimentare:</strong> Notariat, comision agenție, taxe de transfer</li>
        <li><strong>Fond de rezervă:</strong> Pentru renovări și mobilare</li>
      </ul>

      <h2>2. Alegerea Zonei Potrivite</h2>
      <p>Locația este factorul cel mai important în valoarea pe termen lung a proprietății. Analizați cu atenție:</p>
      <ul>
        <li>Proximitatea față de locul de muncă</li>
        <li>Accesul la transport în comun</li>
        <li>Facilități în apropiere: școli, grădinițe, magazine, spitale</li>
        <li>Siguranța cartierului</li>
        <li>Potențialul de dezvoltare al zonei</li>
      </ul>

      <h2>3. Vizionarea Proprietăților</h2>
      <p>La vizionare, fiți atenți la detaliile importante:</p>
      <ul>
        <li>Starea structurii: pereți, tavan, fundație</li>
        <li>Instalații: electrică, sanitară, termică</li>
        <li>Orientarea față de punctele cardinale</li>
        <li>Izolația fonică și termică</li>
        <li>Vecinătățile și atmosfera blocului</li>
      </ul>

      <h2>4. Verificarea Documentelor</h2>
      <p>Documentele necesare pentru verificare includ (foarte important!):</p>
      <ul>
        <li>Actul de proprietate</li>
        <li>Certificatul de urbanism</li>
        <li>Extrasul de carte funciară actualizat</li>
        <li>Certificatul energetic</li>
        <li>Autorizația de construcție (pentru imobile noi)</li>
      </ul>

      <h2>5. Negocierea Prețului</h2>
      <p>Sfaturi pentru o negociere de succes:</p>
      <ul>
        <li>Informați-vă despre prețurile din zonă</li>
        <li>Identificați punctele slabe ale proprietății</li>
        <li>Faceți o ofertă realistă dar avantajoasă</li>
        <li>Fiți pregătiți să plecați dacă prețul nu este corect</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Procesul de cumpărare a unei proprietăți necesită timp, răbdare și atenție la detalii. Colaborarea cu o agenție imobiliară de încredere vă poate simplifica semnificativ procesul și vă poate proteja de posibile probleme. Noi suntem aici pentru tine!</p>
    `,
  },
  "tendinte-piata-imobiliara-2025": {
    title: "Tendințe pe Piața Imobiliară în 2025",
    date: "10 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "Piața Imobiliară",
    categoryId: "piata",
    readTime: "6 min",
    content: `
      <h2>Situația Actuală a Pieței Imobiliare</h2>
      <p>Piața imobiliară din București și Ilfov continuă să fie una dintre cele mai dinamice din Europa de Est. Anul 2025 aduce cu sine schimbări importante în comportamentul cumpărătorilor și în dinamica prețurilor.</p>

      <h2>Evoluția Prețurilor</h2>
      <p>În prima parte a anului 2025, am observat următoarele tendințe interesante:</p>
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
      <p>Cerințele au evoluat semnificativ în ultimul an:</p>
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
      <p>Ne așteptăm ca până la finalul lui 2025 să vedem:</p>
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
    categoryId: "sfaturi",
    readTime: "10 min",
    content: `
      <h2>Introducere</h2>
      <p>Prima impresie contează enorm când vine vorba de vânzarea unei proprietăți! O casă bine pregătită poate face diferența între o vânzare rapidă la un preț bun și luni de așteptare.</p>

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
      <p>Investiția de timp și bani în pregătirea casei pentru vânzare se întoarce de obicei sub formă de preț mai bun și vânzare mai rapidă. O casă bine pregătită demonstrează că a fost îngrijită și valorificată corect. Succes!</p>
    `,
  },
  "investitii-imobiliare-ghid": {
    title: "Investiții Imobiliare: Ce Trebuie să Știi Înainte să Începi",
    date: "1 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "Investiții",
    categoryId: "investitii",
    readTime: "12 min",
    content: `
      <h2>De Ce Investiții Imobiliare?</h2>
      <p>Investițiile imobiliare rămân una dintre cele mai sigure și profitabile modalități de a-ți construi averea pe termen lung! Spre deosebire de alte forme de investiții, proprietățile imobiliare oferă venit pasiv constant și protecție împotriva inflației.</p>

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
        <li>Vorbiți cu experți și investitori experimentați</li>
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
      <p>Investițiile imobiliare pot fi extrem de profitabile dacă sunt făcute corect! Educația, răbdarea și o analiză atentă sunt cheia succesului. Începeți mic, învățați din experiență și extindeți-vă portofoliul gradual.</p>

      <p><strong>Nu uitați!</strong> Consultați întotdeauna profesioniști - agenți imobiliari, avocați, contabili - înainte de a face investiții majore. Noi suntem aici pentru tine!</p>
    `,
  },
  "prima-casa-vs-credit-standard": {
    title: "Prima Casă vs Credit Standard: Care Este Mai Avantajos în 2025?",
    date: "28 Septembrie 2025",
    author: "MVA Imobiliare",
    category: "Legal & Financiar",
    categoryId: "legal",
    readTime: "7 min",
    content: `
      <h2>Introducere</h2>
      <p>Alegerea între programul Prima Casă și un credit ipotecar standard este una dintre cele mai importante decizii financiare pentru cumpărătorii de locuințe. În acest articol, analizăm detaliat ambele opțiuni pentru a vă ajuta să luați cea mai bună decizie.</p>

      <h2>Programul Prima Casă 2025</h2>
      
      <h3>Ce Este Prima Casă?</h3>
      <p>Prima Casă este un program guvernamental care oferă garanții de stat pentru creditele ipotecare, permițând achiziția de locuințe cu condiții avantajoase.</p>

      <h3>Avantaje Prima Casă</h3>
      <ul>
        <li><strong>Avans redus:</strong> Doar 5% pentru locuințe noi, 15% pentru locuințe vechi</li>
        <li><strong>Dobânzi subvenționate:</strong> De regulă mai mici decât la creditele standard</li>
        <li><strong>Garanție de stat:</strong> Până la 50% din valoarea creditului</li>
        <li><strong>Accesibil:</strong> Pentru persoane cu venituri mai mici</li>
      </ul>

      <h3>Dezavantaje Prima Casă</h3>
      <ul>
        <li><strong>Plafon de preț:</strong> Maxim 70.000€ pentru apartamente, 140.000€ pentru case</li>
        <li><strong>Restricții la vânzare:</strong> 5 ani perioadă de restricție</li>
        <li><strong>Nu puteți deține altă locuință</strong></li>
        <li><strong>Procedură mai lungă</strong> de aprobare</li>
      </ul>

      <h2>Credit Ipotecar Standard</h2>
      
      <h3>Avantaje Credit Standard</h3>
      <ul>
        <li><strong>Fără restricții de preț:</strong> Puteți cumpăra orice locuință</li>
        <li><strong>Flexibilitate:</strong> Puteți deține mai multe proprietăți</li>
        <li><strong>Fără restricții la vânzare</strong></li>
        <li><strong>Proces mai rapid</strong> de aprobare</li>
      </ul>

      <h3>Dezavantaje Credit Standard</h3>
      <ul>
        <li><strong>Avans mai mare:</strong> Minim 15-25% din valoarea proprietății</li>
        <li><strong>Dobânzi potențial mai mari</strong></li>
        <li><strong>Criterii mai stricte</strong> de eligibilitate</li>
      </ul>

      <h2>Comparație Detaliată</h2>
      
      <h3>Exemplu Practic: Apartament 100.000€</h3>
      
      <h4>Prima Casă</h4>
      <ul>
        <li>Avans: 5.000€ (5%)</li>
        <li>Credit: 95.000€</li>
        <li>Dobândă medie: 5,5%</li>
        <li>Rată lunară (30 ani): ~539€</li>
      </ul>

      <h4>Credit Standard</h4>
      <ul>
        <li>Avans: 20.000€ (20%)</li>
        <li>Credit: 80.000€</li>
        <li>Dobândă medie: 7%</li>
        <li>Rată lunară (30 ani): ~532€</li>
      </ul>

      <h2>Când Să Alegi Prima Casă?</h2>
      <ul>
        <li>Nu aveți economii mari pentru avans</li>
        <li>Este prima voastră locuință</li>
        <li>Bugetul se încadrează în plafoanele programului</li>
        <li>Nu planificați să vindeți în următorii 5 ani</li>
      </ul>

      <h2>Când Să Alegi Credit Standard?</h2>
      <ul>
        <li>Aveți economii substanțiale pentru avans</li>
        <li>Doriți o proprietate peste plafoanele Prima Casă</li>
        <li>Dețineți deja o locuință</li>
        <li>Doriți flexibilitate în gestionarea proprietății</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Alegerea depinde de situația voastră financiară și obiectivele pe termen lung. Prima Casă este ideală pentru tineri la primul apartament cu economii limitate. Creditul standard oferă mai multă flexibilitate pentru cei cu bugete mai mari sau care doresc proprietăți premium.</p>

      <p>Recomandăm să consultați un specialist financiar și să comparați ofertele de la mai multe bănci înainte de a lua o decizie. Contactați-ne pentru consultanță gratuită!</p>
    `,
  },
  "complexe-rezidentiale-nord-bucuresti": {
    title: "Top 5 Complexe Rezidențiale din Nordul Bucureștiului în 2025",
    date: "25 Septembrie 2025",
    author: "Viorel Miulet",
    category: "Complexe Noi",
    categoryId: "complexe",
    readTime: "9 min",
    content: `
      <h2>Introducere</h2>
      <p>Nordul Bucureștiului continuă să fie zona preferată pentru dezvoltări rezidențiale premium. În 2025, piața oferă proiecte diverse, de la apartamente accesibile până la rezidențe de lux. Hai să explorăm cele mai interesante opțiuni!</p>

      <h2>De Ce Nordul Bucureștiului?</h2>
      <ul>
        <li><strong>Infrastructură modernă:</strong> Drumuri noi, acces rapid la aeroport</li>
        <li><strong>Zone verzi:</strong> Parcuri și păduri în apropiere</li>
        <li><strong>Centre de afaceri:</strong> Proximitate față de zonele de birouri</li>
        <li><strong>Școli internaționale:</strong> Opțiuni educaționale premium</li>
        <li><strong>Apreciere constantă:</strong> Valoarea proprietăților crește anual</li>
      </ul>

      <h2>Zonele Premium</h2>

      <h3>1. Pipera</h3>
      <p>Zona tradițional de lux a Bucureștiului, cu:</p>
      <ul>
        <li>Prețuri: 2.200-3.500 €/mp</li>
        <li>Acces rapid la metrou și DN1</li>
        <li>Complexe cu facilități complete</li>
        <li>Cerere mare din partea expatriaților</li>
      </ul>

      <h3>2. Băneasa</h3>
      <p>Combinație unică de natură și lux:</p>
      <ul>
        <li>Prețuri: 2.000-3.000 €/mp</li>
        <li>Proximitate față de Pădurea Băneasa</li>
        <li>Complexe rezidențiale exclusiviste</li>
        <li>Atmosferă liniștită, departe de agitația urbană</li>
      </ul>

      <h3>3. Voluntari</h3>
      <p>Zona în plină expansiune:</p>
      <ul>
        <li>Prețuri: 1.600-2.200 €/mp</li>
        <li>Dezvoltări noi cu finisaje moderne</li>
        <li>Raport excelent calitate-preț</li>
        <li>Potențial mare de apreciere</li>
      </ul>

      <h3>4. Corbeanca</h3>
      <p>Liniște și spațiu verde:</p>
      <ul>
        <li>Prețuri: 1.400-1.800 €/mp</li>
        <li>Ideal pentru familii cu copii</li>
        <li>Case și vile cu grădini</li>
        <li>Comunități rezidențiale închise</li>
      </ul>

      <h3>5. Otopeni</h3>
      <p>Proximitate aeroport și DN1:</p>
      <ul>
        <li>Prețuri: 1.500-2.000 €/mp</li>
        <li>Acces rapid la aeroport Otopeni</li>
        <li>Infrastructură în dezvoltare</li>
        <li>Potrivit pentru cei care călătoresc frecvent</li>
      </ul>

      <h2>Ce Să Cauți la un Complex Nou</h2>
      <ul>
        <li><strong>Reputația dezvoltatorului:</strong> Verificați proiectele anterioare</li>
        <li><strong>Calitatea finisajelor:</strong> Materiale și execuție</li>
        <li><strong>Facilități:</strong> Parcări, spații verzi, sală fitness</li>
        <li><strong>Termene de livrare:</strong> Istoric de respectare a termenelor</li>
        <li><strong>Documentație:</strong> Autorizații complete și conforme</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Nordul Bucureștiului oferă opțiuni pentru toate bugetele și stilurile de viață. Fie că alegeți Pipera pentru lux și accesibilitate, sau Voluntari pentru valoare, zona rămâne cea mai dinamică din punct de vedere imobiliar.</p>

      <p>Contactați-ne pentru a vizita cele mai noi complexe rezidențiale din zonă!</p>
    `,
  },
  "erori-cumparatori-prima-casa": {
    title: "7 Greșeli Frecvente ale Cumpărătorilor la Prima Casă",
    date: "20 Septembrie 2025",
    author: "Viorel Miulet",
    category: "Ghiduri",
    categoryId: "ghiduri",
    readTime: "6 min",
    content: `
      <h2>Introducere</h2>
      <p>Cumpărarea primei case este o experiență emoționantă, dar și plină de capcane pentru cei neexperimentați. În acest articol, vă prezentăm cele mai frecvente greșeli și cum să le evitați.</p>

      <h2>Greșeala 1: Nu Vă Cunoașteți Bugetul Real</h2>
      <p>Mulți cumpărători subestimează costurile totale ale achiziției.</p>
      <h3>Costuri de luat în calcul:</h3>
      <ul>
        <li>Avans: 5-25% din preț</li>
        <li>Taxe notariale: 1-2%</li>
        <li>Comision agenție: 2-3%</li>
        <li>Renovări și mobilare</li>
        <li>Fond de urgență: 3-6 luni de cheltuieli</li>
      </ul>

      <h2>Greșeala 2: Ignorarea Costurilor Lunare</h2>
      <p>Rata creditului nu este singura cheltuială:</p>
      <ul>
        <li>Întreținere: 100-300€/lună</li>
        <li>Utilități: 100-200€/lună</li>
        <li>Impozit local anual</li>
        <li>Asigurare obligatorie</li>
        <li>Reparații neprevăzute</li>
      </ul>

      <h2>Greșeala 3: Neglijarea Locației</h2>
      <p>Te îndrăgostești de apartament, nu de zonă:</p>
      <ul>
        <li>Verificați traficul în orele de vârf</li>
        <li>Explorați cartierul seara și în weekend</li>
        <li>Verificați vecinii și atmosfera blocului</li>
        <li>Căutați planuri de dezvoltare urbană</li>
      </ul>

      <h2>Greșeala 4: Omiterea Inspecției Tehnice</h2>
      <p>Probleme ascunse pot costa mii de euro:</p>
      <ul>
        <li>Angajați un inspector profesionist</li>
        <li>Verificați instalațiile electrice și sanitare</li>
        <li>Căutați semne de umezeală sau mucegai</li>
        <li>Testați ferestrele și ușile</li>
      </ul>

      <h2>Greșeala 5: Nu Negociați Prețul</h2>
      <p>Prețul de listă nu este întotdeauna final:</p>
      <ul>
        <li>Cercetați prețurile din zonă</li>
        <li>Identificați probleme pentru negociere</li>
        <li>Nu vă temeți să faceți o ofertă mai mică</li>
        <li>Negociați și includerea mobilierului</li>
      </ul>

      <h2>Greșeala 6: Luarea Deciziilor Emoționale</h2>
      <p>Entuziasmul poate duce la alegeri greșite:</p>
      <ul>
        <li>Vizitați minimum 10 proprietăți</li>
        <li>Nu luați decizia la prima vizionare</li>
        <li>Discutați cu familia și prietenii</li>
        <li>Faceți o listă pro/contra</li>
      </ul>

      <h2>Greșeala 7: Neglijarea Documentației</h2>
      <p>Actele incomplete pot bloca tranzacția:</p>
      <ul>
        <li>Verificați cartea funciară actualizată</li>
        <li>Asigurați-vă că nu există sarcini</li>
        <li>Verificați autorizațiile de construcție</li>
        <li>Consultați un avocat specializat</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Evitarea acestor greșeli vă poate economisi timp, bani și stres. Colaborarea cu profesioniști experimentați - agenți imobiliari, avocați, consultanți financiari - este cea mai bună protecție împotriva capcanelor pieței imobiliare.</p>

      <p>Contactați-ne pentru o consultanță gratuită și personalizată!</p>
    `,
  },
  "verificarea-actelor-proprietate": {
    title: "Cum Verifici Actele unei Proprietăți: Ghid Complet",
    date: "15 Septembrie 2025",
    author: "MVA Imobiliare",
    category: "Legal & Financiar",
    categoryId: "legal",
    readTime: "11 min",
    content: `
      <h2>Introducere</h2>
      <p>Verificarea documentelor este unul dintre cei mai importanți pași în procesul de achiziție imobiliară. O verificare superficială poate duce la probleme juridice grave și pierderi financiare semnificative.</p>

      <h2>Documente Esențiale</h2>

      <h3>1. Extrasul de Carte Funciară</h3>
      <p>Documentul fundamental care atestă proprietatea:</p>
      <ul>
        <li><strong>Partea I:</strong> Descrierea imobilului (suprafață, adresă)</li>
        <li><strong>Partea II:</strong> Proprietarii și drepturile de proprietate</li>
        <li><strong>Partea III:</strong> Sarcini, ipoteci, servituți</li>
      </ul>
      <p><strong>Atenție:</strong> Extrasul trebuie să fie de cel mult 30 de zile!</p>

      <h3>2. Actul de Proprietate</h3>
      <p>Poate fi:</p>
      <ul>
        <li>Contract de vânzare-cumpărare</li>
        <li>Contract de donație</li>
        <li>Certificat de moștenitor</li>
        <li>Hotărâre judecătorească</li>
        <li>Contract de schimb</li>
      </ul>

      <h3>3. Certificatul de Urbanism</h3>
      <p>Arată ce se poate construi/modifica pe teren:</p>
      <ul>
        <li>Regimul economic</li>
        <li>Regimul tehnic</li>
        <li>Regimul juridic</li>
      </ul>

      <h3>4. Autorizația de Construire</h3>
      <p>Pentru imobile noi sau modificate:</p>
      <ul>
        <li>Verificați că există și este valabilă</li>
        <li>Comparați cu construcția reală</li>
        <li>Verificați procesul verbal de recepție</li>
      </ul>

      <h3>5. Certificatul Energetic</h3>
      <p>Obligatoriu pentru tranzacții:</p>
      <ul>
        <li>Clasă energetică A-G</li>
        <li>Consumuri estimate</li>
        <li>Recomandări de îmbunătățire</li>
      </ul>

      <h2>Verificări Suplimentare</h2>

      <h3>La Asociația de Proprietari</h3>
      <ul>
        <li>Datorii la întreținere</li>
        <li>Fond de reparații</li>
        <li>Probleme în bloc</li>
        <li>Planuri de renovare</li>
      </ul>

      <h3>La ANAF</h3>
      <ul>
        <li>Datorii fiscale ale vânzătorului</li>
        <li>Impozit pe proprietate achitat</li>
      </ul>

      <h3>La Primărie</h3>
      <ul>
        <li>Planuri urbanistice în zonă</li>
        <li>Drumuri sau construcții planificate</li>
        <li>Zone protejate</li>
      </ul>

      <h2>Semnale de Alarmă</h2>
      <ul>
        <li><strong>Prețuri prea mici:</strong> Pot indica probleme juridice</li>
        <li><strong>Urgență în vânzare:</strong> Verificați de ce</li>
        <li><strong>Documente lipsă:</strong> Nu continuați fără ele</li>
        <li><strong>Neconcordanțe:</strong> Între acte și realitate</li>
        <li><strong>Mai mulți proprietari:</strong> Toți trebuie să semneze</li>
      </ul>

      <h2>Rolul Notarului</h2>
      <p>Notarul verifică și autentifică, dar nu înlocuiește verificarea proprie:</p>
      <ul>
        <li>Verifică identitatea părților</li>
        <li>Verifică dreptul de proprietate</li>
        <li>Întocmește actul de vânzare-cumpărare</li>
        <li>Înscrie în cartea funciară</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Investiția în verificarea documentelor vă protejează de pierderi mult mai mari ulterior. Recomandăm întotdeauna colaborarea cu un avocat specializat în tranzacții imobiliare, mai ales pentru achiziții importante.</p>

      <p>Echipa noastră vă poate pune în legătură cu specialiști de încredere. Contactați-ne!</p>
    `,
  },
  "chirii-vs-cumparare-2025": {
    title: "Chirie vs Cumpărare: Ce Este Mai Rentabil în 2025?",
    date: "10 Septembrie 2025",
    author: "MVA Imobiliare",
    category: "Investiții",
    categoryId: "investitii",
    readTime: "8 min",
    content: `
      <h2>Introducere</h2>
      <p>Dezbaterea între chirie și cumpărare este veșnică. În 2025, cu dobânzile și prețurile actuale, răspunsul depinde de situația individuală. Să analizăm în detaliu!</p>

      <h2>Avantajele Chiriei</h2>
      <ul>
        <li><strong>Flexibilitate:</strong> Poți să te muți oricând</li>
        <li><strong>Fără avans mare:</strong> Doar garanția (2-3 luni)</li>
        <li><strong>Fără riscuri de proprietar:</strong> Reparațiile majore nu sunt pe tine</li>
        <li><strong>Lichiditate:</strong> Banii rămân disponibili pentru alte investiții</li>
        <li><strong>Fără costuri de întreținere:</strong> Impozite, reparații, asigurări</li>
      </ul>

      <h2>Dezavantajele Chiriei</h2>
      <ul>
        <li><strong>Bani "pierduți":</strong> Nu construiești echitate</li>
        <li><strong>Instabilitate:</strong> Proprietarul poate cere evacuarea</li>
        <li><strong>Creșteri de preț:</strong> Chiria poate crește anual</li>
        <li><strong>Limitări:</strong> Nu poți modifica locuința</li>
      </ul>

      <h2>Avantajele Cumpărării</h2>
      <ul>
        <li><strong>Echitate:</strong> Fiecare rată îți aparține</li>
        <li><strong>Stabilitate:</strong> Este casa ta</li>
        <li><strong>Apreciere:</strong> Valoarea crește în timp</li>
        <li><strong>Libertate:</strong> Modifici cum vrei</li>
        <li><strong>Moștenire:</strong> Lași ceva generațiilor viitoare</li>
      </ul>

      <h2>Dezavantajele Cumpărării</h2>
      <ul>
        <li><strong>Avans mare:</strong> 15-25% din valoare</li>
        <li><strong>Responsabilitate:</strong> Toate reparațiile sunt ale tale</li>
        <li><strong>Costuri ascunse:</strong> Întreținere, impozite, asigurări</li>
        <li><strong>Imobilitate:</strong> Greu de mutat pentru job sau familie</li>
        <li><strong>Risc de piață:</strong> Valoarea poate scădea</li>
      </ul>

      <h2>Calculul Financiar</h2>

      <h3>Exemplu: Apartament 100.000€ în București</h3>

      <h4>Varianta Chirie</h4>
      <ul>
        <li>Chirie lunară: 600€</li>
        <li>Cost anual: 7.200€</li>
        <li>Cost pe 30 ani: 216.000€</li>
        <li>Plus: economii din avans investite</li>
      </ul>

      <h4>Varianta Cumpărare</h4>
      <ul>
        <li>Avans (20%): 20.000€</li>
        <li>Credit 80.000€ la 7% pe 30 ani</li>
        <li>Rată lunară: ~532€</li>
        <li>Total plătit: ~192.000€ + avans</li>
        <li>Plus: dobânzi ~112.000€</li>
        <li>Minus: proprietate în valoare de ~150.000€+ (apreciere)</li>
      </ul>

      <h2>Când Să Alegi Chiria?</h2>
      <ul>
        <li>Nu ai economii pentru avans</li>
        <li>Jobul necesită mobilitate</li>
        <li>Nu știi unde vrei să locuiești pe termen lung</li>
        <li>Ai alte investiții mai profitabile</li>
        <li>Piața este supraevaluată</li>
      </ul>

      <h2>Când Să Alegi Cumpărarea?</h2>
      <ul>
        <li>Ai stabilitate financiară și profesională</li>
        <li>Poți acoperi avansul confortabil</li>
        <li>Planifici să locuiești în zonă 5+ ani</li>
        <li>Rata este comparabilă cu chiria</li>
        <li>Vrei să construiești avere pe termen lung</li>
      </ul>

      <h2>Concluzie</h2>
      <p>În 2025, pentru majoritatea românilor care plănuiesc să rămână în aceeași locație 5+ ani, cumpărarea rămâne mai avantajoasă pe termen lung. Chiria este ideală pentru flexibilitate și situații temporare.</p>

      <p>Contactați-ne pentru o analiză personalizată a situației voastre!</p>
    `,
  },
  "negocierea-pretului-imobiliar": {
    title: "Arta Negocierii: Cum Obții Cel Mai Bun Preț la Cumpărare",
    date: "5 Septembrie 2025",
    author: "Viorel Miulet",
    category: "Sfaturi",
    categoryId: "sfaturi",
    readTime: "7 min",
    content: `
      <h2>Introducere</h2>
      <p>Negocierea prețului poate economisi mii sau zeci de mii de euro. În acest articol, vă împărtășim strategiile folosite de profesioniști pentru a obține cel mai bun preț.</p>

      <h2>Pregătirea Este Esențială</h2>

      <h3>1. Cercetarea Pieței</h3>
      <ul>
        <li>Verificați prețurile recente din zonă</li>
        <li>Comparați proprietăți similare</li>
        <li>Înțelegeți tendințele pieței</li>
        <li>Cunoașteți prețul pe metru pătrat în zonă</li>
      </ul>

      <h3>2. Cunoașterea Vânzătorului</h3>
      <ul>
        <li>De cât timp este pe piață proprietatea?</li>
        <li>Care este motivația vânzării?</li>
        <li>Cât de urgent trebuie să vândă?</li>
        <li>Au existat alte oferte?</li>
      </ul>

      <h2>Strategii de Negociere</h2>

      <h3>1. Prima Ofertă</h3>
      <ul>
        <li>Nu oferiți niciodată prețul cerut inițial</li>
        <li>Începeți cu 10-15% sub prețul cerut</li>
        <li>Justificați oferta cu date concrete</li>
        <li>Arătați că sunteți pregătit să cumpărați</li>
      </ul>

      <h3>2. Identificați Punctele Slabe</h3>
      <ul>
        <li>Renovări necesare</li>
        <li>Probleme structurale minore</li>
        <li>Finisaje învechite</li>
        <li>Orientare nefavorabilă</li>
        <li>Zgomot sau vecini problematici</li>
      </ul>

      <h3>3. Folosiți Timpul în Favoarea Voastră</h3>
      <ul>
        <li>Nu arătați că sunteți grăbiți</li>
        <li>Proprietățile vechi pe piață au marja mai mare</li>
        <li>Sfârșitul lunii/anului poate aduce reduceri</li>
        <li>Iarna este de obicei mai favorabilă cumpărătorilor</li>
      </ul>

      <h3>4. Negociați Mai Mult Decât Prețul</h3>
      <ul>
        <li>Mobilier și electrocasnice incluse</li>
        <li>Termenul de predare</li>
        <li>Reparații înainte de predare</li>
        <li>Plata în rate a avansului</li>
      </ul>

      <h2>Greșeli de Evitat</h2>
      <ul>
        <li><strong>Arătarea entuziasmului excesiv</strong></li>
        <li><strong>Dezvăluirea bugetului maxim</strong></li>
        <li><strong>Negocierea agresivă</strong> - poate închide ușile</li>
        <li><strong>Ignorarea pierderii</strong> - știți când să plecați</li>
        <li><strong>Negocierea fără pregătire</strong></li>
      </ul>

      <h2>Când Să Acceptați Prețul</h2>
      <ul>
        <li>Proprietatea este sub prețul pieței</li>
        <li>Sunt alți cumpărători interesați</li>
        <li>Prețul este deja negociat semnificativ</li>
        <li>Proprietatea este exact ce căutați</li>
      </ul>

      <h2>Rolul Agentului Imobiliar</h2>
      <p>Un agent experimentat poate:</p>
      <ul>
        <li>Negocia în numele vostru obiectiv</li>
        <li>Cunoaște tactici de negociere avansate</li>
        <li>Are informații despre piață și vânzător</li>
        <li>Menține relația profesională chiar la negocieri dure</li>
      </ul>

      <h2>Concluzie</h2>
      <p>Negocierea este o artă care se învață. Cu pregătire, răbdare și strategia potrivită, puteți economisi sume semnificative. Nu vă fie teamă să negociați - este o parte normală a procesului de cumpărare!</p>

      <p>Contactați-ne pentru a beneficia de experiența noastră în negocieri imobiliare!</p>
    `,
  },
};

const relatedPosts = [
  { slug: "ghidul-complet-cumparare-proprietate", title: "Ghidul Complet pentru Cumpărarea unei Proprietăți" },
  { slug: "tendinte-piata-imobiliara-2025", title: "Tendințe pe Piața Imobiliară în 2025" },
  { slug: "investitii-imobiliare-ghid", title: "Investiții Imobiliare: Ce Trebuie să Știi" },
  { slug: "prima-casa-vs-credit-standard", title: "Prima Casă vs Credit Standard" },
];

const getCategoryIcon = (categoryId: string) => {
  const icons: Record<string, typeof Home> = {
    ghiduri: Home,
    piata: TrendingUp,
    sfaturi: Lightbulb,
    investitii: PiggyBank,
    legal: Scale,
    complexe: Building2,
  };
  return icons[categoryId] || Home;
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogPosts[slug] : null;

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

  const CategoryIcon = getCategoryIcon(post.categoryId);

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.title,
    "image": "https://mvaimobiliare.ro/mva-logo-luxury.svg",
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "MVA Imobiliare",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mvaimobiliare.ro/mva-logo-luxury.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://mvaimobiliare.ro/blog/${slug}`
    }
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Acasă",
        "item": "https://mvaimobiliare.ro/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://mvaimobiliare.ro/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://mvaimobiliare.ro/blog/${slug}`
      }
    ]
  };

  // Get other posts for recommendations (excluding current)
  const otherPosts = relatedPosts.filter(p => p.slug !== slug).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{post.title} | MVA Imobiliare Blog</title>
        <meta name="description" content={post.title} />
        <meta name="keywords" content="imobiliare, ghid, sfaturi, București, proprietăți" />
        <link rel="canonical" href={`https://mvaimobiliare.ro/blog/${slug}`} />
        
        <meta property="og:title" content={`${post.title} | MVA Imobiliare`} />
        <meta property="og:description" content={post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://mvaimobiliare.ro/blog/${slug}`} />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={post.title} />
        <meta name="twitter:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />

        <script type="application/ld+json">
          {JSON.stringify(articleStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <article className="py-8 sm:py-12 bg-background">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-foreground transition-colors">Acasă</Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                <span>/</span>
                <span className="text-foreground truncate">{post.title}</span>
              </nav>

              {/* Back Button */}
              <Link to="/blog" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" />
                <span>Înapoi la Blog</span>
              </Link>

              {/* Article Header */}
              <header className="mb-8">
                <Badge className="mb-4 bg-gold/20 text-gold border-gold/30 hover:bg-gold/30">
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {post.category}
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} citire</span>
                  </div>
                </div>
              </header>

              {/* Article Content */}
              <div 
                className="prose prose-lg max-w-none dark:prose-invert
                  prose-headings:text-foreground prose-headings:font-bold
                  prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                  prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:my-4 prose-ul:pl-6
                  prose-li:text-muted-foreground prose-li:mb-2
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-a:text-gold prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* CTA Section */}
              <div className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl border border-gold/20">
                <h3 className="text-xl font-bold mb-3">Ai nevoie de ajutor?</h3>
                <p className="text-muted-foreground mb-4">
                  Echipa noastră de specialiști este aici să te ghideze în procesul de cumpărare sau vânzare a proprietății tale.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/#contact">
                    <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">
                      Contactează-ne
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/proprietati">
                    <Button variant="outline">
                      Vezi Proprietăți
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Related Articles */}
              {otherPosts.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold mb-6">Articole Similare</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {otherPosts.map((relatedPost) => (
                      <Link key={relatedPost.slug} to={`/blog/${relatedPost.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-all hover:border-gold/50">
                          <CardHeader className="p-4">
                            <CardTitle className="text-base line-clamp-2 group-hover:text-gold transition-colors">
                              {relatedPost.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <span className="text-gold text-sm flex items-center gap-1">
                              Citește
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;