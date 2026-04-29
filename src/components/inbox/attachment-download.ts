import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type EmailAttachment = {
  url?: string | null;
  name?: string | null;
  filename?: string | null;
  path?: string | null;
  storage_path?: string | null;
  bucket?: string | null;
};

export const getAttachmentName = (attachment: EmailAttachment) => {
  return attachment.filename || attachment.name || "atasament";
};

export const getAttachmentUrl = (attachment: EmailAttachment) => {
  if (attachment.url) return attachment.url;

  // Fallback: derive public URL from stored storage path
  const path = attachment.path || attachment.storage_path;
  if (path) {
    const bucket = attachment.bucket || "email-attachments";
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    } catch (e) {
      console.error("Failed to derive attachment public URL:", e);
    }
  }

  return null;
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
