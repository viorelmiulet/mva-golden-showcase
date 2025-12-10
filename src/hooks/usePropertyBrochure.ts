import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PropertyData {
  id: string;
  title: string;
  description: string;
  location: string;
  price_min: number;
  price_max: number;
  currency: string;
  surface_min: number;
  surface_max: number;
  rooms: number;
  images: string[];
  features: string[];
  amenities: string[];
  project_name: string | null;
  availability_status: string;
}

const formatPrice = (min: number, max: number) => {
  if (min === max) return `€${min.toLocaleString("de-DE")}`;
  return `€${min.toLocaleString("de-DE")} - €${max.toLocaleString("de-DE")}`;
};

const formatSurface = (min: number, max: number) => {
  if (min === max) return `${min} mp`;
  return `${min} - ${max} mp`;
};

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
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
    console.error('Error loading image:', error);
    return null;
  }
};

export const usePropertyBrochure = () => {
  const generateBrochure = async (property: PropertyData) => {
    const loadingToast = toast.loading('Se generează broșura PDF...');
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = 0;

      // Colors
      const goldColor: [number, number, number] = [218, 165, 32];
      const darkColor: [number, number, number] = [26, 26, 26];
      const grayColor: [number, number, number] = [100, 100, 100];

      // Header Background
      doc.setFillColor(...darkColor);
      doc.rect(0, 0, pageWidth, 45, 'F');

      // Gold accent line
      doc.setFillColor(...goldColor);
      doc.rect(0, 45, pageWidth, 2, 'F');

      // Header text
      doc.setTextColor(218, 165, 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('MVA IMOBILIARE', margin, 22);

      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('BROȘURĂ PROPRIETATE', margin, 32);

      // Status badge
      if (property.availability_status === 'available') {
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(pageWidth - margin - 30, 14, 30, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('DISPONIBIL', pageWidth - margin - 15, 19, { align: 'center' });
      }

      yPosition = 55;

      // Main image
      if (property.images && property.images.length > 0) {
        const mainImageBase64 = await loadImageAsBase64(property.images[0]);
        if (mainImageBase64) {
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = 70;
          doc.addImage(mainImageBase64, 'JPEG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 8;
        }
      }

      // Title
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(property.title, pageWidth - (margin * 2));
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 7 + 3;

      // Project name if exists
      if (property.project_name) {
        doc.setTextColor(...goldColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(property.project_name, margin, yPosition);
        yPosition += 6;
      }

      // Location
      doc.setTextColor(...grayColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`📍 ${property.location}`, margin, yPosition);
      yPosition += 10;

      // Stats boxes
      const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
      const boxHeight = 25;

      // Price box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPosition, boxWidth, boxHeight, 3, 3, 'F');
      doc.setTextColor(...grayColor);
      doc.setFontSize(8);
      doc.text('PREȚ', margin + boxWidth / 2, yPosition + 8, { align: 'center' });
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(formatPrice(property.price_min, property.price_max), margin + boxWidth / 2, yPosition + 17, { align: 'center' });

      // Surface box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin + boxWidth + 5, yPosition, boxWidth, boxHeight, 3, 3, 'F');
      doc.setTextColor(...grayColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('SUPRAFAȚĂ', margin + boxWidth + 5 + boxWidth / 2, yPosition + 8, { align: 'center' });
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(formatSurface(property.surface_min, property.surface_max), margin + boxWidth + 5 + boxWidth / 2, yPosition + 17, { align: 'center' });

      // Rooms box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin + (boxWidth + 5) * 2, yPosition, boxWidth, boxHeight, 3, 3, 'F');
      doc.setTextColor(...grayColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('CAMERE', margin + (boxWidth + 5) * 2 + boxWidth / 2, yPosition + 8, { align: 'center' });
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${property.rooms}`, margin + (boxWidth + 5) * 2 + boxWidth / 2, yPosition + 17, { align: 'center' });

      yPosition += boxHeight + 10;

      // Description
      doc.setTextColor(...goldColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DESCRIERE', margin, yPosition);
      yPosition += 6;

      doc.setTextColor(...grayColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(property.description || 'Fără descriere', pageWidth - (margin * 2));
      const maxDescLines = 6;
      const limitedDescLines = descLines.slice(0, maxDescLines);
      doc.text(limitedDescLines, margin, yPosition);
      yPosition += limitedDescLines.length * 5 + 8;

      // Features
      if (property.features && property.features.length > 0) {
        doc.setTextColor(...goldColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('CARACTERISTICI', margin, yPosition);
        yPosition += 6;

        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const featuresText = property.features.slice(0, 8).join(' • ');
        const featureLines = doc.splitTextToSize(featuresText, pageWidth - (margin * 2));
        doc.text(featureLines, margin, yPosition);
        yPosition += featureLines.length * 4 + 6;
      }

      // Amenities
      if (property.amenities && property.amenities.length > 0) {
        doc.setTextColor(...goldColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('FACILITĂȚI', margin, yPosition);
        yPosition += 6;

        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const amenitiesText = property.amenities.slice(0, 8).join(' • ');
        const amenityLines = doc.splitTextToSize(amenitiesText, pageWidth - (margin * 2));
        doc.text(amenityLines, margin, yPosition);
        yPosition += amenityLines.length * 4 + 6;
      }

      // Additional images (if space allows)
      if (property.images && property.images.length > 1 && yPosition < pageHeight - 60) {
        const thumbWidth = (pageWidth - (margin * 2) - 6) / 3;
        const thumbHeight = 30;
        
        for (let i = 1; i < Math.min(4, property.images.length); i++) {
          const imgBase64 = await loadImageAsBase64(property.images[i]);
          if (imgBase64) {
            const xPos = margin + ((i - 1) * (thumbWidth + 3));
            doc.addImage(imgBase64, 'JPEG', xPos, yPosition, thumbWidth, thumbHeight);
          }
        }
        yPosition += thumbHeight + 8;
      }

      // Footer
      const footerY = pageHeight - 25;
      doc.setFillColor(...darkColor);
      doc.rect(0, footerY, pageWidth, 25, 'F');

      doc.setTextColor(...goldColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('MVA IMOBILIARE', margin, footerY + 10);

      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('📞 0767 941 512  |  ✉ mvaperfectbusiness@gmail.com', margin, footerY + 17);
      doc.text('🌐 mvaimobiliare.ro', pageWidth - margin, footerY + 17, { align: 'right' });

      // QR code area (just text for now)
      doc.setFontSize(7);
      doc.text(`ID: ${property.id.slice(0, 8)}`, pageWidth - margin, footerY + 10, { align: 'right' });

      // Save PDF
      const fileName = `${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_MVA.pdf`;
      doc.save(fileName);

      toast.dismiss(loadingToast);
      toast.success('Broșura PDF a fost generată cu succes!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss(loadingToast);
      toast.error('Eroare la generarea broșurii PDF');
    }
  };

  return { generateBrochure };
};
