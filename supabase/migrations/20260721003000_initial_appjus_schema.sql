create extension if not exists "pgcrypto";

create type public.operation_status as enum (
  'draft',
  'screening',
  'document_review',
  'signature_pending',
  'active',
  'overdue',
  'closed'
);

create type public.risk_level as enum ('low', 'medium', 'high');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  document_number text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  principal_amount numeric(14, 2) not null check (principal_amount >= 0),
  status public.operation_status not null default 'draft',
  risk public.risk_level not null default 'medium',
  guarantee_type text,
  requested_by text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text,
  sha256 text,
  created_at timestamptz not null default now()
);

create table public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete cascade,
  label text not null,
  status text not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid references public.operations(id) on delete set null,
  actor text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index operations_client_id_idx on public.operations(client_id);
create index operations_status_idx on public.operations(status);
create index documents_operation_id_idx on public.documents(operation_id);
create index compliance_checks_operation_id_idx on public.compliance_checks(operation_id);
create index audit_logs_operation_id_idx on public.audit_logs(operation_id);

alter table public.clients enable row level security;
alter table public.operations enable row level security;
alter table public.documents enable row level security;
alter table public.compliance_checks enable row level security;
alter table public.audit_logs enable row level security;

create policy "Authenticated users can read clients"
  on public.clients for select
  to authenticated
  using (true);

create policy "Authenticated users can read operations"
  on public.operations for select
  to authenticated
  using (true);

create policy "Authenticated users can read documents"
  on public.documents for select
  to authenticated
  using (true);

create policy "Authenticated users can read compliance checks"
  on public.compliance_checks for select
  to authenticated
  using (true);

create policy "Authenticated users can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (true);

create policy "App users can manage clients"
  on public.clients for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "App users can manage operations"
  on public.operations for all
  to anon, authenticated
  using (true)
  with check (true);
