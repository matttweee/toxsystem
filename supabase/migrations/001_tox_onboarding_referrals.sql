create extension if not exists pgcrypto;

create table if not exists public.tox_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique default ('TOX-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  email text not null unique,
  display_name text,
  status text not null default 'DEMO_PENDING' check (status in ('DEMO_PENDING','DEMO_ACTIVE','DEMO_EXPIRED','REAL_PENDING_PAYMENT','REAL_PAYING','REAL_SETTLED','REAL_INACTIVE')),
  referral_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  referred_by_client_id uuid references public.tox_clients(id),
  demo_started_at timestamptz,
  demo_expires_at timestamptz,
  conversion_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referred_by_client_id is null or referred_by_client_id <> id)
);

create table if not exists public.tox_document_acceptances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tox_clients(id) on delete cascade,
  contract_version text not null,
  regulation_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  unique(client_id, contract_version, regulation_version, privacy_version)
);

create table if not exists public.tox_installations (
  id uuid primary key default gen_random_uuid(),
  installation_id text not null unique,
  client_id uuid not null references public.tox_clients(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.tox_referral_relationships (
  id uuid primary key default gen_random_uuid(),
  referrer_client_id uuid not null references public.tox_clients(id) on delete cascade,
  referred_client_id uuid not null unique references public.tox_clients(id) on delete cascade,
  attributed_at timestamptz not null default now(),
  status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
  check (referrer_client_id <> referred_client_id)
);

create table if not exists public.tox_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tox_clients(id) on delete cascade,
  provider text not null default 'stripe',
  provider_payment_id text unique,
  gross_amount_cents bigint not null check (gross_amount_cents >= 0),
  tax_amount_cents bigint not null default 0 check (tax_amount_cents >= 0),
  processor_fee_cents bigint not null default 0 check (processor_fee_cents >= 0),
  refunded_amount_cents bigint not null default 0 check (refunded_amount_cents >= 0),
  chargeback_amount_cents bigint not null default 0 check (chargeback_amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null check(status in ('PENDING','PAID','SETTLED','FAILED','REFUNDED','CHARGEBACK')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tox_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  referrer_client_id uuid not null references public.tox_clients(id) on delete cascade,
  referred_client_id uuid not null references public.tox_clients(id) on delete cascade,
  payment_id uuid not null unique references public.tox_payments(id) on delete cascade,
  month_key date not null,
  eligible_net_revenue_cents bigint not null check(eligible_net_revenue_cents >= 0),
  raw_commission_cents bigint not null check(raw_commission_cents >= 0),
  approved_commission_cents bigint not null default 0 check(approved_commission_cents >= 0),
  status text not null default 'PENDING' check(status in ('PENDING','APPROVED','PAID','REVERSED')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz
);

create table if not exists public.tox_audit_events (
  id bigserial primary key,
  client_id uuid references public.tox_clients(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tox_clients_demo_expires_idx on public.tox_clients(demo_expires_at);
create index if not exists tox_clients_status_idx on public.tox_clients(status);
create index if not exists tox_referrals_referrer_idx on public.tox_referral_relationships(referrer_client_id);
create index if not exists tox_payments_client_status_idx on public.tox_payments(client_id,status);
create index if not exists tox_commission_referrer_month_idx on public.tox_commission_ledger(referrer_client_id,month_key);

create or replace function public.tox_weekly_fee(valid_referrals integer)
returns integer language sql immutable as $$
  select greatest(0, 35000 - 3500 * least(greatest(valid_referrals,0),10));
$$;

create or replace function public.tox_eligible_net_revenue(
  gross bigint, tax bigint, processor bigint, refunded bigint, chargeback bigint
) returns bigint language sql immutable as $$
  select greatest(0, gross - tax - processor - refunded - chargeback);
$$;

create or replace function public.tox_raw_commission(net_revenue bigint)
returns bigint language sql immutable as $$
  select floor(greatest(0,net_revenue) * 0.40)::bigint;
$$;

create or replace function public.tox_monthly_commission_cap(raw_month_total bigint)
returns bigint language sql immutable as $$
  select least(600000, greatest(0,raw_month_total));
$$;

alter table public.tox_clients enable row level security;
alter table public.tox_document_acceptances enable row level security;
alter table public.tox_installations enable row level security;
alter table public.tox_referral_relationships enable row level security;
alter table public.tox_payments enable row level security;
alter table public.tox_commission_ledger enable row level security;
alter table public.tox_audit_events enable row level security;

-- No anon/authenticated direct policies by design: production Vercel/Supabase server functions
-- must use the service role. Never expose the service-role key to the browser/client.
