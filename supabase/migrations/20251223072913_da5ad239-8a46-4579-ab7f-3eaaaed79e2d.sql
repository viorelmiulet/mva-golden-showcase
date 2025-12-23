-- Create table for contract clauses
CREATE TABLE public.contract_clauses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_clauses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active clauses" ON public.contract_clauses 
FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage clauses" ON public.contract_clauses 
FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_contract_clauses_updated_at
  BEFORE UPDATE ON public.contract_clauses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default clauses
INSERT INTO public.contract_clauses (section_key, section_title, content, sort_order) VALUES
('obligatii_proprietar', 'III. OBLIGATIILE PROPRIETARULUI', 'Proprietarul se obliga:
1. sa predea imobilul si bunurile din acesta in stare corespunzatoare la data convenita;
2. sa il garanteze pe chirias de evictiune;
3. sa nu tulbure exercitarea dreptului de folosinta al chiriasului in mod legal;
4. sa efectueze lucrarile de intretinere necesare pentru a mentine imobilul si bunurile in stare de functionare normala.', 1),
('obligatii_chirias', 'IV. OBLIGATIILE CHIRIASULUI', 'Chiriasul se obliga:
1. sa plateasca chiria la termenele si in cuantumul stabilit prin prezentul contract;
2. sa foloseasca imobilul si bunurile din acesta ca un bun proprietar, numai pentru destinatia prevazuta in contract;
3. sa pastreze integritatea imobilului si bunurilor din acesta;
4. sa permita accesul proprietarului pentru verificari periodice;
5. sa restituie proprietarului, la incetarea contractului, imobilul si bunurile in starea in care au fost primite.', 2),
('durata_contract', 'V. DURATA CONTRACTULUI', 'Contractul se incheie pe o durata de [DURATA] luni, incepand cu data de [DATA_INCEPERE].
La expirarea acestei perioade, partile pot conveni prelungirea contractului prin act aditional.', 3),
('pret_modalitati_plata', 'VI. PRETUL SI MODALITATILE DE PLATA', 'Pretul inchirierii este de [PRET] [MONEDA]/luna.
Plata se face pana la data de 5 ale fiecarei luni, in avans.
Garantia constituita este in valoare de [GARANTIE] [MONEDA].', 4),
('garantie', 'VII. GARANTIA', 'La semnarea contractului, chiriasul depune o garantie in valoare de [GARANTIE] [MONEDA].
Garantia se restituie la incetarea contractului, dupa deducerea eventualelor daune sau datorii.
In cazul denuntarii unilaterale fara preaviz, garantia ramane la dispozitia proprietarului.', 5),
('forta_majora', 'VIII. CLAUZA DE FORTA MAJORA', 'Forta majora, indiferent de natura acesteia, exonereaza de raspundere partea care o invoca.
Partea care invoca forta majora are obligatia sa comunice celeilalte parti in termen de 5 zile producerea evenimentului.', 6),
('incetare_contract', 'IX. CONDITIILE DE INCETARE A CONTRACTULUI', '1. la expirarea duratei pentru care a fost incheiat;
2. in situatia nerespectarii clauzelor contractuale de catre una din parti;
3. clauza fortei majore;
4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile.', 7),
('dispozitii_finale', 'X. DISPOZITII FINALE', 'Prezentul contract reprezinta vointa partilor si inlatura orice intelegere anterioara.
Orice modificare sau completare a prezentului contract se face numai prin act aditional semnat de ambele parti.
Litigiile se vor solutiona pe cale amiabila sau, in caz contrar, de instantele judecatoresti competente.', 8);