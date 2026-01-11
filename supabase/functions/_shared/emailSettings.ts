/**
 * Helper to fetch email settings from the database
 * Used across all edge functions for consistent email sender configuration
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface EmailFunctionSetting {
  id: string;
  function_name: string;
  function_label: string;
  from_email: string;
  from_name: string | null;
  is_active: boolean;
}

export const getEmailSettings = async (functionName: string): Promise<{ fromEmail: string; fromName: string } | null> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not configured, using defaults");
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("email_function_settings")
      .select("from_email, from_name, is_active")
      .eq("function_name", functionName)
      .single();

    if (error || !data) {
      console.warn(`No email settings found for function: ${functionName}, using defaults`);
      return null;
    }

    if (!data.is_active) {
      console.log(`Email function ${functionName} is disabled`);
      return null;
    }

    return {
      fromEmail: data.from_email,
      fromName: data.from_name || "MVA Imobiliare",
    };
  } catch (err) {
    console.error("Error fetching email settings:", err);
    return null;
  }
};

export const formatFromAddress = (fromEmail: string, fromName: string): string => {
  return `${fromName} <${fromEmail}>`;
};

export const getFromAddressForFunction = async (
  functionName: string,
  defaultEmail: string = "noreply@mvaimobiliare.ro",
  defaultName: string = "MVA Imobiliare"
): Promise<string> => {
  const settings = await getEmailSettings(functionName);
  
  if (settings) {
    return formatFromAddress(settings.fromEmail, settings.fromName);
  }
  
  return formatFromAddress(defaultEmail, defaultName);
};
