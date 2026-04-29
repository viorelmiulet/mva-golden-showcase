import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type EmailAttachment = {
  url?: string | null;
  name?: string | null;
  filename?: string | null;
  path?: string | null;
  storage_path?: string | null;
  bucket?: string | null;
  content?: string | null; // base64 fallback (for legacy sent emails)
  contentType?: string | null;
  type?: string | null;
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

  // Legacy fallback: inline base64 content
  if (attachment.content) {
    return "inline-base64";
  }

  return null;
};

const downloadFromBase64 = (attachment: EmailAttachment, fileName: string) => {
  let base64 = attachment.content || "";
  if (base64.includes(",")) base64 = base64.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const mime = attachment.contentType || attachment.type || "application/octet-stream";
  const blob = new Blob([bytes], { type: mime });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

export const downloadEmailAttachment = async (attachment: EmailAttachment) => {
  const fileName = getAttachmentName(attachment);

  // Legacy: inline base64 content
  if (!attachment.url && !attachment.path && !attachment.storage_path && attachment.content) {
    try {
      downloadFromBase64(attachment, fileName);
      return;
    } catch (e) {
      console.error("Base64 attachment decode failed:", e);
      toast.error("Nu am putut decoda atașamentul.");
      return;
    }
  }

  const url = getAttachmentUrl(attachment);

  if (!url || url === "inline-base64") {
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
