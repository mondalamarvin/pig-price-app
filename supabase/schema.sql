-- FRESH install only. (Already have tables? Run migration-002-no-auth.sql instead.)
-- No login required: the browser sends a random voter id, and writes go through functions.

create table public.prices (
  id          uuid primary key default gen_random_uuid(),
  province    text not null check (char_length(province) between 2 and 60),
  town        text not null check (char_length(town) between 2 and 60),
  live_price  numeric(8,2) not null check (live_price between 1 and 1000),
  meat_price  numeric(8,2) not null check (meat_price between 1 and 2000),
  source      text not null default 'Public market',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index prices_province_town_key on public.prices (province, town);

create table public.price_history (
  id          uuid primary key default gen_random_uuid(),
  price_id    uuid not null references public.prices(id) on delete cascade,
  live_price  numeric(8,2) not null,
  meat_price  numeric(8,2) not null,
  source      text,
  created_at  timestamptz not null default now()
);
create index price_history_price_idx on public.price_history (price_id, created_at desc);

create table public.votes (
  price_id    uuid not null references public.prices(id) on delete cascade,
  voter_id    uuid not null,
  value       smallint not null check (value in (1, -1)),
  created_at  timestamptz not null default now(),
  primary key (price_id, voter_id)
);

alter table public.prices        enable row level security;
alter table public.price_history enable row level security;
alter table public.votes         enable row level security;
create policy "Anyone can read prices"  on public.prices        for select using (true);
create policy "Anyone can read history" on public.price_history for select using (true);
-- votes: RLS on, no policies = only the functions below can touch it

-- 5. Add or update a town's price (also records history and resets votes when the price changes)
create or replace function public.submit_price(
  p_province text, p_town text, p_live numeric, p_meat numeric, p_source text default 'Public market'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_old public.prices;
begin
  insert into public.prices (province, town, live_price, meat_price, source)
  values (p_province, p_town, p_live, p_meat, p_source)
  on conflict (province, town) do nothing
  returning id into v_id;

  if v_id is not null then                       -- brand new town
    insert into public.price_history (price_id, live_price, meat_price, source)
    values (v_id, p_live, p_meat, p_source);
    return v_id;
  end if;

  select * into v_old from public.prices where province = p_province and town = p_town for update;
  v_id := v_old.id;

  if v_old.live_price <> p_live or v_old.meat_price <> p_meat then
    insert into public.price_history (price_id, live_price, meat_price, source)
    values (v_id, p_live, p_meat, p_source);
    delete from public.votes where price_id = v_id;   -- new price, fresh votes
  end if;

  update public.prices
     set live_price = p_live, meat_price = p_meat, source = p_source, updated_at = now()
   where id = v_id;
  return v_id;
end $$;

create or replace function public.cast_vote(p_price_id uuid, p_voter uuid, p_value smallint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_value not in (-1, 0, 1) then raise exception 'invalid vote'; end if;
  if p_value = 0 then
    delete from public.votes where price_id = p_price_id and voter_id = p_voter;
  else
    insert into public.votes (price_id, voter_id, value) values (p_price_id, p_voter, p_value)
    on conflict (price_id, voter_id) do update set value = excluded.value;
  end if;
end $$;

create or replace function public.my_votes(p_voter uuid)
returns table (price_id uuid, value smallint)
language sql stable security definer set search_path = public as
$$ select price_id, value from public.votes where voter_id = p_voter $$;

grant execute on function public.submit_price(text, text, numeric, numeric, text) to anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, smallint)                  to anon, authenticated;
grant execute on function public.my_votes(uuid)                                   to anon, authenticated;

-- 6. View: current price, vote counts, and change since the previous price
drop view if exists public.prices_with_votes;
create view public.prices_with_votes as
select p.id, p.province, p.town, p.live_price, p.meat_price, p.source, p.created_at, p.updated_at,
       (select count(*) from public.votes v where v.price_id = p.id and v.value =  1) as up,
       (select count(*) from public.votes v where v.price_id = p.id and v.value = -1) as down,
       p.live_price - h.live_price as live_change,
       p.meat_price - h.meat_price as meat_change
from public.prices p
left join lateral (
  select live_price, meat_price from public.price_history
  where price_id = p.id order by created_at desc offset 1 limit 1
) h on true;
grant select on public.prices_with_votes to anon, authenticated;
