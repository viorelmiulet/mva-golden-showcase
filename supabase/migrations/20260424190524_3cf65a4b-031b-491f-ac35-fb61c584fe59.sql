-- Add company-entity fields to contracts table for both parties (chirias=client, proprietar)
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS client_is_company boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_company_name text,
  ADD COLUMN IF NOT EXISTS client_company_cui text,
  ADD COLUMN IF NOT EXISTS client_company_reg_com text,
  ADD COLUMN IF NOT EXISTS client_company_sediu text,
  ADD COLUMN IF NOT EXISTS client_function_title text,
  ADD COLUMN IF NOT EXISTS proprietar_is_company boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proprietar_company_name text,
  ADD COLUMN IF NOT EXISTS proprietar_company_cui text,
  ADD COLUMN IF NOT EXISTS proprietar_company_reg_com text,
  ADD COLUMN IF NOT EXISTS proprietar_company_sediu text,
  ADD COLUMN IF NOT EXISTS proprietar_function_title text;