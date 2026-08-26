export const VIRTUAL_STAGING_MODEL = "openai/gpt-image-2";

const roomDescriptions: Record<string, string> = {
  living: "living room",
  bedroom: "bedroom",
  kitchen: "kitchen",
  bathroom: "bathroom",
  office: "home office",
  dining: "dining room",
};

const styleDescriptions: Record<string, string> = {
  modern: "modern minimalist, with clean lines, neutral colors and contemporary furniture",
  classic: "classic elegant, with refined traditional furniture and warm colors",
  scandinavian: "Scandinavian, with light wood, simple furniture and cozy textiles",
  industrial: "industrial, with restrained metal accents and natural raw materials",
  bohemian: "bohemian, with layered textiles, plants and tasteful eclectic furniture",
  luxury: "high-end luxury, with premium materials and sophisticated designer furniture",
};

export function buildVirtualStagingPrompt(input: {
  roomType: string;
  style: string;
  additionalPrompt?: string;
}) {
  const room = roomDescriptions[input.roomType] ?? roomDescriptions.living;
  const style = styleDescriptions[input.style] ?? styleDescriptions.modern;
  const extra = input.additionalPrompt?.trim();

  return [
    `Virtually stage this empty ${room} in a ${style} interior design style.`,
    "Preserve the source photo's exact architecture, camera angle, perspective, room dimensions, walls, ceiling, floor, doors, windows, radiators, outlets and permanent fixtures.",
    "Add only realistic, correctly scaled furniture, lighting and decor suitable for a Romanian residential property listing.",
    "Keep windows and exterior views unchanged. Do not add people, text, logos, watermarks or alter the image crop.",
    "Make the result photorealistic, naturally lit and commercially appealing without looking over-styled.",
    extra ? `Additional requirements: ${extra}` : "",
  ].filter(Boolean).join(" ");
}

export function extractGatewayMessage(raw: string, fallback: string) {
  try {
    const parsed = JSON.parse(raw) as {
      error?: string | { message?: string };
      message?: string;
    };
    if (typeof parsed.error === "string") return parsed.error;
    return parsed.error?.message || parsed.message || fallback;
  } catch {
    return raw.trim() || fallback;
  }
}

export function gatewayErrorMessage(status: number, raw: string) {
  const upstream = extractGatewayMessage(raw, `Serviciul AI a răspuns cu status ${status}.`);
  if (status === 400) return `Cererea de generare este invalidă: ${upstream}`;
  if (status === 401) return "Cheia serviciului AI lipsește sau nu mai este validă. Republică aplicația după reprovisionarea cheii.";
  if (status === 402) return upstream || "Creditele AI sunt insuficiente. Adaugă credite și reia generarea.";
  if (status === 403) return upstream || "Generarea AI este blocată de politica workspace-ului.";
  if (status === 429) return upstream || "Serviciul AI este temporar aglomerat.";
  return upstream;
}