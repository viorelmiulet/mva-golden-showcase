export interface ExtractedData {
  nume: string;
  prenume: string;
  cnp: string;
  seria: string;
  numar: string;
  emitent: string | null;
  data_emiterii: string | null;
  adresa: {
    strada: string;
    numar: string;
    bloc: string | null;
    scara: string | null;
    etaj: string | null;
    apartament: string | null;
    localitate: string;
    judet: string;
  };
  data_nasterii: string;
  locul_nasterii: string;
  sex: string;
  cetatenie: string;
  data_expirarii: string;
}

export interface PersonData {
  nume: string;
  prenume: string;
  cnp: string;
  seria_ci: string;
  numar_ci: string;
  ci_emitent: string;
  ci_data_emiterii: string;
  adresa: string;
  cetatenie: string;
  // Company entity (optional). When is_company=true, the fields above represent the legal representative.
  is_company?: boolean;
  company_name?: string;
  company_cui?: string;
  company_reg_com?: string;
  company_sediu?: string;
  function_title?: string; // funcția reprezentantului legal
}

export interface ContractData {
  proprietar: PersonData;
  chirias: PersonData;
  proprietate_adresa: string;
  proprietate_pret: string;
  garantie: string;
  garantie_status: "platita" | "de_platit";
  moneda: "EUR" | "RON";
  numar_camere: string;
  data_contract: string;
  data_incepere: string;
  durata_inchiriere: string;
  semnatura_proprietar: string;
  semnatura_chirias: string;
}

export interface SavedContract {
  id: string;
  created_at: string;
  client_name: string;
  client_prenume: string | null;
  client_cnp: string | null;
  client_seria_ci: string | null;
  client_numar_ci: string | null;
  client_adresa: string | null;
  client_ci_emitent: string | null;
  client_ci_data_emiterii: string | null;
  proprietar_name: string | null;
  proprietar_prenume: string | null;
  proprietar_cnp: string | null;
  proprietar_seria_ci: string | null;
  proprietar_numar_ci: string | null;
  proprietar_adresa: string | null;
  proprietar_ci_emitent: string | null;
  proprietar_ci_data_emiterii: string | null;
  property_address: string;
  property_price: number | null;
  property_currency: string | null;
  garantie_amount: number | null;
  garantie_status: string | null;
  contract_type: string;
  contract_date: string;
  duration_months: number | null;
  pdf_url: string | null;
  docx_url: string | null;
  proprietar_signed: boolean;
  chirias_signed: boolean;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  party_type: string;
  signature_token: string;
  signature_data: string | null;
  signed_at: string | null;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  condition: string;
  location: string;
  notes: string;
  images: string[];
}

export interface PartyBoxData {
  nume: string;
  cnp: string;
  seria: string;
  numar: string;
  emitent: string;
  dataEmiterii: string;
  domiciliu: string;
  cetatenie: string;
}

export const emptyPerson: PersonData = {
  nume: "",
  prenume: "",
  cnp: "",
  seria_ci: "",
  numar_ci: "",
  ci_emitent: "",
  ci_data_emiterii: "",
  adresa: "",
  cetatenie: "romana",
};

export const conditionLabels: Record<string, string> = {
  'noua': 'Noua',
  'foarte_buna': 'F. buna',
  'buna': 'Buna',
  'satisfacatoare': 'Satisf.',
  'uzata': 'Uzata'
};

export const imageSizeConfig = {
  small: { width: 35, height: 28, perRow: 4 },
  medium: { width: 50, height: 40, perRow: 3 },
  large: { width: 70, height: 56, perRow: 2 }
};
