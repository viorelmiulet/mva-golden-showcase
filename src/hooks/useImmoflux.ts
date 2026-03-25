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
}

export interface ImmofluxProperty {
  idnum: number;
  idstr: string;
  titluro: string;
  titluen: string;
  descrierero: string;
  descriereen: string;
  pretvanzare: number;
  pretinchiriere: number;
  monedavanzare: string;
  monedainchiriere: string;
  devanzare: boolean;
  nrcamere: number;
  suprafatautila: number;
  suprafatateren: number;
  etaj: string;
  localitate: string;
  judet: string;
  zona: string;
  latitudine: number;
  longitudine: number;
  images: ImmofluxImage[];
  agent: string;
  publicare: boolean;
  top: number;
  tiplocuinta: string;
  nrbai: number;
  anconstructie: number;
  status: string;
}

export interface ImmofluxAgent {
  id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
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
  if (property.devanzare && property.pretvanzare) {
    return `${property.pretvanzare.toLocaleString('ro-RO')} ${property.monedavanzare || 'EUR'}`;
  }
  if (property.pretinchiriere) {
    return `${property.pretinchiriere.toLocaleString('ro-RO')} ${property.monedainchiriere || 'EUR'}/lună`;
  }
  return 'Preț la cerere';
}

export function getTitle(property: ImmofluxProperty): string {
  return property.titluro || property.titluen || `Proprietate #${property.idnum}`;
}

export function getMainImage(property: ImmofluxProperty): string {
  if (!property.images || property.images.length === 0) return '/placeholder.svg';
  const sorted = [...property.images].sort((a, b) => a.pozitie - b.pozitie);
  return sorted[0].src;
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
