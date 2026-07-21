do $$
begin
  create type public.tenant_role as enum ('owner', 'admin', 'operator', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'operator',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.subscriptions (
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

alter table public.clients add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.operations add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.documents add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.compliance_checks add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.audit_logs add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

create index if not exists tenant_members_tenant_id_idx on public.tenant_members(tenant_id);
create index if not exists tenant_members_user_id_idx on public.tenant_members(user_id);
create index if not exists subscriptions_tenant_id_idx on public.subscriptions(tenant_id);
create index if not exists clients_tenant_id_idx on public.clients(tenant_id);
create index if not exists operations_tenant_id_idx on public.operations(tenant_id);
create index if not exists documents_tenant_id_idx on public.documents(tenant_id);
create index if not exists compliance_checks_tenant_id_idx on public.compliance_checks(tenant_id);
create index if not exists audit_logs_tenant_id_idx on public.audit_logs(tenant_id);

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.is_tenant_member(check_tenant_id uuid, allowed_roles public.tenant_role[] default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = check_tenant_id
      and user_id = auth.uid()
      and (allowed_roles is null or role = any(allowed_roles))
  );
$$;

drop policy if exists "Authenticated users can read clients" on public.clients;
drop policy if exists "Authenticated users can read operations" on public.operations;
drop policy if exists "Authenticated users can read documents" on public.documents;
drop policy if exists "Authenticated users can read compliance checks" on public.compliance_checks;
drop policy if exists "Authenticated users can read audit logs" on public.audit_logs;
drop policy if exists "App users can manage clients" on public.clients;
drop policy if exists "App users can manage operations" on public.operations;
drop policy if exists "Users can create own tenants" on public.tenants;
drop policy if exists "Members can read own tenants" on public.tenants;
drop policy if exists "Owners can update own tenants" on public.tenants;
drop policy if exists "Users can create own first membership" on public.tenant_members;
drop policy if exists "Members can read memberships" on public.tenant_members;
drop policy if exists "Owners can manage memberships" on public.tenant_members;
drop policy if exists "Members can read subscriptions" on public.subscriptions;
drop policy if exists "Owners can create trial subscriptions" on public.subscriptions;

create policy "Users can create own tenants"
  on public.tenants for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Members can read own tenants"
  on public.tenants for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_tenant_member(id)
  );

create policy "Owners can update own tenants"
  on public.tenants for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can create own first membership"
  on public.tenant_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Members can read memberships"
  on public.tenant_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_tenant_member(tenant_id)
  );

create policy "Owners can manage memberships"
  on public.tenant_members for all
  to authenticated
  using (public.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]))
  with check (public.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]));

create policy "Members can read subscriptions"
  on public.subscriptions for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "Owners can create trial subscriptions"
  on public.subscriptions for insert
  to authenticated
  with check (public.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]));

create policy "Members can manage tenant clients"
  on public.clients for all
  to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id, array['owner', 'admin', 'operator']::public.tenant_role[]));

create policy "Members can manage tenant operations"
  on public.operations for all
  to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id, array['owner', 'admin', 'operator']::public.tenant_role[]));

create policy "Members can read tenant documents"
  on public.documents for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "Members can read tenant compliance"
  on public.compliance_checks for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "Members can read tenant audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_tenant_member(tenant_id));
