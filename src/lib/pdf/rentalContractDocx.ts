import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { ContractData, InventoryItem } from "@/types/contract";
import type { ContractClause } from "@/hooks/useContractClauses";
import { formatDateRomanian } from "./contractPdfUtils";

interface GenerateDocxOptions {
  contractData: ContractData;
  contractClauses: ContractClause[];
  inventoryItems?: InventoryItem[];
}

// Create clause paragraphs from database
const createClauseParagraphs = (
  contractClauses: ContractClause[],
  sectionKey: string,
  defaultTitle: string,
  defaultContent: string
): Paragraph[] => {
  const clause = contractClauses.find(c => c.section_key === sectionKey);
  const paragraphs: Paragraph[] = [];
  
  paragraphs.push(new Paragraph({
    text: clause?.section_title || defaultTitle,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
  }));
  
  const content = clause?.content || defaultContent;
  content.split('\n').forEach((line, idx, arr) => {
    if (line.trim()) {
      paragraphs.push(new Paragraph({
        text: line.trim(),
        spacing: { after: idx === arr.length - 1 ? 200 : 100 },
      }));
    }
  });
  
  return paragraphs;
};

// Generate rental contract DOCX document
export const generateRentalContractDocx = async (options: GenerateDocxOptions): Promise<Blob> => {
  const { contractData, contractClauses, inventoryItems = [] } = options;
  
  const moneda = contractData.moneda;
  const garantieVal = contractData.garantie || contractData.proprietate_pret;
  const camereText = contractData.numar_camere === "1" ? "1 camera" : `${contractData.numar_camere} camere`;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // TITLE
        new Paragraph({
          text: "CONTRACT DE INCHIRIERE",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          text: `Incheiat astazi, ${formatDateRomanian(contractData.data_contract)} intre:`,
          spacing: { after: 200 },
        }),
        
        // PROPRIETAR
        new Paragraph({
          children: [new TextRun({ text: "1. PROPRIETAR: ", bold: true })],
        }),
        new Paragraph({
          text: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}, cetatean ${contractData.proprietar.cetatenie}, identificat prin CNP ${contractData.proprietar.cnp}, C.I seria ${contractData.proprietar.seria_ci} nr. ${contractData.proprietar.numar_ci}${contractData.proprietar.ci_emitent && contractData.proprietar.ci_data_emiterii ? `, eliberat de ${contractData.proprietar.ci_emitent} la data de ${formatDateRomanian(contractData.proprietar.ci_data_emiterii)}` : ''}, in calitate de proprietar al imobilului situat in ${contractData.proprietate_adresa}`,
          spacing: { after: 200 },
        }),
        
        // CHIRIAS
        new Paragraph({
          children: [new TextRun({ text: "2. CHIRIAS: ", bold: true })],
        }),
        new Paragraph({
          text: `${contractData.chirias.prenume} ${contractData.chirias.nume}, cetatean ${contractData.chirias.cetatenie}, identificat prin CNP ${contractData.chirias.cnp}, C.I seria ${contractData.chirias.seria_ci} nr. ${contractData.chirias.numar_ci}${contractData.chirias.ci_emitent && contractData.chirias.ci_data_emiterii ? `, eliberat de ${contractData.chirias.ci_emitent} la data de ${formatDateRomanian(contractData.chirias.ci_data_emiterii)}` : ''}, in calitate de chirias al imobilului situat in ${contractData.proprietate_adresa}.`,
          spacing: { after: 400 },
        }),
        
        // I. OBIECTUL CONTRACTULUI
        new Paragraph({
          text: "I. OBIECTUL CONTRACTULUI",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: `Proprietarul inchiriaza chiriasului imobilul format din ${camereText} situat in ${contractData.proprietate_adresa}`,
          spacing: { after: 200 },
        }),
        
        // II. DESTINATIA
        new Paragraph({
          text: "II. DESTINATIA",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: "Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.",
          spacing: { after: 200 },
        }),
        
        // III. DURATA
        new Paragraph({
          text: "III. DURATA",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: `Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${formatDateRomanian(contractData.data_incepere || contractData.data_contract)}. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`,
          spacing: { after: 200 },
        }),
        
        // IV. CHIRIA SI MODALITATI DE PLATA
        new Paragraph({
          text: "IV. CHIRIA SI MODALITATI DE PLATA",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: `Chiria lunara convenita de comun acord este de ${contractData.proprietate_pret} ${moneda}/luna. Suma va fi achitata in numerar sau transfer bancar.`,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: contractData.garantie_status === "platita" 
            ? `Garantia in valoare de ${garantieVal} ${moneda} s-a achitat astazi, la data semnarii contractului de inchiriere.`
            : `Garantia in valoare de ${garantieVal} ${moneda} se va plati in termen de 10 zile lucratoare de la data semnarii contractului de inchiriere.`,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: "Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.",
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: "Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.",
          spacing: { after: 200 },
        }),
        
        // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
        new Paragraph({
          text: "V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "1. OBLIGATIILE PROPRIETARULUI:", bold: true })],
          spacing: { after: 100 },
        }),
        new Paragraph({ text: "- proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului;" }),
        new Paragraph({ text: "- pune la dispozitia chiriasului imobilul in stare buna, pentru a fi folosit conform destinatiei avute in vedere;" }),
        new Paragraph({ text: "- achita toate taxele legale ale imobilului (impozit pe cladiri, venituri);" }),
        new Paragraph({ text: "- sa suporte cheltuielile de reparatii pentru partile comune ale imobilului.", spacing: { after: 100 } }),
        new Paragraph({
          children: [new TextRun({ text: "2. DREPTURILE PROPRIETARULUI:", bold: true })],
          spacing: { after: 100 },
        }),
        new Paragraph({ text: "- sa viziteze imobilul cand doreste, cu anuntarea in prealabil a chiriasului si in prezenta acestuia;" }),
        new Paragraph({ text: "- sa accepte sau sa respinga propunerile avansate de chirias de modificare a imobilului;" }),
        new Paragraph({ text: "- sa verifice achitarea obligatiilor de plata curente ale chiriasului.", spacing: { after: 200 } }),
        
        // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
        new Paragraph({
          text: "VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "1. OBLIGATIILE CHIRIASULUI:", bold: true })],
          spacing: { after: 100 },
        }),
        new Paragraph({ text: "- sa asigure exploatarea imobilului doar in conformitate cu destinatia avuta in vedere;" }),
        new Paragraph({ text: "- sa nu subinchirieze imobilul, decat cu acordul scris al proprietarului;" }),
        new Paragraph({ text: "- sa achite in termen legal platile curente: electricitate, gaze, gunoi, apa, intretinere;" }),
        new Paragraph({ text: "- sa mentina in buna stare imobilul si bunurile din inventar;" }),
        new Paragraph({ text: "- sa respecte normele de convietuire in conformitate cu regulamentul asociatiei de locatari;" }),
        new Paragraph({ text: "- sa permita accesul proprietarului in imobilul inchiriat cel putin o data pe luna;" }),
        new Paragraph({ text: "- sa predea spatiul in starea in care era la inceperea contractului.", spacing: { after: 100 } }),
        new Paragraph({
          children: [new TextRun({ text: "2. DREPTURILE CHIRIASULUI:", bold: true })],
          spacing: { after: 100 },
        }),
        new Paragraph({ text: "- sa utilizeze imobilul in exclusivitate pe perioada derularii contractului;" }),
        new Paragraph({ text: "- sa faca imbunatatirile necesare fara sa modifice structura de rezistenta si doar cu acordul proprietarului.", spacing: { after: 200 } }),
        
        // VII. PREDAREA IMOBILULUI
        new Paragraph({
          text: "VII. PREDAREA IMOBILULUI",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: "Dupa expirarea contractului chiriasul va preda imobilul proprietarului sau unui reprezentant autorizat al proprietarului, in starea in care l-a primit.",
          spacing: { after: 200 },
        }),
        
        // VIII. FORTA MAJORA - from database
        ...createClauseParagraphs(
          contractClauses,
          'forta_majora',
          "VIII. FORTA MAJORA",
          "Orice cauza neprevazuta si imposibil de evitat, independenta de vointa partilor, aparuta dupa semnarea prezentului si care impiedica executarea contractului, va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.\nPartea care invoca cauza de forta majora trebuie sa notifice acest lucru celeilalte parti in maxim 5 zile de la aparitie."
        ),
        
        // IX. CONDITIILE DE INCETARE A CONTRACTULUI - from database
        ...createClauseParagraphs(
          contractClauses,
          'incetare_contract',
          "IX. CONDITIILE DE INCETARE A CONTRACTULUI",
          "1. la expirarea duratei pentru care a fost incheiat;\n2. in situatia nerespectarii clauzelor contractuale de catre una din parti;\n3. clauza fortei majore;\n4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile."
        ),
        
        new Paragraph({
          text: "Incetarea prezentului contract nu va avea efect asupra obligatiilor deja scadente intre partile contractante.",
          spacing: { after: 400 },
        }),
        
        // SIGNATURES
        new Paragraph({
          children: [
            new TextRun({ text: "PROPRIETAR", bold: true }),
            new TextRun({ text: "\t\t\t\t\t\t\t\t\t\t" }),
            new TextRun({ text: "CHIRIAS", bold: true }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}` }),
            new TextRun({ text: "\t\t\t\t\t\t\t\t" }),
            new TextRun({ text: `${contractData.chirias.prenume} ${contractData.chirias.nume}` }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "_____________________" }),
            new TextRun({ text: "\t\t\t\t\t\t\t" }),
            new TextRun({ text: "_____________________" }),
          ],
        }),
        
        // INVENTORY (if exists)
        ...(inventoryItems.length > 0 ? [
          new Paragraph({
            text: "",
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: "ANEXA 1 - INVENTAR IMOBIL",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Inventar al bunurilor aflate in imobilul situat in ${contractData.proprietate_adresa}:`,
            spacing: { after: 200 },
          }),
          ...inventoryItems.map((item, index) => 
            new Paragraph({
              text: `${index + 1}. ${item.item_name} - Cantitate: ${item.quantity} - Stare: ${item.condition}${item.location ? ` - Locatie: ${item.location}` : ''}${item.notes ? ` - Note: ${item.notes}` : ''}`,
              spacing: { after: 100 },
            })
          ),
          new Paragraph({
            text: `Total articole: ${inventoryItems.length}`,
            spacing: { before: 200, after: 200 },
          }),
        ] : []),
      ],
    }],
  });

  return await Packer.toBlob(doc);
};

// Generate filename for DOCX
export const generateDocxFilename = (contractData: ContractData): string => {
  return `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${Date.now()}.docx`;
};

// Download DOCX blob
export const downloadDocxBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
