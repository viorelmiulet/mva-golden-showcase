-- Add new columns for ID card issuer and issue date
ALTER TABLE public.contracts 
ADD COLUMN client_ci_emitent text,
ADD COLUMN client_ci_data_emiterii date;