import { getAdminPassword } from "./adminDb";

export type VirtualStagingFrame = {
  dataUrl: string;
  final: boolean;
};

type GenerateInput = {
  image: Blob;
  roomType: string;
  style: string;
  additionalPrompt?: string;
  signal?: AbortSignal;
  onFrame?: (frame: VirtualStagingFrame) => void;
};

function makeForm(input: GenerateInput, stream: boolean) {
  const form = new FormData();
  form.append("image", input.image, "camera.jpg");
  form.append("password", getAdminPassword());
  form.append("roomType", input.roomType);
  form.append("style", input.style);
  form.append("additionalPrompt", input.additionalPrompt?.trim() ?? "");
  form.append("stream", String(stream));
  return form;
}

async function errorFromResponse(response: Response) {
  const raw = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string };
    return parsed.error || parsed.message || `Generarea a eșuat (${response.status}).`;
  } catch {
    return raw || `Generarea a eșuat (${response.status}).`;
  }
}

function imageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const b64 = typeof data.b64_json === "string" ? data.b64_json : null;
  if (b64) return `data:image/png;base64,${b64}`;
  const list = Array.isArray(data.data) ? data.data : [];
  const first = list[0] as { b64_json?: string; url?: string } | undefined;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return first?.url ?? null;
}

function parseSseFrame(frame: string) {
  const event = frame.split("\n").find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "";
  const dataText = frame.split("\n").filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim()).join("\n");
  if (!dataText || dataText === "[DONE]") return null;
  try {
    return { event, data: JSON.parse(dataText) as unknown };
  } catch {
    return null;
  }
}

async function replayWithoutStreaming(input: GenerateInput) {
  const response = await fetch("/api/virtual-staging", {
    method: "POST",
    body: makeForm(input, false),
    signal: input.signal,
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  const image = imageFromPayload(await response.json());
  if (!image) throw new Error("Serviciul AI a finalizat cererea fără să returneze imaginea.");
  input.onFrame?.({ dataUrl: image, final: true });
  return image;
}

export async function generateVirtualStaging(input: GenerateInput): Promise<string> {
  if (!getAdminPassword()) throw new Error("Sesiunea admin a expirat. Autentifică-te din nou.");

  const response = await fetch("/api/virtual-staging", {
    method: "POST",
    body: makeForm(input, true),
    signal: input.signal,
  });
  if (!response.ok || !response.body) throw new Error(await errorFromResponse(response));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastImage: string | null = null;
  let events = 0;

  const consume = (frame: string) => {
    const parsed = parseSseFrame(frame);
    if (!parsed) return;
    events += 1;
    const image = imageFromPayload(parsed.data);
    if (!image) return;
    lastImage = image;
    const final = parsed.event.includes("completed");
    input.onFrame?.({ dataUrl: image, final });
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    frames.forEach(consume);
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);

  if (events === 0) return replayWithoutStreaming(input);
  if (!lastImage) throw new Error("Serviciul AI nu a returnat datele imaginii generate.");
  return lastImage;
}