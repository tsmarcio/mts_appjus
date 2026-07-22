create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

drop function if exists private.is_tenant_member(uuid, public.tenant_role[]);

create function private.is_tenant_member(check_tenant_id uuid, allowed_roles public.tenant_role[] default null)
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

revoke all on function private.is_tenant_member(uuid, public.tenant_role[]) from public;
grant execute on function private.is_tenant_member(uuid, public.tenant_role[]) to authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table
  public.tenants,
  public.tenant_members,
  public.subscriptions,
  public.clients,
  public.operations,
  public.documents,
  public.compliance_checks,
  public.audit_logs
  to authenticated;

create index if not exists tenants_owner_id_idx on public.tenants(owner_id);

drop policy if exists "Users can create own tenants" on public.tenants;
drop policy if exists "Members can read own tenants" on public.tenants;
drop policy if exists "Owners can update own tenants" on public.tenants;
drop policy if exists "Users can create own first membership" on public.tenant_members;
drop policy if exists "Members can read memberships" on public.tenant_members;
drop policy if exists "Owners can manage memberships" on public.tenant_members;
drop policy if exists "Owners can update memberships" on public.tenant_members;
drop policy if exists "Owners can delete memberships" on public.tenant_members;
drop policy if exists "Members can read subscriptions" on public.subscriptions;
drop policy if exists "Owners can create trial subscriptions" on public.subscriptions;
drop policy if exists "Members can manage tenant clients" on public.clients;
drop policy if exists "Members can manage tenant operations" on public.operations;
drop policy if exists "Members can read tenant documents" on public.documents;
drop policy if exists "Members can read tenant compliance" on public.compliance_checks;
drop policy if exists "Members can read tenant audit logs" on public.audit_logs;

create policy "Users can create own tenants"
  on public.tenants for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Members can read own tenants"
  on public.tenants for select
  to authenticated
  using (owner_id = (select auth.uid()) or private.is_tenant_member(id));

create policy "Owners can update own tenants"
  on public.tenants for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Users can create own first membership"
  on public.tenant_members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Members can read memberships"
  on public.tenant_members for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_tenant_member(tenant_id));

create policy "Owners can update memberships"
  on public.tenant_members for update
  to authenticated
  using (private.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]))
  with check (private.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]));

create policy "Owners can delete memberships"
  on public.tenant_members for delete
  to authenticated
  using (private.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]));

create policy "Members can read subscriptions"
  on public.subscriptions for select
  to authenticated
  using (private.is_tenant_member(tenant_id));

create policy "Owners can create trial subscriptions"
  on public.subscriptions for insert
  to authenticated
  with check (private.is_tenant_member(tenant_id, array['owner', 'admin']::public.tenant_role[]));

create policy "Members can manage tenant clients"
  on public.clients for all
  to authenticated
  using (private.is_tenant_member(tenant_id))
  with check (private.is_tenant_member(tenant_id, array['owner', 'admin', 'operator']::public.tenant_role[]));

create policy "Members can manage tenant operations"
  on public.operations for all
  to authenticated
  using (private.is_tenant_member(tenant_id))
  with check (private.is_tenant_member(tenant_id, array['owner', 'admin', 'operator']::public.tenant_role[]));

create policy "Members can read tenant documents"
  on public.documents for select
  to authenticated
  using (private.is_tenant_member(tenant_id));

create policy "Members can read tenant compliance"
  on public.compliance_checks for select
  to authenticated
  using (private.is_tenant_member(tenant_id));

create policy "Members can read tenant audit logs"
  on public.audit_logs for select
  to authenticated
  using (private.is_tenant_member(tenant_id));

drop function if exists public.is_tenant_member(uuid, public.tenant_role[]);
