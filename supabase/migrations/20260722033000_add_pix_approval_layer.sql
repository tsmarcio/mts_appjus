alter type public.subscription_status add value if not exists 'pending_payment';

create schema if not exists private;

create table if not exists private.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into private.app_admins (email)
values ('mts.ic@hotmail.com')
on conflict (email) do nothing;

create or replace function private.is_app_admin()
returns boolean
language sql
security definer
set search_path = private, public
as $$
  select exists (
    select 1
    from private.app_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function private.is_app_admin() from public;
grant execute on function private.is_app_admin() to authenticated;

alter table public.subscriptions add column if not exists payment_amount numeric(10, 2) not null default 29.99;
alter table public.subscriptions add column if not exists payment_method text not null default 'pix';
alter table public.subscriptions add column if not exists approved_at timestamptz;
alter table public.subscriptions add column if not exists approved_by uuid references auth.users(id) on delete set null;

drop policy if exists "App admins can read all tenants" on public.tenants;
drop policy if exists "App admins can read subscriptions" on public.subscriptions;
drop policy if exists "App admins can update subscriptions" on public.subscriptions;

create policy "App admins can read all tenants"
  on public.tenants for select
  to authenticated
  using (private.is_app_admin());

create policy "App admins can read subscriptions"
  on public.subscriptions for select
  to authenticated
  using (private.is_app_admin());

create policy "App admins can update subscriptions"
  on public.subscriptions for update
  to authenticated
  using (private.is_app_admin())
  with check (private.is_app_admin());
