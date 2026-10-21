-- JetPesa schema. Run in Supabase SQL editor. All money moves happen in
-- SECURITY DEFINER functions callable only with the service role.

create extension if not exists pgcrypto;

-- ───────────── tables ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  mpesa_phone text unique,
  wallet_balance numeric(14,2) not null default 0 check (wallet_balance >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id),
  delta numeric(14,2) not null,
  reason text not null,         -- deposit | bet | payout | withdrawal | withdrawal_refund
  ref text,
  balance_after numeric(14,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_ledger_user_idx on public.wallet_ledger(user_id, created_at desc);

create table if not exists public.deposits (
  reference text primary key,
  user_id uuid not null references public.profiles(id),
  amount integer not null check (amount > 0),
  phone text not null,
  status text not null default 'pending',   -- pending | completed | failed
  provider text not null default 'paystack',
  credited boolean not null default false,
  failure_reason text,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deposits_user_idx on public.deposits(user_id, created_at desc);

create table if not exists public.withdrawals (
  reference text primary key,
  user_id uuid not null references public.profiles(id),
  amount integer not null check (amount > 0),
  phone text not null,
  status text not null default 'processing', -- processing | paid | failed
  transfer_code text,
  failure_reason text,
  refunded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rounds (
  nonce bigint primary key,
  crash_point numeric(10,2) not null,       -- SERVER ONLY until crash_at has passed
  commitment text not null,                 -- sha256(round_seed), public
  start_at timestamptz not null,            -- betting opens
  takeoff_at timestamptz not null,          -- betting closes, multiplier starts
  crash_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bets (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id),
  round_nonce bigint not null references public.rounds(nonce),
  deck text not null check (deck in ('A','B')),
  stake numeric(14,2) not null check (stake > 0),
  auto_cashout numeric(10,2) check (auto_cashout is null or auto_cashout >= 1.01),
  status text not null default 'open',      -- open | won | lost
  cashout_multiplier numeric(10,2),
  payout numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, round_nonce, deck)
);
create index if not exists bets_round_idx on public.bets(round_nonce);
create index if not exists bets_user_idx on public.bets(user_id, created_at desc);

-- ───────────── RLS: clients may only READ their own rows ─────────────
alter table public.profiles enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.rounds enable row level security;   -- no policies: service role only
alter table public.bets enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own ledger" on public.wallet_ledger;
create policy "own ledger" on public.wallet_ledger for select using (auth.uid() = user_id);
drop policy if exists "own deposits" on public.deposits;
create policy "own deposits" on public.deposits for select using (auth.uid() = user_id);
drop policy if exists "own withdrawals" on public.withdrawals;
create policy "own withdrawals" on public.withdrawals for select using (auth.uid() = user_id);
drop policy if exists "own bets" on public.bets;
create policy "own bets" on public.bets for select using (auth.uid() = user_id);

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ───────────── profile creation on signup ─────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, mpesa_phone)
  values (new.id, new.email, new.raw_user_meta_data->>'mpesa_phone');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── wallet functions ─────────────
create or replace function public.credit_deposit(p_reference text, p_response jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare d public.deposits; new_bal numeric;
begin
  select * into d from public.deposits where reference = p_reference for update;
  if not found or d.credited then return false; end if;
  update public.profiles set wallet_balance = wallet_balance + d.amount
    where id = d.user_id returning wallet_balance into new_bal;
  update public.deposits set status='completed', credited=true,
    provider_response = p_response, updated_at = now() where reference = p_reference;
  insert into public.wallet_ledger(user_id, delta, reason, ref, balance_after)
    values (d.user_id, d.amount, 'deposit', p_reference, new_bal);
  return true;
end $$;

create or replace function public.start_withdrawal(p_user uuid, p_amount integer, p_phone text, p_reference text)
returns numeric language plpgsql security definer set search_path = public as $$
declare new_bal numeric;
begin
  update public.profiles set wallet_balance = wallet_balance - p_amount
    where id = p_user and wallet_balance >= p_amount returning wallet_balance into new_bal;
  if new_bal is null then raise exception 'Insufficient balance.'; end if;
  insert into public.withdrawals(reference, user_id, amount, phone) values (p_reference, p_user, p_amount, p_phone);
  insert into public.wallet_ledger(user_id, delta, reason, ref, balance_after)
    values (p_user, -p_amount, 'withdrawal', p_reference, new_bal);
  return new_bal;
end $$;

create or replace function public.fail_withdrawal(p_reference text, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
declare w public.withdrawals; new_bal numeric;
begin
  select * into w from public.withdrawals where reference = p_reference for update;
  if not found or w.refunded or w.status = 'paid' then return false; end if;
  update public.profiles set wallet_balance = wallet_balance + w.amount
    where id = w.user_id returning wallet_balance into new_bal;
  update public.withdrawals set status='failed', refunded=true, failure_reason=p_reason, updated_at=now()
    where reference = p_reference;
  insert into public.wallet_ledger(user_id, delta, reason, ref, balance_after)
    values (w.user_id, w.amount, 'withdrawal_refund', p_reference, new_bal);
  return true;
end $$;

-- ───────────── game functions ─────────────
create or replace function public.place_bet(p_user uuid, p_round bigint, p_deck text, p_stake numeric, p_auto numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare r public.rounds; new_bal numeric;
begin
  select * into r from public.rounds where nonce = p_round;
  if not found or now() >= r.takeoff_at then raise exception 'Betting is closed for this round.'; end if;
  update public.profiles set wallet_balance = wallet_balance - p_stake
    where id = p_user and wallet_balance >= p_stake returning wallet_balance into new_bal;
  if new_bal is null then raise exception 'Insufficient balance.'; end if;
  begin
    insert into public.bets(user_id, round_nonce, deck, stake, auto_cashout)
      values (p_user, p_round, p_deck, p_stake, p_auto);
  exception when unique_violation then
    raise exception 'You already have a bet on this deck for this round.';
  end;
  insert into public.wallet_ledger(user_id, delta, reason, ref, balance_after)
    values (p_user, -p_stake, 'bet', p_round::text || p_deck, new_bal);
  return new_bal;
end $$;

-- multiplier at a given instant for a round (same curve the client draws)
create or replace function public.round_multiplier(p_takeoff timestamptz, p_at timestamptz)
returns numeric language sql immutable as $$
  select greatest(1.00, floor(exp(0.078 * extract(epoch from (p_at - p_takeoff))) * 100) / 100)::numeric
$$;

create or replace function public.cash_out(p_user uuid, p_round bigint, p_deck text, p_auto_only boolean default false)
returns table(result text, multiplier numeric, payout numeric, balance numeric)
language plpgsql security definer set search_path = public as $$
declare r public.rounds; b public.bets; m numeric; pay numeric; new_bal numeric; t timestamptz := clock_timestamp();
begin
  select * into b from public.bets where user_id=p_user and round_nonce=p_round and deck=p_deck for update;
  if not found or b.status <> 'open' then return query select 'no_bet'::text, null::numeric, null::numeric, null::numeric; return; end if;
  select * into r from public.rounds where nonce = p_round;
  if t < r.takeoff_at then return query select 'not_flying'::text, null::numeric, null::numeric, null::numeric; return; end if;
  m := public.round_multiplier(r.takeoff_at, t);
  if p_auto_only and (b.auto_cashout is null or m < b.auto_cashout) then
    if t >= r.crash_at or m >= r.crash_point then
      update public.bets set status='lost' where id = b.id;
      return query select 'crashed'::text, null::numeric, null::numeric, null::numeric; return;
    end if;
    return query select 'too_early'::text, null::numeric, null::numeric, null::numeric; return;
  end if;
  if t >= r.crash_at or m >= r.crash_point then
    update public.bets set status='lost' where id = b.id;
    return query select 'crashed'::text, null::numeric, null::numeric, null::numeric; return;
  end if;
  if b.auto_cashout is not null and m >= b.auto_cashout then m := b.auto_cashout; end if;
  pay := floor(b.stake * m * 100) / 100;
  update public.bets set status='won', cashout_multiplier=m, payout=pay where id = b.id;
  update public.profiles set wallet_balance = wallet_balance + pay where id = p_user returning wallet_balance into new_bal;
  insert into public.wallet_ledger(user_id, delta, reason, ref, balance_after)
    values (p_user, pay, 'payout', p_round::text || p_deck, new_bal);
  return query select 'won'::text, m, pay, new_bal;
end $$;

-- Settles every open bet of rounds that have crashed: auto-cashouts below the
-- crash point are paid, everything else is lost. Safe to call repeatedly.
create or replace function public.settle_crashed_rounds()
returns integer language plpgsql security definer set search_path = public as $$
declare b record; pay numeric; new_bal numeric; n integer := 0;
begin
  for b in
    select bt.*, r.crash_point from public.bets bt
    join public.rounds r on r.nonce = bt.round_nonce
    where bt.status = 'open' and r.crash_at <= now()
    order by bt.id for update of bt skip locked
  loop
    if b.auto_cashout is not null and b.auto_cashout < b.crash_point then
      pay := floor(b.stake * b.auto_cashout * 100) / 100;
      update public.bets set status='won', cashout_multiplier=b.auto_cashout, payout=pay where id = b.id;
      update public.profiles set wallet_balance = wallet_balance + pay where id = b.user_id returning wallet_balance into new_bal;
      insert into public.wallet_ledger(user_id, delta, reason, ref, balance_after)
        values (b.user_id, pay, 'payout', b.round_nonce::text || b.deck, new_bal);
    else
      update public.bets set status='lost' where id = b.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.credit_deposit(text, jsonb), public.start_withdrawal(uuid, integer, text, text),
  public.fail_withdrawal(text, text), public.place_bet(uuid, bigint, text, numeric, numeric),
  public.cash_out(uuid, bigint, text, boolean), public.settle_crashed_rounds() from public, anon, authenticated;
grant execute on function public.credit_deposit(text, jsonb), public.start_withdrawal(uuid, integer, text, text),
  public.fail_withdrawal(text, text), public.place_bet(uuid, bigint, text, numeric, numeric),
  public.cash_out(uuid, bigint, text, boolean), public.settle_crashed_rounds() to service_role;
