-- Concepts table for Concept Design Library

create table if not exists public.concepts (
  concept text primary key,
  owner text not null,
  title text not null,
  description text not null,
  content text default '' not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_concepts_owner on public.concepts(owner);
create index if not exists idx_concepts_created_at on public.concepts(created_at desc);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger concepts_set_updated_at
before update on public.concepts
for each row execute function public.set_updated_at();

-- Enable RLS; service role bypasses policies.
alter table public.concepts enable row level security;

-- Allow anon read
--create policy "Allow anon read concepts" on public.concepts
--  for select using (true);
