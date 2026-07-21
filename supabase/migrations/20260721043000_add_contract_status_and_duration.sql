alter type public.operation_status add value if not exists 'paused';

alter table public.operations
  add column if not exists duration_months integer check (duration_months between 1 and 12),
  add column if not exists duration_indefinite boolean not null default true;
