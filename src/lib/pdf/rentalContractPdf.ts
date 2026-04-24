import jsPDF from 'jspdf';
import { replaceDiacritics } from '@/lib/utils';
import type { ContractData, SavedContract, InventoryItem } from '@/types/contract';
import type { ContractClause } from '@/hooks/useContractClauses';
import {
  createPdfContext,
  addSectionTitle,
  addParagraph,
  drawPartyBox,
  addSignatureSection,
  addInventoryTable,
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

interface GeneratePdfOptions {
  contractData: ContractData;
  contractClauses: ContractClause[];
  inventoryItems: InventoryItem[];
  siteSettings?: SiteSettings;
  inventoryImageSize?: 'small' | 'medium' | 'large';
}

interface GenerateSignedPdfOptions {
  contract: SavedContract;
  contractClauses: ContractClause[];
  inventoryItems: InventoryItem[];
  proprietarSignature?: string | null;
  chiriasSignature?: string | null;
  siteSettings?: SiteSettings;
  inventoryImageSize?: 'small' | 'medium' | 'large';
}

// Add contract sections from clauses
const addContractSections = (
  ctx: PdfContext,
  contractClauses: ContractClause[],
  contractData: {
    camereText: string;
    propertyAddress: string;
    durata: string;
    dataIncepere: string;
    pret: string;
    moneda: string;
    garantie: string;
    garantieStatus: string;
  }
): void => {
  // I. OBIECTUL CONTRACTULUI
  addSectionTitle(ctx, "I. OBIECTUL CONTRACTULUI");
  addParagraph(ctx, `Proprietarul inchiriaza chiriasului imobilul format din ${contractData.camereText} situat in ${contractData.propertyAddress}`);

  // II. DESTINATIA
  addSectionTitle(ctx, "II. DESTINATIA");
  addParagraph(ctx, "Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");

  // III. DURATA
  addSectionTitle(ctx, "III. DURATA");
  addParagraph(ctx, `Acest contract este incheiat pentru o perioada de ${contractData.durata} luni, incepand cu data de ${contractData.dataIncepere}.`);
  addParagraph(ctx, "Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.");

  // IV. CHIRIA SI MODALITATI DE PLATA
  addSectionTitle(ctx, "IV. CHIRIA SI MODALITATI DE PLATA");
  addParagraph(ctx, `Chiria lunara convenita de comun acord este de ${contractData.pret} ${contractData.moneda}/luna.`);
  
  const garantieText = contractData.garantieStatus === "platita" 
    ? `Garantia in valoare de ${contractData.garantie} ${contractData.moneda} s-a achitat astazi, la data semnarii contractului de inchiriere.`
    : `Garantia in valoare de ${contractData.garantie} ${contractData.moneda} se va plati in termen de 10 zile lucratoare de la data semnarii contractului de inchiriere.`;
  addParagraph(ctx, garantieText);
  addParagraph(ctx, "Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.");
  addParagraph(ctx, "Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.");

  // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
  addSectionTitle(ctx, "V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
  addParagraph(ctx, "Obligatii: sa predea imobilul in stare buna; sa asigure folosinta imobilului; sa achite taxele legale; sa suporte reparatiile partilor comune.");
  addParagraph(ctx, "Drepturi: sa viziteze imobilul cu anunt prealabil; sa accepte sau sa respinga modificarile propuse; sa verifice platile curente.");

  // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
  addSectionTitle(ctx, "VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
  addParagraph(ctx, "Obligatii: sa foloseasca imobilul conform destinatiei; sa nu subinchirieze; sa achite utilitatile; sa mentina bunurile in buna stare; sa predea spatiul in starea initiala.");
  addParagraph(ctx, "Drepturi: sa utilizeze imobilul in exclusivitate; sa faca imbunatatiri cu acordul proprietarului.");

  // VII. PREDAREA IMOBILULUI
  addSectionTitle(ctx, "VII. PREDAREA IMOBILULUI");
  addParagraph(ctx, "Dupa expirarea contractului chiriasul va preda imobilul in starea in care l-a primit.");

  // VIII. FORTA MAJORA - from database
  const fortaMajoraClause = contractClauses.find(c => c.section_key === 'forta_majora');
  addSectionTitle(ctx, fortaMajoraClause?.section_title || "VIII. FORTA MAJORA");
  const fortaMajoraContent = fortaMajoraClause?.content || "Orice cauza neprevazuta si imposibil de evitat va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.";
  fortaMajoraContent.split('\n').forEach(line => {
    if (line.trim()) addParagraph(ctx, line.trim());
  });

  // IX. CONDITIILE DE INCETARE A CONTRACTULUI - from database
  const incetareClause = contractClauses.find(c => c.section_key === 'incetare_contract');
  addSectionTitle(ctx, incetareClause?.section_title || "IX. CONDITIILE DE INCETARE A CONTRACTULUI");
  const incetareContent = incetareClause?.content || "a) la expirarea duratei pentru care a fost incheiat;\nb) in situatia nerespectarii clauzelor contractuale;\nc) clauza fortei majore;\nd) prin denuntare unilaterala cu notificare prealabila de 30 de zile.";
  incetareContent.split('\n').forEach(line => {
    if (line.trim()) addParagraph(ctx, line.trim());
  });

  // X. DISPOZITII FINALE - from database
  const dispozitiiClause = contractClauses.find(c => c.section_key === 'dispozitii_finale');
  if (dispozitiiClause) {
    addSectionTitle(ctx, dispozitiiClause.section_title);
    dispozitiiClause.content.split('\n').forEach(line => {
      if (line.trim()) addParagraph(ctx, line.trim());
    });
  }
};

// Generate a new rental contract PDF
export const generateRentalContractPdf = async (options: GeneratePdfOptions): Promise<jsPDF> => {
  const { contractData, contractClauses, inventoryItems, siteSettings, inventoryImageSize = 'medium' } = options;
  
  const ctx = createPdfContext();
  
  const moneda = contractData.moneda;
  const garantieVal = contractData.garantie || contractData.proprietate_pret;
  const camereText = contractData.numar_camere === "1" ? "1 camera" : `${contractData.numar_camere} camere`;

  // TITLE
  ctx.doc.setFontSize(16);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("CONTRACT DE INCHIRIERE", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 12;
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(`Incheiat astazi, ${formatDateRomanian(contractData.data_contract)} intre:`, ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 12;

  // 1. PROPRIETAR BOX
  drawPartyBox(ctx, "1. PROPRIETAR (LOCATOR):", {
    nume: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}`.trim(),
    cnp: contractData.proprietar.cnp,
    seria: contractData.proprietar.seria_ci,
    numar: contractData.proprietar.numar_ci,
    emitent: contractData.proprietar.ci_emitent || '-',
    dataEmiterii: formatDateRomanian(contractData.proprietar.ci_data_emiterii) || '-',
    domiciliu: contractData.proprietar.adresa,
    cetatenie: contractData.proprietar.cetatenie || 'Romana',
    isCompany: contractData.proprietar.is_company,
    companyName: contractData.proprietar.company_name,
    companyCui: contractData.proprietar.company_cui,
    companyRegCom: contractData.proprietar.company_reg_com,
    companySediu: contractData.proprietar.company_sediu,
    functionTitle: contractData.proprietar.function_title,
  });

  // 2. CHIRIAS BOX
  drawPartyBox(ctx, "2. CHIRIAS (LOCATAR):", {
    nume: `${contractData.chirias.prenume} ${contractData.chirias.nume}`.trim(),
    cnp: contractData.chirias.cnp,
    seria: contractData.chirias.seria_ci,
    numar: contractData.chirias.numar_ci,
    emitent: contractData.chirias.ci_emitent || '-',
    dataEmiterii: formatDateRomanian(contractData.chirias.ci_data_emiterii) || '-',
    domiciliu: contractData.chirias.adresa,
    cetatenie: contractData.chirias.cetatenie || 'romana',
    isCompany: contractData.chirias.is_company,
    companyName: contractData.chirias.company_name,
    companyCui: contractData.chirias.company_cui,
    companyRegCom: contractData.chirias.company_reg_com,
    companySediu: contractData.chirias.company_sediu,
    functionTitle: contractData.chirias.function_title,
  });

  // Add contract sections
  addContractSections(ctx, contractClauses, {
    camereText,
    propertyAddress: contractData.proprietate_adresa,
    durata: contractData.durata_inchiriere || "12",
    dataIncepere: formatDateRomanian(contractData.data_incepere || contractData.data_contract),
    pret: contractData.proprietate_pret,
    moneda,
    garantie: garantieVal,
    garantieStatus: contractData.garantie_status
  });

  // Signature section
  addSignatureSection(
    ctx,
    {
      name: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}`,
      isCompany: !!contractData.proprietar.is_company,
      companyName: contractData.proprietar.company_name,
      functionTitle: contractData.proprietar.function_title,
    },
    {
      name: `${contractData.chirias.prenume} ${contractData.chirias.nume}`,
      isCompany: !!contractData.chirias.is_company,
      companyName: contractData.chirias.company_name,
      functionTitle: contractData.chirias.function_title,
    },
    contractData.semnatura_proprietar,
    contractData.semnatura_chirias
  );

  // Add inventory if exists
  if (inventoryItems.length > 0) {
    await addInventoryTable(ctx, inventoryItems, contractData.proprietate_adresa, inventoryImageSize);
  }

  // Add footer
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

// Generate a signed rental contract PDF
export const generateSignedRentalContractPdf = async (options: GenerateSignedPdfOptions): Promise<jsPDF> => {
  const { 
    contract, 
    contractClauses, 
    inventoryItems, 
    proprietarSignature, 
    chiriasSignature, 
    siteSettings,
    inventoryImageSize = 'medium' 
  } = options;
  
  const ctx = createPdfContext();
  
  const moneda = contract.property_currency || 'EUR';
  const garantieVal = contract.property_price?.toString() || '';
  const durataLuni = contract.duration_months?.toString() || '12';

  // TITLE
  ctx.doc.setFontSize(16);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("CONTRACT DE INCHIRIERE", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 8;
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "italic");
  ctx.doc.text("(Semnat electronic)", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 10;

  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)} intre:`, ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 12;

  // 1. PROPRIETAR BOX
  drawPartyBox(ctx, "1. PROPRIETAR (LOCATOR):", {
    nume: `${contract.proprietar_prenume || ''} ${contract.proprietar_name || 'N/A'}`.trim(),
    cnp: contract.proprietar_cnp || '-',
    seria: contract.proprietar_seria_ci || '-',
    numar: contract.proprietar_numar_ci || '-',
    emitent: contract.proprietar_ci_emitent || '-',
    dataEmiterii: formatDateRomanian(contract.proprietar_ci_data_emiterii) || '-',
    domiciliu: contract.proprietar_adresa || '-',
    cetatenie: 'Romana',
    isCompany: !!contract.proprietar_is_company,
    companyName: contract.proprietar_company_name || undefined,
    companyCui: contract.proprietar_company_cui || undefined,
    companyRegCom: contract.proprietar_company_reg_com || undefined,
    companySediu: contract.proprietar_company_sediu || undefined,
    functionTitle: contract.proprietar_function_title || undefined,
  });

  // 2. CHIRIAS BOX
  drawPartyBox(ctx, "2. CHIRIAS (LOCATAR):", {
    nume: `${contract.client_prenume || ''} ${contract.client_name}`.trim(),
    cnp: contract.client_cnp || '-',
    seria: contract.client_seria_ci || '-',
    numar: contract.client_numar_ci || '-',
    emitent: contract.client_ci_emitent || '-',
    dataEmiterii: formatDateRomanian(contract.client_ci_data_emiterii) || '-',
    domiciliu: contract.client_adresa || '-',
    cetatenie: 'Romana',
    isCompany: !!contract.client_is_company,
    companyName: contract.client_company_name || undefined,
    companyCui: contract.client_company_cui || undefined,
    companyRegCom: contract.client_company_reg_com || undefined,
    companySediu: contract.client_company_sediu || undefined,
    functionTitle: contract.client_function_title || undefined,
  });

  // Add contract sections
  addContractSections(ctx, contractClauses, {
    camereText: '1 camera',
    propertyAddress: contract.property_address,
    durata: durataLuni,
    dataIncepere: formatDateRomanian(contract.contract_date),
    pret: contract.property_price?.toString() || 'N/A',
    moneda,
    garantie: garantieVal,
    garantieStatus: contract.garantie_status || 'platita'
  });

  // Signature section with actual signatures
  addSignatureSection(
    ctx,
    `${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`,
    `${contract.client_prenume || ''} ${contract.client_name}`,
    proprietarSignature,
    chiriasSignature
  );

  // Add inventory if exists
  if (inventoryItems.length > 0) {
    await addInventoryTable(ctx, inventoryItems, contract.property_address, inventoryImageSize);
  }

  // Add footer
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

// Generate a preview PDF (unsigned, for display only)
export const generatePreviewPdf = async (options: GeneratePdfOptions): Promise<string> => {
  const pdf = await generateRentalContractPdf(options);
  return pdf.output('datauristring');
};
