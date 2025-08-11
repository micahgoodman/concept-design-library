export type Concept = {
  concept: string;
  title: string;
  description: string;
  content?: string;
  createdAt: string;
  updatedAt?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
function url(path: string) {
  if (API_BASE.endsWith('/') && path.startsWith('/')) return API_BASE + path.slice(1);
  if (!API_BASE.endsWith('/') && !path.startsWith('/')) return `${API_BASE}/${path}`;
  return API_BASE + path;
}

function isSupabaseUrl(base: string): boolean {
  return /\.supabase\.co\//.test(base);
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {};
  // Include Supabase auth headers when targeting Edge Functions
  if (isSupabaseUrl(API_BASE) && SUPABASE_ANON_KEY) {
    headers['apikey'] = SUPABASE_ANON_KEY;
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  if (extra) {
    // Merge provided headers (object only, minimal implementation)
    const e = extra as Record<string, string>;
    for (const k in e) headers[k] = e[k];
  }
  return headers;
}

async function json<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let data: any = undefined;
  try {
    data = raw ? JSON.parse(raw) : undefined;
  } catch (_) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} non-JSON response: ${raw.slice(0, 200)}`);
    }
    // If ok but empty/non-JSON, just return as-is
    return (undefined as unknown) as T;
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || raw;
    throw new Error(`HTTP ${res.status}: ${typeof msg === 'string' ? msg.slice(0, 200) : JSON.stringify(msg).slice(0, 200)}`);
  }
  return (data as any)?.payload ?? (data as any);
}

export async function fetchConcepts(): Promise<Concept[]> {
  return fetch(url('/concepts'), { headers: buildHeaders() }).then(res => json<Concept[]>(res));
}

export async function getConcept(id: string): Promise<Concept> {
  return fetch(url(`/concepts/${encodeURIComponent(id)}`), { headers: buildHeaders() }).then(res => json<Concept>(res));
}

export async function createConcept(body: { title: string; description: string; content: string; }) {
  return fetch(url('/concepts'), {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  }).then(res => json<{ concept: string }>(res));
}

export async function updateTitle(id: string, title: string) {
  return fetch(url(`/concepts/${encodeURIComponent(id)}/title`), {
    method: 'PATCH', headers: buildHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ title })
  }).then(res => json<{ ok: boolean }>(res));
}

export async function updateDescription(id: string, description: string) {
  return fetch(url(`/concepts/${encodeURIComponent(id)}/description`), {
    method: 'PATCH', headers: buildHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ description })
  }).then(res => json<{ ok: boolean }>(res));
}

export async function updateContent(id: string, content: string) {
  return fetch(url(`/concepts/${encodeURIComponent(id)}/content`), {
    method: 'PATCH', headers: buildHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ content })
  }).then(res => json<{ ok: boolean }>(res));
}

export async function deleteConcept(id: string) {
  return fetch(url(`/concepts/${encodeURIComponent(id)}`), { method: 'DELETE', headers: buildHeaders() }).then(res => json<{ ok: boolean }>(res));
}
