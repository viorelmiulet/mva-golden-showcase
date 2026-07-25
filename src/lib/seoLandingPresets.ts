import type { SeoLandingPreset } from "@/pages/SeoLanding";

export const seoLandingPresets: SeoLandingPreset[] = [
  {
    slug: "apartamente-de-vanzare",
    h1: "Apartamente de vânzare în București",
    title: "Apartamente de vânzare București | MVA Imobiliare",
    description:
      "Peste 100 de apartamente de vânzare în București și împrejurimi. Ofertă verificată direct de la dezvoltatori și proprietari, prețuri actualizate zilnic.",
    intro:
      "Descoperă cele mai noi apartamente de vânzare în București: garsoniere, 2, 3 sau 4 camere, în ansambluri rezidențiale noi sau zone consacrate. Echipa MVA Imobiliare te ajută cu vizionarea, negocierea și actele.",
    breadcrumb: "Apartamente de vânzare",
    filter: { propertyType: "apartment", transactionType: "sale" },
  },
  {
    slug: "case-de-vanzare",
    h1: "Case și vile de vânzare",
    title: "Case de vânzare București și împrejurimi | MVA Imobiliare",
    description:
      "Case și vile de vânzare în București, Ilfov și împrejurimi. Oferte verificate, vizionări la cerere, consultanță completă pentru cumpărători.",
    intro:
      "Vezi cele mai noi case și vile de vânzare. Proprietăți cu curte, garaj și utilități, în zone rezidențiale liniștite. Consultanții MVA te însoțesc la fiecare vizionare.",
    breadcrumb: "Case de vânzare",
    filter: { propertyType: "house", transactionType: "sale" },
  },
  {
    slug: "garsoniere-de-vanzare",
    h1: "Garsoniere de vânzare în București",
    title: "Garsoniere de vânzare București | MVA Imobiliare",
    description:
      "Garsoniere de vânzare în București, ideale pentru prima locuință sau investiție. Oferte cu prețuri actualizate, vizionări rapide.",
    intro:
      "Garsoniere de vânzare în blocuri noi și consacrate din București. Perfecte pentru tineri, studenți sau ca investiție pentru închiriere.",
    breadcrumb: "Garsoniere de vânzare",
    filter: { propertyType: "garsoniera", transactionType: "sale" },
  },
  {
    slug: "apartamente-2-camere",
    h1: "Apartamente cu 2 camere de vânzare",
    title: "Apartamente 2 camere de vânzare București | MVA Imobiliare",
    description:
      "Apartamente cu 2 camere de vânzare în București: decomandate, semidecomandate, în bloc nou sau zone consacrate. Prețuri actualizate zilnic.",
    intro:
      "Cele mai căutate apartamente cu 2 camere de vânzare în București. Ideal pentru cupluri tinere sau ca investiție.",
    breadcrumb: "Apartamente 2 camere",
    filter: { rooms: 2, propertyType: "apartment", transactionType: "sale" },
  },
  {
    slug: "apartamente-3-camere",
    h1: "Apartamente cu 3 camere de vânzare",
    title: "Apartamente 3 camere de vânzare București | MVA Imobiliare",
    description:
      "Apartamente cu 3 camere de vânzare în București, potrivite pentru familie. Oferte din ansambluri noi și zone consacrate, prețuri actualizate.",
    intro:
      "Apartamente cu 3 camere de vânzare în București. Perfecte pentru familii, cu suprafețe generoase și compartimentări moderne.",
    breadcrumb: "Apartamente 3 camere",
    filter: { rooms: 3, propertyType: "apartment", transactionType: "sale" },
  },
  {
    slug: "apartamente-4-camere",
    h1: "Apartamente cu 4 camere de vânzare",
    title: "Apartamente 4 camere de vânzare București | MVA Imobiliare",
    description:
      "Apartamente cu 4 camere de vânzare în București pentru familii numeroase. Suprafețe mari, finisaje premium, în blocuri noi.",
    intro:
      "Apartamente cu 4 camere de vânzare în București, ideale pentru familii numeroase, cu suprafețe generoase și mai multe băi.",
    breadcrumb: "Apartamente 4 camere",
    filter: { rooms: 4, propertyType: "apartment", transactionType: "sale" },
  },
  {
    slug: "apartamente-noi",
    h1: "Apartamente noi de vânzare în București",
    title: "Apartamente noi București - bloc nou, finisat la cheie | MVA Imobiliare",
    description:
      "Apartamente noi de vânzare în București, direct de la dezvoltatori. Bloc nou, finisat la cheie, garanție și plată în rate.",
    intro:
      "Apartamente noi de vânzare în București, în ansambluri rezidențiale moderne. Oferte direct de la dezvoltatori, cu finisaje la cheie și garanție.",
    breadcrumb: "Apartamente noi",
    filter: { propertyType: "apartment", transactionType: "sale", newBuild: true },
  },
  {
    slug: "apartamente-2-camere-militari",
    h1: "Apartamente cu 2 camere în Militari",
    title: "Apartamente 2 camere Militari București | MVA Imobiliare",
    description:
      "Apartamente cu 2 camere de vânzare în Militari, București. Ofertă verificată din ansambluri rezidențiale noi.",
    intro:
      "Apartamente cu 2 camere în zona Militari, una dintre cele mai dezvoltate zone din vestul Bucureștiului. Acces rapid la metrou și centre comerciale.",
    breadcrumb: "Apartamente 2 camere Militari",
    filter: { rooms: 2, propertyType: "apartment", transactionType: "sale", zone: "MILITARI" },
  },
  {
    slug: "apartamente-3-camere-militari",
    h1: "Apartamente cu 3 camere în Militari",
    title: "Apartamente 3 camere Militari București | MVA Imobiliare",
    description:
      "Apartamente cu 3 camere de vânzare în Militari, București. Ideal pentru familii, în ansambluri noi.",
    intro:
      "Apartamente cu 3 camere în zona Militari, pentru familii care caută confort și conexiuni rapide cu restul orașului.",
    breadcrumb: "Apartamente 3 camere Militari",
    filter: { rooms: 3, propertyType: "apartment", transactionType: "sale", zone: "MILITARI" },
  },
  {
    slug: "chirie-militari-residence",
    h1: "Apartamente de închiriat în Militari Residence",
    title: "Chirie Militari Residence - Apartamente de închiriat | MVA Imobiliare",
    description:
      "Apartamente de închiriat în Militari Residence: garsoniere, 2 și 3 camere, mobilate și utilate complet. Oferte verificate, prețuri actualizate, vizionări rapide.",
    intro:
      "Caută apartament de închiriat în Militari Residence, unul dintre cele mai mari ansambluri rezidențiale din vestul Bucureștiului. Oferim garsoniere și apartamente cu 2 sau 3 camere, mobilate modern, cu acces rapid la metroul Păcii, centre comerciale (AFI Cotroceni, Plaza România) și autostrada A1. Consultanții MVA Imobiliare te ajută cu vizionările și contractul de închiriere.",
    breadcrumb: "Chirie Militari Residence",
    filter: { transactionType: "rent", zone: "MILITARI RESIDENCE" },
  },
  {
    slug: "apartamente-de-inchiriat-militari",
    h1: "Apartamente de închiriat în Militari, București",
    title: "Apartamente de închiriat Militari București | MVA Imobiliare",
    description:
      "Apartamente de închiriat în zona Militari, București. Garsoniere, 2 și 3 camere, în blocuri noi și ansambluri rezidențiale. Prețuri actualizate zilnic.",
    intro:
      "Apartamente de închiriat în zona Militari, vestul Bucureștiului. Acces rapid la metrou, centre comerciale și autostrada A1. Oferim opțiuni pentru toate bugetele, de la garsoniere la apartamente cu 3 camere.",
    breadcrumb: "Apartamente de închiriat Militari",
    filter: { transactionType: "rent", zone: "MILITARI" },
  },
  {
    slug: "apartamente-de-vanzare-bucuresti",
    h1: "Apartamente de vânzare în București",
    title: "Apartamente de vânzare București - Oferte verificate | MVA Imobiliare",
    description:
      "Apartamente de vânzare în București: garsoniere, 2, 3 sau 4 camere, în ansambluri noi și zone consacrate. Prețuri actualizate zilnic, vizionări rapide.",
    intro:
      "Descoperă cea mai mare ofertă de apartamente de vânzare în București: blocuri noi, ansambluri rezidențiale moderne și locuințe în zone consacrate. Echipa MVA Imobiliare te ajută cu vizionarea, negocierea prețului și actele de vânzare-cumpărare.",
    breadcrumb: "Apartamente de vânzare București",
    filter: { propertyType: "apartment", transactionType: "sale", zone: "BUCURESTI" },
  },
  {
    slug: "case-de-vanzare-bucuresti",
    h1: "Case și vile de vânzare în București",
    title: "Case de vânzare București - Vile și case cu curte | MVA Imobiliare",
    description:
      "Case și vile de vânzare în București și Ilfov: cu curte, garaj și utilități, în zone rezidențiale liniștite. Oferte verificate, vizionări la cerere.",
    intro:
      "Caută casă sau vilă de vânzare în București și împrejurimi. Oferim case cu curte, garaj și toate utilitățile, în cartiere rezidențiale precum Pipera, Băneasa, Domnești, Otopeni sau Bragadiru. Consultanții MVA te însoțesc la fiecare vizionare.",
    breadcrumb: "Case de vânzare București",
    filter: { propertyType: "house", transactionType: "sale", zone: "BUCURESTI" },
  },
  {
    slug: "apartamente-drumul-taberei",
    h1: "Apartamente în Drumul Taberei",
    title: "Apartamente Drumul Taberei București | MVA Imobiliare",
    description:
      "Apartamente de vânzare și închiriere în Drumul Taberei: bloc vechi consolidat sau ansambluri noi, acces direct la metroul M5, prețuri corecte.",
    intro:
      "Drumul Taberei este unul dintre cele mai mature cartiere din vestul Bucureștiului: parcuri mari (Moghioroș, Parcul Drumul Taberei), școli și licee bine cotate și, din 2020, magistrala de metrou M5 care conectează zona direct cu centrul. Blocurile sunt în majoritate din anii ’70-’80, cu apartamente decomandate spațioase la prețuri mai accesibile decât în noile ansambluri, dar apar și proiecte rezidențiale moderne pe arterele Valea Oltului și Prelungirea Ghencea. Se potrivește familiilor care vor un cartier liniștit, cu multă verdeață și infrastructură completă, dar și investitorilor care caută randament stabil din închirieri către angajați din vestul orașului.",
    breadcrumb: "Apartamente Drumul Taberei",
    filter: {
      propertyType: "apartment",
      zones: ["DRUMUL TABEREI", "GHENCEA", "VALEA OLTULUI"],
    },
    relatedLinks: [
      { slug: "apartamente-sector-6", label: "Sector 6" },
      { slug: "apartamente-crangasi-giulesti", label: "Crângași & Giulești" },
      { slug: "apartamente-2-camere-militari", label: "2 camere Militari" },
    ],
  },
  {
    slug: "apartamente-crangasi-giulesti",
    h1: "Apartamente în Crângași și Giulești",
    title: "Apartamente Crângași Giulești București | MVA Imobiliare",
    description:
      "Apartamente de vânzare în Crângași și Giulești: acces rapid la metrou Crângași, lacul Morii și Podul Grant, ideal pentru navetiști și investiții.",
    intro:
      "Crângași și Giulești formează o zonă de tranziție între vestul și centrul Bucureștiului, foarte atractivă pentru cei care fac naveta zilnică: stația de metrou Crângași, tramvaiele 41 și 11 și podul Grant asigură conexiuni rapide către Piața Victoriei și centru. Lacul Morii oferă spațiu de recreere puțin întâlnit în restul orașului. Aici găsești atât apartamente în blocuri vechi bine întreținute, cu prețuri sub media Bucureștiului, cât și ansambluri noi apărute în ultimii ani pe Calea Giulești și Șoseaua Virtuții. Zona se potrivește tinerilor profesioniști care vor timp scurt de deplasare și investitorilor care caută randamente peste medie din chirii.",
    breadcrumb: "Apartamente Crângași & Giulești",
    filter: {
      propertyType: "apartment",
      zones: ["CRANGASI", "CRÂNGAȘI", "GIULESTI", "GIULEȘTI", "VIRTUTII", "VIRTUȚII"],
    },
    relatedLinks: [
      { slug: "apartamente-drumul-taberei", label: "Drumul Taberei" },
      { slug: "apartamente-sector-6", label: "Sector 6" },
      { slug: "apartamente-de-inchiriat-militari", label: "Închirieri Militari" },
    ],
  },
  {
    slug: "apartamente-titan-pantelimon",
    h1: "Apartamente în Titan și Pantelimon",
    title: "Apartamente Titan Pantelimon București | MVA Imobiliare",
    description:
      "Apartamente de vânzare în Titan și Pantelimon: parcul IOR, metrou M1 și M3, blocuri consolidate și ansambluri noi în estul Bucureștiului.",
    intro:
      "Titan și Pantelimon acoperă estul Bucureștiului cu o combinație puternică între infrastructură matură și dezvoltări noi. Parcul Alexandru Ioan Cuza (IOR) și Parcul Titan sunt printre cele mai mari spații verzi ale orașului, iar magistralele de metrou M1 (Titan, Costin Georgian) și M3 (Nicolae Teclu, Anghel Saligny) asigură acces rapid în tot Bucureștiul. Zona oferă apartamente în blocuri anii ’70-’80 la prețuri competitive și, în paralel, ansambluri rezidențiale noi pe Bulevardul Basarabia, Șoseaua Pantelimon și Fundeni. Se adresează familiilor care vor spațiu verde aproape, angajaților din zonele de birouri Barbu Văcărescu / Pipera cu conexiune bună la M1, și investitorilor.",
    breadcrumb: "Apartamente Titan & Pantelimon",
    filter: {
      propertyType: "apartment",
      zones: ["TITAN", "PANTELIMON", "IOR", "BASARABIA"],
    },
    relatedLinks: [
      { slug: "apartamente-berceni-giurgiului", label: "Berceni & Giurgiului" },
      { slug: "apartamente-tineretului-vacaresti", label: "Tineretului & Văcărești" },
      { slug: "apartamente-de-vanzare-bucuresti", label: "Toate apartamentele București" },
    ],
  },
  {
    slug: "apartamente-berceni-giurgiului",
    h1: "Apartamente în Berceni și Giurgiului",
    title: "Apartamente Berceni Giurgiului București | MVA Imobiliare",
    description:
      "Apartamente de vânzare în Berceni și pe Șoseaua Giurgiului: prețuri accesibile, metrou M2 extins până la Berceni, ansambluri rezidențiale noi.",
    intro:
      "Berceni și Giurgiului formează cea mai activă zonă de dezvoltare rezidențială din sudul Bucureștiului. Extinderea magistralei M2 până la stația Berceni și proximitatea față de A2 și centura sudică au atras zeci de ansambluri noi de mici și medii dimensiuni în ultimii ani. Prețul pe metru pătrat este printre cele mai accesibile din București pentru locuințe noi, ceea ce face zona atractivă atât pentru cei care își iau prima locuință, cât și pentru cei care caută randament din închiriere. În paralel, cartierele consacrate din jurul Șoselei Berceni și Giurgiului oferă apartamente în blocuri vechi cu prețuri și mai mici, în stare bună după consolidări.",
    breadcrumb: "Apartamente Berceni & Giurgiului",
    filter: {
      propertyType: "apartment",
      zones: ["BERCENI", "GIURGIULUI", "METALURGIEI", "OLTENITEI", "OLTENIȚEI", "POPESTI-LEORDENI", "POPEȘTI-LEORDENI"],
    },
    relatedLinks: [
      { slug: "apartamente-tineretului-vacaresti", label: "Tineretului & Văcărești" },
      { slug: "apartamente-titan-pantelimon", label: "Titan & Pantelimon" },
      { slug: "apartamente-noi", label: "Apartamente noi" },
    ],
  },
  {
    slug: "apartamente-tineretului-vacaresti",
    h1: "Apartamente în Tineretului și Văcărești",
    title: "Apartamente Tineretului Văcărești București | MVA Imobiliare",
    description:
      "Apartamente premium în Tineretului și Văcărești: parcul Tineretului, delta Văcărești, acces la M2, zonă rezidențială liniștită aproape de centru.",
    intro:
      "Tineretului și Văcărești sunt zone rezidențiale de calitate ridicată din sudul Bucureștiului, apreciate pentru apropierea de Parcul Tineretului și de Delta Văcărești — cea mai mare arie naturală urbană din țară. Accesul la metrou (stațiile Tineretului și Constantin Brâncoveanu, M2) plasează Piața Unirii la 5-10 minute. Fondul locativ combină blocuri consacrate bine întreținute cu ansambluri rezidențiale noi pe malul lacului Văcărești și Șoseaua Olteniței. Prețurile sunt mai mari decât în Berceni, dar mult mai accesibile decât în cartierele nordice, motiv pentru care zona atrage familii tinere, cupluri cu venituri medii-superioare și investitori care caută proprietăți cu potențial bun de apreciere.",
    breadcrumb: "Apartamente Tineretului & Văcărești",
    filter: {
      propertyType: "apartment",
      zones: ["TINERETULUI", "VACARESTI", "VĂCĂREȘTI", "TIMPURI NOI"],
    },
    relatedLinks: [
      { slug: "apartamente-berceni-giurgiului", label: "Berceni & Giurgiului" },
      { slug: "apartamente-titan-pantelimon", label: "Titan & Pantelimon" },
      { slug: "apartamente-de-vanzare-bucuresti", label: "Toate apartamentele București" },
    ],
  },
  {
    slug: "apartamente-sector-6",
    h1: "Apartamente în Sectorul 6 București",
    title: "Apartamente Sector 6 București | MVA Imobiliare",
    description:
      "Apartamente de vânzare în Sectorul 6 București: Militari, Drumul Taberei, Crângași, Ghencea. Ansambluri noi, metrou M1, M3 și M5, prețuri competitive.",
    intro:
      "Sectorul 6 este cel mai dinamic sector din vestul Capitalei și zona noastră de expertiză aprofundată. Cuprinde Militari, Drumul Taberei, Crângași, Ghencea și Prelungirea Ghencea, cu acces la trei magistrale de metrou (M1 Păcii, M3 Preciziei, M5 Drumul Taberei) și la autostrada A1. Oferta este cea mai variată din București: ansambluri rezidențiale mari precum Militari Residence, Cosmopolis West sau proiecte noi pe Prelungirea Ghencea, dar și blocuri consolidate din anii ’70-’80 la prețuri accesibile. Sectorul 6 se potrivește familiilor care vor un cartier cu școli, parcuri și centre comerciale (AFI Cotroceni, Plaza România, Cora Lujerului) și celor care fac naveta către centru sau vest.",
    breadcrumb: "Apartamente Sector 6",
    filter: {
      propertyType: "apartment",
      zones: ["SECTOR 6", "SECTOR6", "MILITARI", "DRUMUL TABEREI", "CRANGASI", "CRÂNGAȘI", "GHENCEA", "GIULESTI", "GIULEȘTI", "LUJERULUI", "GORJULUI", "PACII", "PĂCII"],
    },
    relatedLinks: [
      { slug: "apartamente-drumul-taberei", label: "Drumul Taberei" },
      { slug: "apartamente-crangasi-giulesti", label: "Crângași & Giulești" },
      { slug: "apartamente-2-camere-militari", label: "2 camere Militari" },
    ],
  },
];

