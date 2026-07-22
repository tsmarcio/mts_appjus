create extension if not exists pgcrypto;

create or replace function public.register_app_user(
  p_email text,
  p_password text,
  p_organization_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, private, extensions, pg_catalog
as $$
declare
  normalized_email text := lower(trim(p_email));
  organization_name text := nullif(trim(coalesce(p_organization_name, '')), '');
  existing_user auth.users%rowtype;
  new_user_id uuid;
  new_tenant_id uuid;
begin
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    return jsonb_build_object('ok', false, 'code', 'invalid_email', 'message', 'Informe um e-mail valido.');
  end if;

  if length(coalesce(p_password, '')) < 6 then
    return jsonb_build_object('ok', false, 'code', 'weak_password', 'message', 'A senha precisa ter pelo menos 6 caracteres.');
  end if;

  select *
  into existing_user
  from auth.users
  where lower(email) = normalized_email
    and deleted_at is null
  limit 1;

  if existing_user.id is not null and existing_user.email_confirmed_at is not null then
    return jsonb_build_object('ok', false, 'code', 'email_exists', 'message', 'Este e-mail ja possui acesso. Use Entrar no sistema.');
  end if;

  if existing_user.id is null then
    new_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token,
      email_change_token_current,
      email_change_confirm_status,
      reauthentication_token,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      normalized_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', coalesce(organization_name, 'Base de ' || normalized_email)),
      false,
      now(),
      now(),
      false,
      false
    );
  else
    new_user_id := existing_user.id;

    update auth.users
    set encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = now(),
        confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change = '',
        phone_change = '',
        phone_change_token = '',
        email_change_token_current = '',
        email_change_confirm_status = 0,
        reauthentication_token = '',
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        updated_at = now(),
        deleted_at = null,
        banned_until = null
    where id = new_user_id;
  end if;

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    new_user_id,
    new_user_id::text,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', normalized_email, 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do update
  set identity_data = excluded.identity_data,
      updated_at = now();

  select tm.tenant_id
  into new_tenant_id
  from public.tenant_members tm
  where tm.user_id = new_user_id
  order by tm.created_at
  limit 1;

  if new_tenant_id is null then
    insert into public.tenants (name, owner_id)
    values (coalesce(organization_name, 'Base de ' || normalized_email), new_user_id)
    returning id into new_tenant_id;

    insert into public.tenant_members (tenant_id, user_id, role)
    values (new_tenant_id, new_user_id, 'owner');
  end if;

  if exists (select 1 from public.subscriptions where tenant_id = new_tenant_id) then
    update public.subscriptions
    set status = case
          when status = 'active' then status
          else 'pending_payment'::public.subscription_status
        end,
        provider = 'pix',
        provider_subscription_id = 'PIX_UNICO_29_99',
        billing_email = normalized_email,
        payment_amount = 29.99,
        payment_method = 'pix',
        updated_at = now()
    where tenant_id = new_tenant_id;
  else
    insert into public.subscriptions (
      tenant_id,
      status,
      provider,
      provider_subscription_id,
      billing_email,
      payment_amount,
      payment_method
    ) values (
      new_tenant_id,
      'pending_payment',
      'pix',
      'PIX_UNICO_29_99',
      normalized_email,
      29.99,
      'pix'
    );
  end if;

  return jsonb_build_object('ok', true, 'user_id', new_user_id, 'tenant_id', new_tenant_id);
end;
$$;

revoke all on function public.register_app_user(text, text, text) from public;
revoke all on function public.register_app_user(text, text, text) from authenticated;
grant execute on function public.register_app_user(text, text, text) to anon;
