import { getAdminPassword } from "./adminDb";

const ENDPOINT = "/api/admin/staging-storage";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Uploads a generated staging image through the server (service role). */
export async function uploadStagingImage(
  fileName: string,
  blob: Blob,
  options?: { upsert?: boolean },
): Promise<{ publicUrl: string; fileName: string }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upload",
      password: getAdminPassword(),
      fileName,
      contentType: blob.type || "image/png",
      dataBase64: await blobToBase64(blob),
      upsert: options?.upsert ?? false,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.error) throw new Error(payload?.error || `Upload eșuat (${res.status})`);
  return { publicUrl: payload.publicUrl, fileName: payload.fileName };
}

/** Deletes staging images through the server (service role). */
export async function deleteStagingImages(fileNames: string[]): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", password: getAdminPassword(), fileNames }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.error) throw new Error(payload?.error || `Ștergere eșuată (${res.status})`);
}
