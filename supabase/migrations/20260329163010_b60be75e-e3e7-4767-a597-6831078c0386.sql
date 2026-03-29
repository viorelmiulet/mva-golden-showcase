
-- Tabela proprietăți închiriate
CREATE TABLE public.rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'București',
  zone TEXT,
  property_type TEXT DEFAULT 'apartament',
  rooms INTEGER DEFAULT 2,
  surface NUMERIC,
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  furnished TEXT DEFAULT 'mobilat',
  heating TEXT,
  monthly_rent NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  deposit_amount NUMERIC DEFAULT 0,
  landlord_name TEXT,
  landlord_phone TEXT,
  landlord_email TEXT,
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  contract_start DATE,
  contract_end DATE,
  status TEXT DEFAULT 'available',
  notes TEXT,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}'
);

ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rental_properties" ON public.rental_properties
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela chiriași
CREATE TABLE public.rental_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cnp TEXT,
  seria_ci TEXT,
  numar_ci TEXT,
  address TEXT,
  property_id UUID REFERENCES public.rental_properties(id) ON DELETE SET NULL,
  contract_start DATE,
  contract_end DATE,
  monthly_rent NUMERIC,
  currency TEXT DEFAULT 'EUR',
  deposit_paid BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  notes TEXT
);

ALTER TABLE public.rental_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rental_tenants" ON public.rental_tenants
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela utilități / plăți
CREATE TABLE public.rental_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES public.rental_properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.rental_tenants(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL DEFAULT 'rent',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending',
  notes TEXT
);

ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rental_payments" ON public.rental_payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela tichete / probleme
CREATE TABLE public.rental_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES public.rental_properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.rental_tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.rental_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rental_tickets" ON public.rental_tickets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers updated_at
CREATE TRIGGER update_rental_properties_updated_at BEFORE UPDATE ON public.rental_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_tenants_updated_at BEFORE UPDATE ON public.rental_tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_tickets_updated_at BEFORE UPDATE ON public.rental_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
