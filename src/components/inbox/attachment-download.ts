import { toast } from "sonner";

type EmailAttachment = {
  url?: string | null;
  name?: string | null;
  filename?: string | null;
};

export const getAttachmentName = (attachment: EmailAttachment) => {
  return attachment.filename || attachment.name || "atasament";
};

export const getAttachmentUrl = (attachment: EmailAttachment) => {
  return attachment.url || null;
};

export const downloadEmailAttachment = async (attachment: EmailAttachment) => {
  const url = getAttachmentUrl(attachment);
  const fileName = getAttachmentName(attachment);

  if (!url) {
    toast.error("Atașamentul nu este disponibil pentru descărcare");
    return;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Attachment download failed:", error);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.error("Nu am putut forța descărcarea. Am deschis fișierul într-un tab nou.");
  }
};