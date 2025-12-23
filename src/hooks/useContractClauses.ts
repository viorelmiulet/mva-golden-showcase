import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContractClause {
  id: string;
  section_key: string;
  section_title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
}

interface PlaceholderValues {
  durata?: string;
  data_incepere?: string;
  pret?: string;
  moneda?: string;
  garantie?: string;
  adresa?: string;
}

export const useContractClauses = () => {
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClauses();
  }, []);

  const fetchClauses = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_clauses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setClauses(data || []);
    } catch (error) {
      console.error("Error fetching clauses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getClauseByKey = (key: string): ContractClause | undefined => {
    return clauses.find((c) => c.section_key === key);
  };

  const getClauseContent = (key: string, placeholders?: PlaceholderValues): string => {
    const clause = getClauseByKey(key);
    if (!clause) return "";
    
    return replacePlaceholders(clause.content, placeholders);
  };

  const getClauseTitle = (key: string): string => {
    const clause = getClauseByKey(key);
    return clause?.section_title || "";
  };

  const replacePlaceholders = (text: string, values?: PlaceholderValues): string => {
    if (!values) return text;
    
    return text
      .replace(/\[DURATA\]/g, values.durata || "12")
      .replace(/\[DATA_INCEPERE\]/g, values.data_incepere || "")
      .replace(/\[PRET\]/g, values.pret || "")
      .replace(/\[MONEDA\]/g, values.moneda || "EUR")
      .replace(/\[GARANTIE\]/g, values.garantie || "")
      .replace(/\[ADRESA\]/g, values.adresa || "");
  };

  return {
    clauses,
    isLoading,
    getClauseByKey,
    getClauseContent,
    getClauseTitle,
    replacePlaceholders,
    refetch: fetchClauses,
  };
};

// Standalone function for use outside of React components
export const fetchContractClauses = async (): Promise<ContractClause[]> => {
  try {
    const { data, error } = await supabase
      .from("contract_clauses")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching clauses:", error);
    return [];
  }
};

export const getClauseContentFromList = (
  clauses: ContractClause[],
  key: string,
  placeholders?: PlaceholderValues
): string => {
  const clause = clauses.find((c) => c.section_key === key);
  if (!clause) return "";

  let content = clause.content;
  if (placeholders) {
    content = content
      .replace(/\[DURATA\]/g, placeholders.durata || "12")
      .replace(/\[DATA_INCEPERE\]/g, placeholders.data_incepere || "")
      .replace(/\[PRET\]/g, placeholders.pret || "")
      .replace(/\[MONEDA\]/g, placeholders.moneda || "EUR")
      .replace(/\[GARANTIE\]/g, placeholders.garantie || "")
      .replace(/\[ADRESA\]/g, placeholders.adresa || "");
  }
  return content;
};

export const getClauseTitleFromList = (clauses: ContractClause[], key: string): string => {
  const clause = clauses.find((c) => c.section_key === key);
  return clause?.section_title || "";
};
