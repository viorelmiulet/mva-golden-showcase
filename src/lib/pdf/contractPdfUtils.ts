import jsPDF from 'jspdf';
import { replaceDiacritics } from '@/lib/utils';
import type { PartyBoxData, InventoryItem } from '@/types/contract';

// Helper function to format dates as DD.MM.YYYY
export const formatDateRomanian = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    if (dateString.includes('.')) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
};

// Helper function to convert image URL to base64
export const imageUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to base64:', error);
    return null;
  }
};

export interface PdfContext {
  doc: jsPDF;
  y: number;
  margin: number;
  textWidth: number;
  pageWidth: number;
}

// Create a new PDF context
export const createPdfContext = (): PdfContext => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = pageWidth - 2 * margin;
  return { doc, y: 25, margin, textWidth, pageWidth };
};

// Add section title (bold, blue)
export const addSectionTitle = (ctx: PdfContext, title: string): void => {
  if (ctx.y > 260) {
    ctx.doc.addPage();
    ctx.y = 20;
  }
  ctx.doc.setFontSize(11);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setTextColor(0, 51, 153);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 8;
  ctx.doc.setTextColor(0, 0, 0);
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
};

// Add paragraph with indent
export const addParagraph = (ctx: PdfContext, text: string, indent: number = 8): void => {
  if (ctx.y > 270) {
    ctx.doc.addPage();
    ctx.y = 20;
  }
  ctx.doc.setFont("helvetica", "normal");
  const lines = ctx.doc.splitTextToSize(replaceDiacritics(text), ctx.textWidth - indent);
  for (let i = 0; i < lines.length; i++) {
    ctx.doc.text(lines[i], ctx.margin + indent, ctx.y);
    ctx.y += 5;
  }
  ctx.y += 2;
};

// Draw a party info box
export const drawPartyBox = (ctx: PdfContext, title: string, data: PartyBoxData): void => {
  if (ctx.y > 200) {
    ctx.doc.addPage();
    ctx.y = 20;
  }
  
  const boxStartY = ctx.y;
  const lineHeight = 6;
  const boxPadding = 5;
  const initialOffset = 4;
  const contentWidth = ctx.textWidth - 2 * boxPadding;
  
  const eliberatText = `Eliberat de: ${replaceDiacritics(data.emitent)} la data de ${data.dataEmiterii}`;
  const eliberatLines = ctx.doc.splitTextToSize(eliberatText, contentWidth);
  const domiciliuText = `Domiciliu: ${replaceDiacritics(data.domiciliu)}`;
  const domiciliuLines = ctx.doc.splitTextToSize(domiciliuText, contentWidth);
  
  const boxHeight = boxPadding + initialOffset + (lineHeight + 2) +
    lineHeight * 3 +
    eliberatLines.length * 5 +
    domiciliuLines.length * 5 +
    lineHeight +
    boxPadding;
  
  ctx.doc.setLineWidth(0.5);
  ctx.doc.setDrawColor(0, 0, 0);
  ctx.doc.rect(ctx.margin, boxStartY, ctx.textWidth, boxHeight);
  
  ctx.y = boxStartY + boxPadding + initialOffset;
  
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(10);
  ctx.doc.text(replaceDiacritics(title), ctx.margin + boxPadding, ctx.y);
  ctx.y += lineHeight + 2;
  
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(10);
  
  ctx.doc.text(`Nume: ${replaceDiacritics(data.nume)}`, ctx.margin + boxPadding, ctx.y);
  ctx.y += lineHeight;
  ctx.doc.text(`CNP: ${data.cnp}`, ctx.margin + boxPadding, ctx.y);
  ctx.y += lineHeight;
  ctx.doc.text(`C.I.: seria ${data.seria} nr. ${data.numar}`, ctx.margin + boxPadding, ctx.y);
  ctx.y += lineHeight;
  
  for (let i = 0; i < eliberatLines.length; i++) {
    ctx.doc.text(eliberatLines[i], ctx.margin + boxPadding, ctx.y);
    ctx.y += 5;
  }
  
  for (let i = 0; i < domiciliuLines.length; i++) {
    ctx.doc.text(domiciliuLines[i], ctx.margin + boxPadding, ctx.y);
    ctx.y += 5;
  }
  
  ctx.doc.text(`Cetatenie: ${replaceDiacritics(data.cetatenie)}`, ctx.margin + boxPadding, ctx.y);
  
  ctx.y = boxStartY + boxHeight + 8;
};

// Add page numbers and footer
export const addPageFooter = (
  ctx: PdfContext,
  companyName: string,
  companyPhone: string,
  companyEmail: string,
  companyWebsite: string
): void => {
  const totalPages = ctx.doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    ctx.doc.setPage(i);
    ctx.doc.setFontSize(7);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setTextColor(100, 100, 100);
    
    ctx.doc.text(
      `${companyName} | Tel: ${companyPhone} | Email: ${companyEmail} | ${companyWebsite.replace('https://', '')}`,
      ctx.pageWidth / 2, 285, { align: "center" }
    );
    ctx.doc.text(`Pagina ${i} din ${totalPages}`, ctx.pageWidth / 2, 290, { align: "center" });
    ctx.doc.setTextColor(0, 0, 0);
  }
};

// Add inventory table to PDF
export const addInventoryTable = async (
  ctx: PdfContext,
  inventoryItems: InventoryItem[],
  propertyAddress: string,
  imageSize: 'small' | 'medium' | 'large' = 'medium'
): Promise<void> => {
  if (inventoryItems.length === 0) return;
  
  const imageSizeConfig = {
    small: { width: 35, height: 28, perRow: 4 },
    medium: { width: 50, height: 40, perRow: 3 },
    large: { width: 70, height: 56, perRow: 2 }
  };

  const conditionLabels: Record<string, string> = {
    'noua': 'Noua',
    'foarte_buna': 'F. buna',
    'buna': 'Buna',
    'satisfacatoare': 'Satisf.',
    'uzata': 'Uzata'
  };
  
  ctx.doc.addPage();
  ctx.y = 25;
  
  ctx.doc.setFontSize(14);
  ctx.doc.setFont("times", "bold");
  ctx.doc.text("ANEXA 1 - INVENTAR IMOBIL", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 12;
  
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("times", "normal");
  addParagraph(ctx, `Inventar al bunurilor aflate in imobilul situat in ${propertyAddress}, predate de proprietar chiriasului la data inceperii contractului de inchiriere.`);
  ctx.y += 5;
  
  // Table header
  const startX = ctx.margin;
  
  ctx.doc.setFont("times", "bold");
  ctx.doc.setFillColor(240, 240, 240);
  ctx.doc.rect(startX, ctx.y - 4, ctx.textWidth, 8, 'F');
  ctx.doc.text("Denumire", startX + 2, ctx.y);
  ctx.doc.text("Cant.", startX + 55, ctx.y);
  ctx.doc.text("Stare", startX + 70, ctx.y);
  ctx.doc.text("Locatie", startX + 105, ctx.y);
  ctx.doc.text("Observatii", startX + 130, ctx.y);
  ctx.y += 8;
  
  ctx.doc.setFont("times", "normal");
  
  inventoryItems.forEach((item: InventoryItem, index: number) => {
    if (ctx.y > 270) {
      ctx.doc.addPage();
      ctx.y = 20;
    }
    
    if (index % 2 === 0) {
      ctx.doc.setFillColor(250, 250, 250);
      ctx.doc.rect(startX, ctx.y - 4, ctx.textWidth, 6, 'F');
    }
    
    ctx.doc.text(replaceDiacritics((item.item_name || '').substring(0, 25)), startX + 2, ctx.y);
    ctx.doc.text((item.quantity || 1).toString(), startX + 55, ctx.y);
    ctx.doc.text(replaceDiacritics(conditionLabels[item.condition] || item.condition || ''), startX + 70, ctx.y);
    ctx.doc.text(replaceDiacritics((item.location || '-').substring(0, 12)), startX + 105, ctx.y);
    ctx.doc.text(replaceDiacritics((item.notes || '-').substring(0, 20)), startX + 130, ctx.y);
    ctx.y += 6;
  });
  
  ctx.y += 10;
  addParagraph(ctx, `Total articole inventariate: ${inventoryItems.length}`);
  ctx.y += 10;
  
  addParagraph(ctx, "Prezentul inventar a fost intocmit in 2 (doua) exemplare, cate unul pentru fiecare parte, si face parte integranta din contractul de inchiriere.");
  ctx.y += 15;
  
  // Add inventory images
  const itemsWithImages = inventoryItems.filter((item) => item.images && item.images.length > 0);
  
  if (itemsWithImages.length > 0) {
    ctx.doc.addPage();
    ctx.y = 25;
    
    ctx.doc.setFontSize(12);
    ctx.doc.setFont("times", "bold");
    ctx.doc.text("FOTOGRAFII INVENTAR", ctx.pageWidth / 2, ctx.y, { align: "center" });
    ctx.y += 12;
    
    ctx.doc.setFontSize(10);
    ctx.doc.setFont("times", "normal");
    
    for (const item of itemsWithImages) {
      if (ctx.y > 250) {
        ctx.doc.addPage();
        ctx.y = 20;
      }
      
      ctx.doc.setFont("times", "bold");
      ctx.doc.text(replaceDiacritics(`${item.item_name}${item.location ? ` - ${item.location}` : ''}`), ctx.margin, ctx.y);
      ctx.y += 6;
      ctx.doc.setFont("times", "normal");
      
      let imageX = ctx.margin;
      const { width: imageWidth, height: imageHeight, perRow: imagesPerRow } = imageSizeConfig[imageSize];
      
      for (let i = 0; i < item.images.length; i++) {
        try {
          if (i > 0 && i % imagesPerRow === 0) {
            ctx.y += imageHeight + 5;
            imageX = ctx.margin;
          }
          
          if (ctx.y + imageHeight > 280) {
            ctx.doc.addPage();
            ctx.y = 20;
            imageX = ctx.margin;
          }
          
          const base64Image = await imageUrlToBase64(item.images[i]);
          
          if (base64Image) {
            ctx.doc.addImage(base64Image, 'JPEG', imageX, ctx.y, imageWidth, imageHeight);
          } else {
            ctx.doc.setFillColor(240, 240, 240);
            ctx.doc.rect(imageX, ctx.y, imageWidth, imageHeight, 'F');
            ctx.doc.setFontSize(8);
            ctx.doc.text('[Imagine indisponibila]', imageX + 5, ctx.y + imageHeight / 2);
            ctx.doc.setFontSize(10);
          }
          imageX += imageWidth + 5;
        } catch (imgError) {
          console.warn('Could not add image to PDF:', imgError);
          ctx.doc.setFillColor(240, 240, 240);
          ctx.doc.rect(imageX, ctx.y, imageWidth, imageHeight, 'F');
          ctx.doc.setFontSize(8);
          ctx.doc.text('[Eroare imagine]', imageX + 10, ctx.y + imageHeight / 2);
          ctx.doc.setFontSize(10);
          imageX += imageWidth + 5;
        }
      }
      
      ctx.y += imageHeight + 10;
    }
  }
};

// Add signature section
export const addSignatureSection = (
  ctx: PdfContext,
  proprietarName: string,
  chiriasName: string,
  proprietarSignature?: string | null,
  chiriasSignature?: string | null
): void => {
  if (ctx.y > 200) {
    ctx.doc.addPage();
    ctx.y = 30;
  }
  ctx.y += 15;
  
  const signatureWidth = 50;
  const signatureHeight = 25;
  
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("PROPRIETAR", ctx.margin, ctx.y);
  ctx.doc.text("CHIRIAS", ctx.pageWidth - ctx.margin - 30, ctx.y);
  ctx.y += 8;
  
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(replaceDiacritics(proprietarName), ctx.margin, ctx.y);
  ctx.doc.text(replaceDiacritics(chiriasName), ctx.pageWidth - ctx.margin - 50, ctx.y);
  ctx.y += 15;
  
  if (proprietarSignature) {
    try {
      ctx.doc.addImage(proprietarSignature, 'PNG', ctx.margin, ctx.y, signatureWidth, signatureHeight);
    } catch (e) {
      console.error('Error adding proprietar signature:', e);
      ctx.doc.text("_______________", ctx.margin, ctx.y + 10);
    }
  } else {
    ctx.doc.text("_______________", ctx.margin, ctx.y + 10);
  }
  
  if (chiriasSignature) {
    try {
      ctx.doc.addImage(chiriasSignature, 'PNG', ctx.pageWidth - ctx.margin - signatureWidth, ctx.y, signatureWidth, signatureHeight);
    } catch (e) {
      console.error('Error adding chirias signature:', e);
      ctx.doc.text("_______________", ctx.pageWidth - ctx.margin - 40, ctx.y + 10);
    }
  } else {
    ctx.doc.text("_______________", ctx.pageWidth - ctx.margin - 40, ctx.y + 10);
  }
};
