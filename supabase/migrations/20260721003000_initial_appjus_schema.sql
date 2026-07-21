create extension if not exists "pgcrypto";

create type public.operation_status as enum (
  'draft',
  'screening',
  'document_review',
  'signature_pending',
  'active',
  'paused',
  'overdue',
  'closed'
);

create type public.risk_level as enum ('low', 'medium', 'high');
create type public.tenant_role as enum ('owner', 'admin', 'operator', 'viewer');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'operator',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  status public.subscription_status not null default 'trialing',
  billing_email text,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  full_name text not null,
  document_number text,
  document_digits text,
  email text,
  email_domain text,
  phone text,
  phone_digits text,
  created_at timestamptz not null default now()
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  code text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  principal_amount numeric(14, 2) not null check (principal_amount >= 0),
  status public.operation_status not null default 'draft',
  risk public.risk_level not null default 'medium',
  guarantee_type text,
  requested_by text,
  duration_months integer check (duration_months between 1 and 12),
  duration_indefinite boolean not null default true,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text,
  sha256 text,
  created_at timestamptz not null default now()
);

create table public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  label text not null,
  status text not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  operation_id uuid references public.operations(id) on delete set null,
  actor text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index operations_client_id_idx on public.operations(client_id);
create index tenant_members_tenant_id_idx on public.tenant_members(tenant_id);
create index tenant_members_user_id_idx on public.tenant_members(user_id);
create index subscriptions_tenant_id_idx on public.subscriptions(tenant_id);
create index clients_tenant_id_idx on public.clients(tenant_id);
create index operations_tenant_id_idx on public.operations(tenant_id);
create index documents_tenant_id_idx on public.documents(tenant_id);
create index compliance_checks_tenant_id_idx on public.compliance_checks(tenant_id);
create index audit_logs_tenant_id_idx on public.audit_logs(tenant_id);
create index operations_status_idx on public.operations(status);
create index clients_document_digits_idx on public.clients(document_digits);
create index clients_email_domain_idx on public.clients(email_domain);
create index clients_phone_digits_idx on public.clients(phone_digits);
create index documents_operation_id_idx on public.documents(operation_id);
create index compliance_checks_operation_id_idx on public.compliance_checks(operation_id);
create index audit_logs_operation_id_idx on public.audit_logs(operation_id);

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.clients enable row level security;
alter table public.operations enable row level security;
alter table public.documents enable row level security;
alter table public.compliance_checks enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can create own tenants"
  on public.tenants for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Members can read own tenants"
  on public.tenants for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tenants.id
        and tenant_members.user_id = auth.uid()
    )
  );

create policy "Users can create own first membership"
  on public.tenant_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Members can read memberships"
  on public.tenant_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tenant_members own_membership
      where own_membership.tenant_id = tenant_members.tenant_id
        and own_membership.user_id = auth.uid()
    )
  );

create policy "Members can read subscriptions"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = subscriptions.tenant_id
        and tenant_members.user_id = auth.uid()
    )
  );

create policy "Members can manage tenant clients"
  on public.clients for all
  to authenticated
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = clients.tenant_id
        and tenant_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = clients.tenant_id
        and tenant_members.user_id = auth.uid()
        and tenant_members.role in ('owner', 'admin', 'operator')
    )
  );

create policy "Members can manage tenant operations"
  on public.operations for all
  to authenticated
  using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = operations.tenant_id
        and tenant_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = operations.tenant_id
        and tenant_members.user_id = auth.uid()
        and tenant_members.role in ('owner', 'admin', 'operator')
    )
  );
