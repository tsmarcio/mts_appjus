-- Seed de teste do MTS AppJus.
-- Cria 10 contratos para o usuario master, sem duplicar ao rodar novamente.

do $$
declare
  master_user_id uuid;
  master_tenant_id uuid;
begin
  select id
    into master_user_id
  from auth.users
  where lower(email) = 'mts.ic@hotmail.com'
    and deleted_at is null
  limit 1;

  if master_user_id is null then
    raise notice 'Usuario master mts.ic@hotmail.com nao encontrado. Crie o login antes de rodar este seed.';
    return;
  end if;

  select tenant_id
    into master_tenant_id
  from public.tenant_members
  where user_id = master_user_id
  order by created_at
  limit 1;

  if master_tenant_id is null then
    insert into public.tenants (name, owner_id)
    values ('MTS AppJus Master', master_user_id)
    returning id into master_tenant_id;

    insert into public.tenant_members (tenant_id, user_id, role)
    values (master_tenant_id, master_user_id, 'owner')
    on conflict (tenant_id, user_id) do nothing;
  end if;

  if exists (select 1 from public.subscriptions where tenant_id = master_tenant_id) then
    update public.subscriptions
      set status = 'active',
          billing_email = 'mts.ic@hotmail.com',
          provider = 'pix',
          provider_subscription_id = 'MASTER_TESTE',
          payment_amount = 29.99,
          payment_method = 'pix',
          approved_at = coalesce(approved_at, now()),
          approved_by = master_user_id,
          updated_at = now()
    where tenant_id = master_tenant_id;
  else
    insert into public.subscriptions (
      tenant_id,
      status,
      billing_email,
      provider,
      provider_subscription_id,
      payment_amount,
      payment_method,
      approved_at,
      approved_by,
      updated_at
    ) values (
      master_tenant_id,
      'active',
      'mts.ic@hotmail.com',
      'pix',
      'MASTER_TESTE',
      29.99,
      'pix',
      now(),
      master_user_id,
      now()
    );
  end if;

  create temp table seed_contracts (
    code text primary key,
    full_name text not null,
    document_number text,
    document_digits text,
    email text,
    email_domain text,
    phone text,
    phone_digits text,
    principal_amount numeric(14, 2) not null,
    status public.operation_status not null,
    risk public.risk_level not null,
    duration_months integer,
    duration_indefinite boolean not null,
    due_date date not null,
    interest_percentage numeric(5, 2) not null
  ) on commit drop;

  insert into seed_contracts values
    ('MTS-TEST-001', 'Ana Paula Ribeiro', '123.456.789-09', '12345678909', 'ana.ribeiro@example.com', 'example.com', '(21) 96497-6686', '21964976686', 100.00, 'active', 'low', 1, false, date '2026-07-22', 30),
    ('MTS-TEST-002', 'Bruno Henrique Costa', '987.654.321-00', '98765432100', 'bruno.costa@example.com', 'example.com', '(21) 98888-1002', '21988881002', 250.00, 'paused', 'medium', 3, false, date '2026-06-15', 20),
    ('MTS-TEST-003', 'Carla Mendes Souza', '111.222.333-44', '11122233344', 'carla.souza@example.com', 'example.com', '(21) 97777-1003', '21977771003', 480.50, 'overdue', 'high', null, true, date '2026-05-10', 40),
    ('MTS-TEST-004', 'Daniel Oliveira Martins', '222.333.444-55', '22233344455', 'daniel.martins@example.com', 'example.com', '(21) 96666-1004', '21966661004', 1200.00, 'active', 'low', 6, false, date '2026-07-01', 30),
    ('MTS-TEST-005', 'Elisa Fernandes Lima', '333.444.555-66', '33344455566', 'elisa.lima@example.com', 'example.com', '(21) 95555-1005', '21955551005', 75.90, 'overdue', 'high', 2, false, date '2026-04-28', 50),
    ('MTS-TEST-006', 'Felipe Araujo Nunes', '444.555.666-77', '44455566677', 'felipe.nunes@example.com', 'example.com', '(21) 94444-1006', '21944441006', 330.00, 'active', 'medium', 12, false, date '2026-08-05', 10),
    ('MTS-TEST-007', 'Gabriela Santos Rocha', '555.666.777-88', '55566677788', 'gabriela.rocha@example.com', 'example.com', '(21) 93333-1007', '21933331007', 890.00, 'paused', 'medium', null, true, date '2026-03-20', 60),
    ('MTS-TEST-008', 'Hugo Pereira Alves', '666.777.888-99', '66677788899', 'hugo.alves@example.com', 'example.com', '(21) 92222-1008', '21922221008', 1500.00, 'active', 'low', 4, false, date '2026-09-12', 30),
    ('MTS-TEST-009', 'Isabela Cristina Gomes', '777.888.999-10', '77788899910', 'isabela.gomes@example.com', 'example.com', '(21) 91111-1009', '21911111009', 60.00, 'overdue', 'high', 1, false, date '2026-02-25', 80),
    ('MTS-TEST-010', 'Joao Victor Barros', '888.999.111-22', '88899911122', 'joao.barros@example.com', 'example.com', '(21) 90000-1010', '21900001010', 2100.00, 'active', 'medium', null, true, date '2026-10-01', 25);

  delete from public.operations
  where tenant_id = master_tenant_id
    and code in (select code from seed_contracts);

  delete from public.clients
  where tenant_id = master_tenant_id
    and document_digits in (select document_digits from seed_contracts);

  insert into public.clients (
    tenant_id,
    full_name,
    document_number,
    document_digits,
    email,
    email_domain,
    phone,
    phone_digits
  )
  select
    master_tenant_id,
    full_name,
    document_number,
    document_digits,
    email,
    email_domain,
    phone,
    phone_digits
  from seed_contracts;

  insert into public.operations (
    tenant_id,
    code,
    client_id,
    principal_amount,
    status,
    risk,
    guarantee_type,
    duration_months,
    duration_indefinite,
    due_date,
    interest_percentage,
    updated_at
  )
  select
    master_tenant_id,
    sc.code,
    c.id,
    sc.principal_amount,
    sc.status,
    sc.risk,
    'Contrato privado',
    sc.duration_months,
    sc.duration_indefinite,
    sc.due_date,
    sc.interest_percentage,
    now()
  from seed_contracts sc
  join public.clients c
    on c.tenant_id = master_tenant_id
   and c.document_digits = sc.document_digits
  ;
end $$;
