alter table public.operations
  add column if not exists interest_percentage numeric(5, 2) not null default 30
  check (interest_percentage >= 0 and interest_percentage <= 100);
