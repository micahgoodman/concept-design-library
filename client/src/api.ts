export type Concept = {
  concept: string;
  title: string;
  description: string;
  content?: string;
  createdAt: string;
  updatedAt?: string;
};

async function json<T>(res: Response): Promise<T> {
  const data = await res.json();
  return (data as any)?.payload ?? (data as any);
}

export async function fetchConcepts(): Promise<Concept[]> {
  return fetch('/api/concepts').then(json);
}

export async function getConcept(id: string): Promise<Concept> {
  return fetch(`/api/concepts/${encodeURIComponent(id)}`).then(json);
}

export async function createConcept(body: { title: string; description: string; content: string; }) {
  return fetch('/api/concepts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(json);
}

export async function updateTitle(id: string, title: string) {
  return fetch(`/api/concepts/${encodeURIComponent(id)}/title`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title })
  }).then(json);
}

export async function updateDescription(id: string, description: string) {
  return fetch(`/api/concepts/${encodeURIComponent(id)}/description`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description })
  }).then(json);
}

export async function updateContent(id: string, content: string) {
  return fetch(`/api/concepts/${encodeURIComponent(id)}/content`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content })
  }).then(json);
}

export async function deleteConcept(id: string) {
  return fetch(`/api/concepts/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(json);
}
