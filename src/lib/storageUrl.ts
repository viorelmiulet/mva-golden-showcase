import { supabase } from "@/integrations/supabase/client";

const CONTRACTS_BUCKET = "contracts";

export const extractStoragePathFromUrl = (value: string): string => {
  if (!value) return value;

  if (value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }

  const sanitized = value.split("?")[0].split("#")[0];

  if (!sanitized.startsWith("http://") && !sanitized.startsWith("https://")) {
    return sanitized.replace(/^\/+/, "");
  }

  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/contracts\/(.+)$/);

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }

    const fallbackMatch = url.pathname.match(/\/contracts\/(.+)$/);
    return fallbackMatch?.[1] ? decodeURIComponent(fallbackMatch[1]) : sanitized;
  } catch {
    return sanitized;
  }
};

export const getSignedContractUrl = async (value: string): Promise<string | null> => {
  if (!value) return null;

  if (value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }

  const path = extractStoragePathFromUrl(value);

  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(CONTRACTS_BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    console.error("Error creating signed contract URL:", error);
    return null;
  }

  return data.signedUrl;
};
