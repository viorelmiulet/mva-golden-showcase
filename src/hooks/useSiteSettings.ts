import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  companyName: string;
  companyDescription: string;
  email: string;
  phone: string;
  address: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
}

const defaultSettings: SiteSettings = {
  companyName: "MVA Imobiliare",
  companyDescription: "Agenție imobiliară de încredere",
  email: "contact@mva-imobiliare.ro",
  phone: "+40767941512",
  address: "Chiajna, Strada Tineretului 17",
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  tiktok: "",
};

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching site settings:", error);
        return defaultSettings;
      }

      if (!data || data.length === 0) {
        return defaultSettings;
      }

      const settings = { ...defaultSettings };
      data.forEach((item) => {
        if (item.key in settings) {
          (settings as Record<string, string>)[item.key] = item.value || "";
        }
      });

      return settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
