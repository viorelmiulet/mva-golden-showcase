-- Add proprietar columns to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS proprietar_name TEXT,
ADD COLUMN IF NOT EXISTS proprietar_prenume TEXT,
ADD COLUMN IF NOT EXISTS proprietar_cnp TEXT,
ADD COLUMN IF NOT EXISTS proprietar_seria_ci TEXT,
ADD COLUMN IF NOT EXISTS proprietar_numar_ci TEXT,
ADD COLUMN IF NOT EXISTS proprietar_adresa TEXT,
ADD COLUMN IF NOT EXISTS proprietar_ci_emitent TEXT,
ADD COLUMN IF NOT EXISTS proprietar_ci_data_emiterii DATE;