import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/immoflux-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

// ── Types ──────────────────────────────────────────────
export interface ImmofluxImage {
  src: string;
  tip: string;
  pozitie: number;
  descriere?: string;
}

export interface ImmofluxLocalized {
  ro: string;
  en: string;
  de?: string;
  fr?: string;
  it?: string;
}

export interface ImmofluxAgentInfo {
  agentid: number;
  nume: string;
  email: string;
  phone?: string;
  telefon?: string;
  src?: string;
  functie?: ImmofluxLocalized;
}

export interface ImmofluxProperty {
  idnum: number;
  idstr: string;
  titlu: ImmofluxLocalized;
  descriere: ImmofluxLocalized;
  pretvanzare: number;
  pretinchiriere?: number;
  monedavanzare: string;
  monedainchiriere?: string;
  devanzare: number; // 1 = sale, 0 = rent
  nrcamere: number;
  suprafatautila: string | number;
  suprafatateren?: string | number;
  suprafataconstruita?: string | number;
  etaj: string;
  localitate: string;
  judet: string;
  zona: string;
  latitudine: number;
  longitudine: number;
  images: ImmofluxImage[];
  agent: number;
  agent_info?: ImmofluxAgentInfo;
  publicare: number;
  top: number;
  pole?: number;
  poleposition?: number;
  tiplocuinta: string;
  nrbai: number;
  anconstructie: number;
  status: string;
  nrbalcoane?: number;
  tipcompartimentare?: string;
  structurarezistenta?: string;
  adresa?: string;
}

export interface ImmofluxAgent {
  agentid: number;
  nume: string;
  email: string;
  phone?: string;
  telefon?: string;
  src?: string;
}

export interface ImmofluxContactData {
  nume: string;
  telefon: string;
  email?: string;
  mesaj?: string;
  id: number;
}

interface PropertiesResponse {
  data: ImmofluxProperty[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// ── API calls ──────────────────────────────────────────
async function fetchProperties(page: number): Promise<PropertiesResponse> {
  const res = await fetch(`${PROXY_BASE}/properties?page=${page}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch properties: ${res.status}`);
  return res.json();
}

async function fetchProperty(id: string | number): Promise<ImmofluxProperty> {
  const res = await fetch(`${PROXY_BASE}/properties/${id}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch property: ${res.status}`);
  return res.json();
}

async function fetchAgents(): Promise<ImmofluxAgent[]> {
  const res = await fetch(`${PROXY_BASE}/agents`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  return res.json();
}

async function sendContact(data: ImmofluxContactData): Promise<unknown> {
  const res = await fetch(`${PROXY_BASE}/contact`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to send contact: ${res.status}`);
  return res.json();
}

async function sendVisit(propertyId: number): Promise<void> {
  await fetch(`${PROXY_BASE}/visit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: propertyId }),
  }).catch(() => {});
}

// ── Helpers ────────────────────────────────────────────
export function formatPrice(property: ImmofluxProperty): string {
  if (property.devanzare === 1 && property.pretvanzare) {
    return `${Number(property.pretvanzare).toLocaleString('ro-RO')} ${property.monedavanzare || 'EUR'}`;
  }
  if (property.pretinchiriere) {
    return `${Number(property.pretinchiriere).toLocaleString('ro-RO')} ${property.monedainchiriere || 'EUR'}/lună`;
  }
  if (property.pretvanzare) {
    return `${Number(property.pretvanzare).toLocaleString('ro-RO')} ${property.monedavanzare || 'EUR'}`;
  }
  return 'Preț la cerere';
}

export function getTitle(property: ImmofluxProperty): string {
  if (typeof property.titlu === 'object' && property.titlu?.ro) {
    return property.titlu.ro;
  }
  if (typeof property.titlu === 'string') return property.titlu;
  return `Proprietate #${property.idnum}`;
}

export function getDescription(property: ImmofluxProperty): string {
  if (typeof property.descriere === 'object' && property.descriere?.ro) {
    return property.descriere.ro;
  }
  if (typeof property.descriere === 'string') return property.descriere;
  return '';
}

export function getMainImage(property: ImmofluxProperty): string {
  if (!property.images || property.images.length === 0) return '/placeholder.svg';
  const sorted = [...property.images].sort((a, b) => a.pozitie - b.pozitie);
  return sorted[0].src;
}

export function getSurface(property: ImmofluxProperty): number {
  const val = property.suprafatautila;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
}

export function isPoleProperty(property: Pick<ImmofluxProperty, 'pole' | 'poleposition'>): boolean {
  return property.pole === 1 || property.poleposition === 1;
}

// ── Hooks ──────────────────────────────────────────────
export function useProperties(page: number = 1) {
  return useQuery({
    queryKey: ['immoflux-properties', page],
    queryFn: () => fetchProperties(page),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProperty(id: string | number) {
  const query = useQuery({
    queryKey: ['immoflux-property', id],
    queryFn: () => fetchProperty(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // auto-send visit
  useEffect(() => {
    if (query.data?.idnum) {
      sendVisit(query.data.idnum);
    }
  }, [query.data?.idnum]);

  return query;
}

export function useAgents() {
  return useQuery({
    queryKey: ['immoflux-agents'],
    queryFn: fetchAgents,
    staleTime: 30 * 60 * 1000,
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: sendContact,
  });
}
