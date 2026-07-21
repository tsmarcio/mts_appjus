alter table public.clients
  add column if not exists document_digits text,
  add column if not exists email_domain text,
  add column if not exists phone_digits text;

create index if not exists clients_document_digits_idx on public.clients(document_digits);
create index if not exists clients_email_domain_idx on public.clients(email_domain);
create index if not exists clients_phone_digits_idx on public.clients(phone_digits);
