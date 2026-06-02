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
];
