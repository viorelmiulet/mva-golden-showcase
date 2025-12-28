import jsPDF from 'jspdf';
import { replaceDiacritics } from '@/lib/utils';
import {
  createPdfContext,
  addSectionTitle,
  addParagraph,
  addPageFooter,
  formatDateRomanian,
  type PdfContext
} from './contractPdfUtils';

interface SiteSettings {
  companyName?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
}

// Add signature with image
const addSignatureWithImage = (
  ctx: PdfContext,
  leftLabel: string,
  rightLabel: string,
  leftName: string,
  rightName: string,
  leftSignature?: string | null,
  rightSignature?: string | null
): void => {
  if (ctx.y > 200) {
    ctx.doc.addPage();
    ctx.y = 30;
  }
  ctx.y += 15;
  
  const signatureWidth = 50;
  const signatureHeight = 25;
  
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text(leftLabel, ctx.margin, ctx.y);
  ctx.doc.text(rightLabel, ctx.pageWidth - ctx.margin - 40, ctx.y);
  ctx.y += 8;
  
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(replaceDiacritics(leftName), ctx.margin, ctx.y);
  ctx.doc.text(replaceDiacritics(rightName), ctx.pageWidth - ctx.margin - 60, ctx.y);
  ctx.y += 15;
  
  if (leftSignature) {
    try {
      ctx.doc.addImage(leftSignature, 'PNG', ctx.margin, ctx.y, signatureWidth, signatureHeight);
    } catch (e) {
      console.error('Error adding left signature:', e);
      ctx.doc.text("_______________", ctx.margin, ctx.y + 10);
    }
  } else {
    ctx.doc.text("_______________", ctx.margin, ctx.y + 10);
  }
  
  if (rightSignature) {
    try {
      ctx.doc.addImage(rightSignature, 'PNG', ctx.pageWidth - ctx.margin - signatureWidth, ctx.y, signatureWidth, signatureHeight);
    } catch (e) {
      console.error('Error adding right signature:', e);
      ctx.doc.text("_______________", ctx.pageWidth - ctx.margin - 40, ctx.y + 10);
    }
  } else {
    ctx.doc.text("_______________", ctx.pageWidth - ctx.margin - 40, ctx.y + 10);
  }
};

// ==================== COMODAT CONTRACT PDF ====================
export interface ComodatContractData {
  id: string;
  contract_date: string;
  comodant_name: string;
  comodant_prenume: string | null;
  comodant_cnp: string | null;
  comodant_seria_ci: string | null;
  comodant_numar_ci: string | null;
  comodant_ci_emitent: string | null;
  comodant_ci_data_emiterii: string | null;
  comodant_adresa: string | null;
  comodant_phone: string | null;
  comodant_email: string | null;
  comodant_signature: string | null;
  comodant_signed_at: string | null;
  comodatar_name: string;
  comodatar_prenume: string | null;
  comodatar_cnp: string | null;
  comodatar_seria_ci: string | null;
  comodatar_numar_ci: string | null;
  comodatar_ci_emitent: string | null;
  comodatar_ci_data_emiterii: string | null;
  comodatar_adresa: string | null;
  comodatar_phone: string | null;
  comodatar_email: string | null;
  comodatar_signature: string | null;
  comodatar_signed_at: string | null;
  property_address: string;
  property_type: string | null;
  property_surface: number | null;
  property_rooms: number | null;
  property_features: string | null;
  duration_months: number | null;
  start_date: string | null;
  purpose: string | null;
}

export const generateComodatContractPdf = (
  contract: ComodatContractData,
  siteSettings?: SiteSettings
): jsPDF => {
  const ctx = createPdfContext();
  
  // Title
  ctx.doc.setFontSize(16);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("CONTRACT DE COMODAT", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 8;
  
  if (contract.comodant_signed_at || contract.comodatar_signed_at) {
    ctx.doc.setFontSize(10);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.text("(Semnat electronic)", ctx.pageWidth / 2, ctx.y, { align: "center" });
    ctx.y += 8;
  }
  
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)}`, ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 15;

  // Parties
  addSectionTitle(ctx, "I. PARTILE CONTRACTANTE");
  addParagraph(ctx, `1.1. COMODANT: ${contract.comodant_prenume || ''} ${contract.comodant_name}`);
  addParagraph(ctx, `CNP: ${contract.comodant_cnp || '-'}, CI seria ${contract.comodant_seria_ci || '-'} nr. ${contract.comodant_numar_ci || '-'}`);
  addParagraph(ctx, `Domiciliu: ${contract.comodant_adresa || '-'}`);
  ctx.y += 5;
  addParagraph(ctx, `1.2. COMODATAR: ${contract.comodatar_prenume || ''} ${contract.comodatar_name}`);
  addParagraph(ctx, `CNP: ${contract.comodatar_cnp || '-'}, CI seria ${contract.comodatar_seria_ci || '-'} nr. ${contract.comodatar_numar_ci || '-'}`);
  addParagraph(ctx, `Domiciliu: ${contract.comodatar_adresa || '-'}`);

  // Object
  addSectionTitle(ctx, "II. OBIECTUL CONTRACTULUI");
  const propertyDesc = [
    contract.property_type || 'Imobil',
    contract.property_surface ? `${contract.property_surface} mp` : '',
    contract.property_rooms ? `${contract.property_rooms} camere` : ''
  ].filter(Boolean).join(', ');
  addParagraph(ctx, `Comodantul transmite comodatarului, cu titlu gratuit, dreptul de folosinta asupra imobilului situat in ${contract.property_address}.`);
  addParagraph(ctx, `Descriere: ${propertyDesc}`);
  if (contract.property_features) {
    addParagraph(ctx, `Dotari: ${contract.property_features}`);
  }

  // Duration
  addSectionTitle(ctx, "III. DURATA CONTRACTULUI");
  addParagraph(ctx, `Contractul se incheie pe o perioada de ${contract.duration_months || 12} luni, incepand cu data de ${formatDateRomanian(contract.start_date || contract.contract_date)}.`);

  // Purpose
  if (contract.purpose) {
    addSectionTitle(ctx, "IV. DESTINATIA");
    addParagraph(ctx, `Imobilul va fi folosit in scopul: ${contract.purpose}`);
  }

  // Obligations
  addSectionTitle(ctx, "V. OBLIGATIILE PARTILOR");
  addParagraph(ctx, "Comodantul se obliga:");
  addParagraph(ctx, "- sa predea imobilul in stare corespunzatoare folosintei");
  addParagraph(ctx, "- sa garanteze comodatarul impotriva evictiunii");
  ctx.y += 3;
  addParagraph(ctx, "Comodatarul se obliga:");
  addParagraph(ctx, "- sa conserve si sa intretina bunul ca un bun proprietar");
  addParagraph(ctx, "- sa foloseasca bunul conform destinatiei stabilite");
  addParagraph(ctx, "- sa restituie bunul la incetarea contractului in starea in care l-a primit");

  // Termination
  addSectionTitle(ctx, "VI. INCETAREA CONTRACTULUI");
  addParagraph(ctx, "Contractul inceteaza prin: expirarea termenului, rezilierea de comun acord, denuntare unilaterala cu preaviz de 30 zile.");

  // Final
  addSectionTitle(ctx, "VII. DISPOZITII FINALE");
  addParagraph(ctx, "Prezentul contract s-a incheiat in 2 exemplare, cate unul pentru fiecare parte.");

  // Signatures
  addSignatureWithImage(
    ctx,
    "COMODANT",
    "COMODATAR",
    `${contract.comodant_prenume || ''} ${contract.comodant_name}`,
    `${contract.comodatar_prenume || ''} ${contract.comodatar_name}`,
    contract.comodant_signature,
    contract.comodatar_signature
  );

  // Footer
  if (siteSettings) {
    addPageFooter(
      ctx,
      siteSettings.companyName || 'MVA Imobiliare',
      siteSettings.phone || '+40 757 117 442',
      siteSettings.email || 'contact@mvaimobiliare.ro',
      siteSettings.websiteUrl || 'www.mvaimobiliare.ro'
    );
  }

  return ctx.doc;
};

// ==================== EXCLUSIVE CONTRACT PDF ====================
export interface ExclusiveContractData {
  id: string;
  contract_date: string;
  beneficiary_name: string;
  beneficiary_prenume: string | null;
  beneficiary_cnp: string | null;
  beneficiary_seria_ci: string | null;
  beneficiary_numar_ci: string | null;
  beneficiary_ci_emitent: string | null;
  beneficiary_ci_data_emiterii: string | null;
  beneficiary_adresa: string | null;
  beneficiary_phone: string | null;
  beneficiary_email: string | null;
  beneficiary_signature: string | null;
  beneficiary_signed_at: string | null;
  agent_signature: string | null;
  agent_signed_at: string | null;
  property_address: string;
  property_type: string | null;
  property_surface: number | null;
  property_land_surface: number | null;
  property_rooms: number | null;
  property_features: string | null;
  sales_price: number | null;
  currency: string | null;
  commission_percent: number | null;
  duration_months: number | null;
}

export const generateExclusiveContractPdf = (
  contract: ExclusiveContractData,
  siteSettings?: SiteSettings
): jsPDF => {
  const ctx = createPdfContext();
  const currency = contract.currency || 'EUR';
  
  // Title
  ctx.doc.setFontSize(16);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("CONTRACT DE REPREZENTARE EXCLUSIVA", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 8;
  
  if (contract.beneficiary_signed_at || contract.agent_signed_at) {
    ctx.doc.setFontSize(10);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.text("(Semnat electronic)", ctx.pageWidth / 2, ctx.y, { align: "center" });
    ctx.y += 8;
  }
  
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)}`, ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 15;

  // Parties
  addSectionTitle(ctx, "I. PARTILE CONTRACTANTE");
  addParagraph(ctx, `1.1. BENEFICIAR (Vanzator): ${contract.beneficiary_prenume || ''} ${contract.beneficiary_name}`);
  addParagraph(ctx, `CNP: ${contract.beneficiary_cnp || '-'}, CI seria ${contract.beneficiary_seria_ci || '-'} nr. ${contract.beneficiary_numar_ci || '-'}`);
  addParagraph(ctx, `Domiciliu: ${contract.beneficiary_adresa || '-'}`);
  if (contract.beneficiary_phone) addParagraph(ctx, `Telefon: ${contract.beneficiary_phone}`);
  ctx.y += 5;
  addParagraph(ctx, `1.2. PRESTATOR: MVA Imobiliare SRL`);
  addParagraph(ctx, `CUI: RO12345678, J40/1234/2020`);
  addParagraph(ctx, `Reprezentant: Agent imobiliar autorizat`);

  // Object
  addSectionTitle(ctx, "II. OBIECTUL CONTRACTULUI");
  addParagraph(ctx, `Beneficiarul acorda prestatorului dreptul exclusiv de a intermedia vanzarea imobilului situat in ${contract.property_address}.`);
  const propertyDesc = [
    contract.property_type || 'Imobil',
    contract.property_surface ? `suprafata utila ${contract.property_surface} mp` : '',
    contract.property_land_surface ? `teren ${contract.property_land_surface} mp` : '',
    contract.property_rooms ? `${contract.property_rooms} camere` : ''
  ].filter(Boolean).join(', ');
  addParagraph(ctx, `Descriere: ${propertyDesc}`);
  if (contract.property_features) {
    addParagraph(ctx, `Dotari/Caracteristici: ${contract.property_features}`);
  }

  // Price
  addSectionTitle(ctx, "III. PRETUL DE VANZARE");
  addParagraph(ctx, `Pretul de vanzare solicitat: ${contract.sales_price?.toLocaleString() || 'De stabilit'} ${currency}`);

  // Commission
  addSectionTitle(ctx, "IV. COMISIONUL");
  addParagraph(ctx, `Comisionul prestatorului este de ${contract.commission_percent || 3}% din pretul final de vanzare.`);
  addParagraph(ctx, "Comisionul este datorat la momentul perfectarii tranzactiei si se achita la semnarea actului de vanzare-cumparare.");

  // Duration
  addSectionTitle(ctx, "V. DURATA CONTRACTULUI");
  addParagraph(ctx, `Contractul se incheie pe o perioada de ${contract.duration_months || 6} luni de la data semnarii.`);
  addParagraph(ctx, "Contractul se poate prelungi cu acordul scris al ambelor parti.");

  // Obligations
  addSectionTitle(ctx, "VI. OBLIGATIILE PARTILOR");
  addParagraph(ctx, "Prestatorul se obliga:");
  addParagraph(ctx, "- sa promoveze imobilul pe toate canalele disponibile");
  addParagraph(ctx, "- sa organizeze vizionari cu potentiali cumparatori");
  addParagraph(ctx, "- sa asiste beneficiarul in procesul de negociere");
  addParagraph(ctx, "- sa asigure suport juridic pana la finalizarea tranzactiei");
  ctx.y += 3;
  addParagraph(ctx, "Beneficiarul se obliga:");
  addParagraph(ctx, "- sa permita accesul pentru vizionari");
  addParagraph(ctx, "- sa nu contracteze cu alte agentii imobiliare pe durata contractului");
  addParagraph(ctx, "- sa achite comisionul la incheierea tranzactiei");

  // Termination
  addSectionTitle(ctx, "VII. INCETAREA CONTRACTULUI");
  addParagraph(ctx, "Contractul inceteaza prin: expirarea termenului, incheierea tranzactiei, rezilierea de comun acord.");

  // Final
  addSectionTitle(ctx, "VIII. DISPOZITII FINALE");
  addParagraph(ctx, "Prezentul contract s-a incheiat in 2 exemplare, cate unul pentru fiecare parte.");

  // Signatures
  addSignatureWithImage(
    ctx,
    "BENEFICIAR",
    "PRESTATOR",
    `${contract.beneficiary_prenume || ''} ${contract.beneficiary_name}`,
    "MVA Imobiliare",
    contract.beneficiary_signature,
    contract.agent_signature
  );

  // Footer
  if (siteSettings) {
    addPageFooter(
      ctx,
      siteSettings.companyName || 'MVA Imobiliare',
      siteSettings.phone || '+40 757 117 442',
      siteSettings.email || 'contact@mvaimobiliare.ro',
      siteSettings.websiteUrl || 'www.mvaimobiliare.ro'
    );
  }

  return ctx.doc;
};

// ==================== INTERMEDIATION CONTRACT PDF ====================
export interface IntermediationContractData {
  id: string;
  contract_date: string;
  client_name: string;
  client_prenume: string | null;
  client_cnp: string | null;
  client_seria_ci: string | null;
  client_numar_ci: string | null;
  client_ci_emitent: string | null;
  client_ci_data_emiterii: string | null;
  client_adresa: string | null;
  property_address: string; // Used for search criteria
  duration_months: number | null;
  proprietar_signed: boolean | null;
  chirias_signed: boolean | null;
}

export const generateIntermediationContractPdf = (
  contract: IntermediationContractData,
  clientSignature?: string | null,
  agentSignature?: string | null,
  siteSettings?: SiteSettings
): jsPDF => {
  const ctx = createPdfContext();
  
  // Title
  ctx.doc.setFontSize(16);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("CONTRACT DE INTERMEDIERE IMOBILIARA", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 8;
  
  if (contract.chirias_signed || contract.proprietar_signed) {
    ctx.doc.setFontSize(10);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.text("(Semnat electronic)", ctx.pageWidth / 2, ctx.y, { align: "center" });
    ctx.y += 8;
  }
  
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)}`, ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 15;

  // Parties
  addSectionTitle(ctx, "I. PARTILE CONTRACTANTE");
  addParagraph(ctx, `1.1. CLIENT: ${contract.client_prenume || ''} ${contract.client_name}`);
  addParagraph(ctx, `CNP: ${contract.client_cnp || '-'}, CI seria ${contract.client_seria_ci || '-'} nr. ${contract.client_numar_ci || '-'}`);
  addParagraph(ctx, `Domiciliu: ${contract.client_adresa || '-'}`);
  ctx.y += 5;
  addParagraph(ctx, `1.2. INTERMEDIAR: MVA Imobiliare SRL`);
  addParagraph(ctx, `CUI: RO12345678, J40/1234/2020`);
  addParagraph(ctx, `Reprezentant: Agent imobiliar autorizat`);

  // Object
  addSectionTitle(ctx, "II. OBIECTUL CONTRACTULUI");
  addParagraph(ctx, "Intermediarul se obliga sa identifice si sa prezinte clientului imobile care corespund criteriilor de cautare stabilite.");
  
  addSectionTitle(ctx, "III. CRITERII DE CAUTARE");
  addParagraph(ctx, contract.property_address || "Conform discutiilor purtate cu clientul");

  // Duration
  addSectionTitle(ctx, "IV. DURATA CONTRACTULUI");
  addParagraph(ctx, `Contractul se incheie pe o perioada de ${contract.duration_months || 3} luni de la data semnarii.`);

  // Services
  addSectionTitle(ctx, "V. SERVICIILE OFERITE");
  addParagraph(ctx, "Intermediarul va oferi urmatoarele servicii:");
  addParagraph(ctx, "- Identificarea imobilelor conform criteriilor");
  addParagraph(ctx, "- Organizarea vizionarilor");
  addParagraph(ctx, "- Asistenta in negociere");
  addParagraph(ctx, "- Suport in procesul de achizitie");

  // Obligations
  addSectionTitle(ctx, "VI. OBLIGATIILE PARTILOR");
  addParagraph(ctx, "Clientul se obliga:");
  addParagraph(ctx, "- sa participe la vizionarile programate");
  addParagraph(ctx, "- sa informeze intermediarul despre orice tranzactie directa");
  addParagraph(ctx, "- sa achite comisionul convenit la incheierea tranzactiei");
  ctx.y += 3;
  addParagraph(ctx, "Intermediarul se obliga:");
  addParagraph(ctx, "- sa caute activ imobile conform criteriilor");
  addParagraph(ctx, "- sa informeze clientul despre ofertele disponibile");
  addParagraph(ctx, "- sa asiste clientul pana la finalizarea achizitiei");

  // Final
  addSectionTitle(ctx, "VII. DISPOZITII FINALE");
  addParagraph(ctx, "Prezentul contract s-a incheiat in 2 exemplare, cate unul pentru fiecare parte.");

  // Signatures
  addSignatureWithImage(
    ctx,
    "CLIENT",
    "INTERMEDIAR",
    `${contract.client_prenume || ''} ${contract.client_name}`,
    "MVA Imobiliare",
    clientSignature,
    agentSignature
  );

  // Footer
  if (siteSettings) {
    addPageFooter(
      ctx,
      siteSettings.companyName || 'MVA Imobiliare',
      siteSettings.phone || '+40 757 117 442',
      siteSettings.email || 'contact@mvaimobiliare.ro',
      siteSettings.websiteUrl || 'www.mvaimobiliare.ro'
    );
  }

  return ctx.doc;
};
