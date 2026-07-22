-- Seed de teste do MTS AppJus.
-- Cria 50 contratos para o usuario master, sem duplicar ao rodar novamente.

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
    ('MTS-TEST-001', 'Ana Paula', '123.450.037-07', '12345003707', 'ana.paula@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-0173', '21964000173', 136.15, 'active', 'high', 2, false, date '2026-07-02', 0),
    ('MTS-TEST-002', 'Bruno Henrique', '123.450.074-43', '12345007443', 'bruno.henrique@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-0346', '21964000346', 197.30, 'paused', 'low', 3, false, date '2026-08-03', 10),
    ('MTS-TEST-003', 'Carla Mendes', '123.450.111-22', '12345011122', 'carla.mendes@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-0519', '21964000519', 258.45, 'overdue', 'medium', 4, false, date '2026-09-04', 20),
    ('MTS-TEST-004', 'Daniel Oliveira', '123.450.148-14', '12345014814', 'daniel.oliveira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-0692', '21964000692', 319.60, 'active', 'high', 5, false, date '2026-10-05', 30),
    ('MTS-TEST-005', 'Elisa Fernandes', '123.450.185-69', '12345018569', 'elisa.fernandes@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-0865', '21964000865', 286.75, 'paused', 'low', 6, false, date '2026-11-06', 40),
    ('MTS-TEST-006', 'Felipe Araujo', '123.450.222-48', '12345022248', 'felipe.araujo@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-1038', '21964001038', 347.90, 'overdue', 'medium', 7, false, date '2026-12-07', 50),
    ('MTS-TEST-007', 'Gabriela Santos', '123.450.259-30', '12345025930', 'gabriela.santos@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-1211', '21964001211', 409.05, 'active', 'high', null, true, date '2026-01-08', 60),
    ('MTS-TEST-008', 'Hugo Pereira', '123.450.296-84', '12345029684', 'hugo.pereira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-1384', '21964001384', 470.20, 'paused', 'low', 9, false, date '2026-02-09', 70),
    ('MTS-TEST-009', 'Isabela Cristina', '123.450.333-63', '12345033363', 'isabela.cristina@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-1557', '21964001557', 531.35, 'overdue', 'medium', 10, false, date '2026-03-10', 80),
    ('MTS-TEST-010', 'Joao Victor', '123.450.370-08', '12345037008', 'joao.victor@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-1730', '21964001730', 498.50, 'active', 'high', 11, false, date '2026-04-11', 90),
    ('MTS-TEST-011', 'Karina Duarte', '123.450.407-34', '12345040734', 'karina.duarte@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-1903', '21964001903', 559.65, 'paused', 'low', 12, false, date '2026-05-12', 100),
    ('MTS-TEST-012', 'Lucas Gabriel', '123.450.444-89', '12345044489', 'lucas.gabriel@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-2076', '21964002076', 620.80, 'overdue', 'medium', 1, false, date '2026-06-13', 0),
    ('MTS-TEST-013', 'Mariana Lopes', '123.450.481-23', '12345048123', 'mariana.lopes@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-2249', '21964002249', 681.95, 'active', 'high', 2, false, date '2026-07-14', 10),
    ('MTS-TEST-014', 'Nicolas Almeida', '123.450.518-50', '12345051850', 'nicolas.almeida@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-2422', '21964002422', 743.10, 'paused', 'low', null, true, date '2026-08-15', 20),
    ('MTS-TEST-015', 'Otavio Ramos', '123.450.555-02', '12345055502', 'otavio.ramos@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-2595', '21964002595', 710.25, 'overdue', 'medium', 4, false, date '2026-09-16', 30),
    ('MTS-TEST-016', 'Patricia Moreira', '123.450.592-49', '12345059249', 'patricia.moreira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-2768', '21964002768', 771.40, 'active', 'high', 5, false, date '2026-10-17', 40),
    ('MTS-TEST-017', 'Rafael Teixeira', '123.450.629-75', '12345062975', 'rafael.teixeira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-2941', '21964002941', 832.55, 'paused', 'low', 6, false, date '2026-11-18', 50),
    ('MTS-TEST-018', 'Sabrina Farias', '123.450.666-10', '12345066610', 'sabrina.farias@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-3114', '21964003114', 893.70, 'overdue', 'medium', 7, false, date '2026-12-19', 60),
    ('MTS-TEST-019', 'Thiago Monteiro', '123.450.703-07', '12345070307', 'thiago.monteiro@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-3287', '21964003287', 954.85, 'active', 'high', 8, false, date '2026-01-20', 70),
    ('MTS-TEST-020', 'Vanessa Carvalho', '123.450.740-43', '12345074043', 'vanessa.carvalho@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-3460', '21964003460', 922.00, 'paused', 'low', 9, false, date '2026-02-21', 80),
    ('MTS-TEST-021', 'Wagner Batista', '123.450.777-35', '12345077735', 'wagner.batista@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-3633', '21964003633', 983.15, 'overdue', 'medium', null, true, date '2026-03-22', 90),
    ('MTS-TEST-022', 'Yasmin Correia', '123.450.814-14', '12345081414', 'yasmin.correia@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-3806', '21964003806', 1044.30, 'active', 'high', 11, false, date '2026-04-23', 100),
    ('MTS-TEST-023', 'Alexandre Freitas', '123.450.851-69', '12345085169', 'alexandre.freitas@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-3979', '21964003979', 1105.45, 'paused', 'low', 12, false, date '2026-05-24', 0),
    ('MTS-TEST-024', 'Bianca Vieira', '123.450.888-50', '12345088850', 'bianca.vieira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-4152', '21964004152', 1166.60, 'overdue', 'medium', 1, false, date '2026-06-25', 10),
    ('MTS-TEST-025', 'Caio Augusto', '123.450.925-30', '12345092530', 'caio.augusto@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-4325', '21964004325', 1133.75, 'active', 'high', 2, false, date '2026-07-26', 20),
    ('MTS-TEST-026', 'Debora Nascimento', '123.450.962-84', '12345096284', 'debora.nascimento@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-4498', '21964004498', 1194.90, 'paused', 'low', 3, false, date '2026-08-27', 30),
    ('MTS-TEST-027', 'Eduardo Lima', '123.450.999-76', '12345099976', 'eduardo.lima@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-4671', '21964004671', 1256.05, 'overdue', 'medium', 4, false, date '2026-09-01', 40),
    ('MTS-TEST-028', 'Fernanda Prado', '123.451.036-71', '12345103671', 'fernanda.prado@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-4844', '21964004844', 1317.20, 'active', 'high', null, true, date '2026-10-02', 50),
    ('MTS-TEST-029', 'Gustavo Martins', '123.451.073-16', '12345107316', 'gustavo.martins@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-5017', '21964005017', 1378.35, 'paused', 'low', 6, false, date '2026-11-03', 60),
    ('MTS-TEST-030', 'Helena Castro', '123.451.110-03', '12345111003', 'helena.castro@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-5190', '21964005190', 1345.50, 'overdue', 'medium', 7, false, date '2026-12-04', 70),
    ('MTS-TEST-031', 'Igor Rezende', '123.451.147-97', '12345114797', 'igor.rezende@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-5363', '21964005363', 1406.65, 'active', 'high', 8, false, date '2026-01-05', 80),
    ('MTS-TEST-032', 'Juliana Barbosa', '123.451.184-31', '12345118431', 'juliana.barbosa@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-5536', '21964005536', 1467.80, 'paused', 'low', 9, false, date '2026-02-06', 90),
    ('MTS-TEST-033', 'Leandro Rocha', '123.451.221-10', '12345122110', 'leandro.rocha@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-5709', '21964005709', 1528.95, 'overdue', 'medium', 10, false, date '2026-03-07', 100),
    ('MTS-TEST-034', 'Monica Tavares', '123.451.258-02', '12345125802', 'monica.tavares@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-5882', '21964005882', 1590.10, 'active', 'high', 11, false, date '2026-04-08', 0),
    ('MTS-TEST-035', 'Natalia Campos', '123.451.295-57', '12345129557', 'natalia.campos@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-6055', '21964006055', 1557.25, 'paused', 'low', null, true, date '2026-05-09', 10),
    ('MTS-TEST-036', 'Paulo Sergio', '123.451.332-36', '12345133236', 'paulo.sergio@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-6228', '21964006228', 1618.40, 'overdue', 'medium', 1, false, date '2026-06-10', 20),
    ('MTS-TEST-037', 'Renata Azevedo', '123.451.369-28', '12345136928', 'renata.azevedo@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-6401', '21964006401', 1679.55, 'active', 'high', 2, false, date '2026-07-11', 30),
    ('MTS-TEST-038', 'Samuel Dias', '123.451.406-07', '12345140607', 'samuel.dias@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-6574', '21964006574', 1740.70, 'paused', 'low', 3, false, date '2026-08-12', 40),
    ('MTS-TEST-039', 'Tatiane Pires', '123.451.443-51', '12345144351', 'tatiane.pires@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-6747', '21964006747', 1801.85, 'overdue', 'medium', 4, false, date '2026-09-13', 50),
    ('MTS-TEST-040', 'Vinicius Gomes', '123.451.480-04', '12345148004', 'vinicius.gomes@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-6920', '21964006920', 1769.00, 'active', 'high', 5, false, date '2026-10-14', 60),
    ('MTS-TEST-041', 'Adriana Silveira', '123.451.517-22', '12345151722', 'adriana.silveira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-7093', '21964007093', 1830.15, 'paused', 'low', 6, false, date '2026-11-15', 70),
    ('MTS-TEST-042', 'Breno Matos', '123.451.554-77', '12345155477', 'breno.matos@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-7266', '21964007266', 1891.30, 'overdue', 'medium', null, true, date '2026-12-16', 80),
    ('MTS-TEST-043', 'Camila Nogueira', '123.451.591-11', '12345159111', 'camila.nogueira@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-7439', '21964007439', 1952.45, 'active', 'high', 8, false, date '2026-01-17', 90),
    ('MTS-TEST-044', 'Diego Queiroz', '123.451.628-48', '12345162848', 'diego.queiroz@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-7612', '21964007612', 2013.60, 'paused', 'low', 9, false, date '2026-02-18', 100),
    ('MTS-TEST-045', 'Erica Miranda', '123.451.665-92', '12345166592', 'erica.miranda@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-7785', '21964007785', 1980.75, 'overdue', 'medium', 10, false, date '2026-03-19', 0),
    ('MTS-TEST-046', 'Fabio Neves', '123.451.702-71', '12345170271', 'fabio.neves@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-7958', '21964007958', 2041.90, 'active', 'high', 11, false, date '2026-04-20', 10),
    ('MTS-TEST-047', 'Giovana Sales', '123.451.739-63', '12345173963', 'giovana.sales@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-8131', '21964008131', 2103.05, 'paused', 'low', 12, false, date '2026-05-21', 20),
    ('MTS-TEST-048', 'Henrique Moraes', '123.451.776-08', '12345177608', 'henrique.moraes@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-8304', '21964008304', 2164.20, 'overdue', 'medium', 1, false, date '2026-06-22', 30),
    ('MTS-TEST-049', 'Leticia Andrade', '123.451.813-97', '12345181397', 'leticia.andrade@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-8477', '21964008477', 2225.35, 'active', 'high', null, true, date '2026-07-23', 40),
    ('MTS-TEST-050', 'Marcelo Ribeiro', '123.451.850-31', '12345185031', 'marcelo.ribeiro@testeappjus.com.br', 'testeappjus.com.br', '(21) 96400-8650', '21964008650', 2192.50, 'paused', 'low', 3, false, date '2026-08-24', 50);

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
