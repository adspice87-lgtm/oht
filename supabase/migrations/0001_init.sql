-- =====================================================================
-- Laweta (Uber dla lawet) - migracja inicjalna
-- Postgres 15+ / Supabase + PostGIS
-- Uwaga: w Supabase PostGIS zwykle ląduje w schemacie "extensions".
-- Wszystkie funkcje mają search_path = public, extensions, więc działa
-- niezależnie od tego, czy PostGIS jest w public czy w extensions.
-- =====================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------
-- 1. Typy wyliczeniowe
-- ---------------------------------------------------------------------
create type public.user_role as enum ('client', 'driver', 'admin');

create type public.verification_status as enum ('pending', 'verified', 'rejected', 'suspended');

-- platform = laweta najazdowa, hds = laweta z żurawiem HDS,
-- wheel_lift = holownik z wysięgnikiem (podnośnik kół),
-- heavy = pomoc drogowa ciężka (TIR/bus), motorcycle = przyczepka/laweta motocyklowa
create type public.tow_vehicle_type as enum ('platform', 'hds', 'wheel_lift', 'heavy', 'motorcycle');

create type public.job_status as enum (
  'searching',   -- zlecenie utworzone, czeka na akceptację kierowcy
  'accepted',    -- kierowca przyjął, cena zablokowana
  'en_route',    -- kierowca jedzie do klienta
  'arrived',     -- na miejscu odbioru
  'in_transit',  -- pojazd załadowany, w drodze do celu
  'delivered',   -- rozładowany w miejscu docelowym
  'completed',   -- rozliczone / zamknięte
  'cancelled',
  'expired'      -- nikt nie przyjął w czasie
);

create type public.offer_status as enum ('pending', 'accepted', 'declined', 'expired', 'cancelled');

create type public.payment_method as enum ('cash', 'card_on_site', 'online');

create type public.photo_kind as enum ('pickup', 'dropoff', 'damage', 'document');

-- ---------------------------------------------------------------------
-- 2. Tabele
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'client',
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.drivers (
  id                 uuid primary key references public.profiles (id) on delete cascade,
  company_name       text not null,
  nip                text check (nip ~ '^[0-9]{10}$'),
  phone              text not null,
  verification       public.verification_status not null default 'pending',
  verified_at        timestamptz,
  rating_avg         numeric(3, 2) not null default 0,
  rating_count       integer not null default 0,
  jobs_completed     integer not null default 0,
  service_radius_km  integer not null default 50 check (service_radius_km between 1 and 500),
  base_location      geography(Point, 4326),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.vehicles (
  id                 uuid primary key default gen_random_uuid(),
  driver_id          uuid not null references public.drivers (id) on delete cascade,
  type               public.tow_vehicle_type not null,
  plate_number       text not null,
  make_model         text,
  max_dmc_kg         integer check (max_dmc_kg > 0),        -- DMC samego zestawu
  max_load_kg        integer check (max_load_kg > 0),       -- ładowność (max masa holowanego auta)
  platform_length_m  numeric(4, 2),
  has_hds            boolean not null default false,
  has_winch          boolean not null default true,
  can_carry_two      boolean not null default false,        -- 2 auta naraz
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (driver_id, plate_number)
);

-- Cennik: jeden na kierowcę w MVP (w v1 można przenieść na vehicle_id)
create table public.pricing (
  driver_id              uuid primary key references public.drivers (id) on delete cascade,
  base_fee               numeric(10, 2) not null default 150 check (base_fee >= 0),      -- opłata startowa
  per_km                 numeric(10, 2) not null default 5   check (per_km >= 0),        -- zł/km holowania
  approach_per_km        numeric(10, 2) not null default 0   check (approach_per_km >= 0), -- zł/km dojazdu
  free_approach_km       numeric(6, 1)  not null default 10  check (free_approach_km >= 0),
  night_surcharge_pct    numeric(5, 2)  not null default 0   check (night_surcharge_pct between 0 and 300),
  weekend_surcharge_pct  numeric(5, 2)  not null default 0   check (weekend_surcharge_pct between 0 and 300),
  min_price              numeric(10, 2) not null default 0   check (min_price >= 0),
  night_start            time not null default '22:00',
  night_end              time not null default '06:00',
  currency               char(3) not null default 'PLN',
  updated_at             timestamptz not null default now()
);

-- Tylko OSTATNIA pozycja kierowcy (nadpisywana). Brak historii śladu = RODO.
create table public.driver_locations (
  driver_id    uuid primary key references public.drivers (id) on delete cascade,
  vehicle_id   uuid references public.vehicles (id) on delete set null,
  location     geography(Point, 4326),
  heading      smallint check (heading between 0 and 359),
  speed_kmh    numeric(5, 1),
  accuracy_m   numeric(7, 1),
  is_online    boolean not null default false,
  updated_at   timestamptz not null default now(),
  constraint online_requires_location check (not is_online or (location is not null and vehicle_id is not null))
);

create table public.jobs (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.profiles (id) on delete restrict,
  driver_id              uuid references public.drivers (id) on delete set null,
  vehicle_id             uuid references public.vehicles (id) on delete set null,
  status                 public.job_status not null default 'searching',
  -- trasa
  pickup                 geography(Point, 4326) not null,
  pickup_address         text not null,
  dropoff                geography(Point, 4326),
  dropoff_address        text,
  route_km               numeric(7, 2),    -- km holowania (z routingu)
  approach_km            numeric(7, 2),    -- km dojazdu kierowcy
  -- pojazd klienta
  requested_vehicle_type public.tow_vehicle_type,
  car_make               text,
  car_model              text,
  car_plate              text,
  car_category           text check (car_category in ('car', 'suv', 'van', 'motorcycle', 'truck', 'other')),
  car_weight_kg          integer,
  car_condition          text[] not null default '{}',  -- np. {'nie_odpala','po_wypadku','zablokowane_kola'}
  notes                  text,
  contact_phone          text,
  -- cena
  price_estimate         numeric(10, 2),   -- szacunek pokazany klientowi
  price_locked           numeric(10, 2),   -- cena zablokowana przy akceptacji
  price_breakdown        jsonb,
  payment_method         public.payment_method not null default 'cash',
  -- czas
  scheduled_at           timestamptz,      -- null = teraz
  accepted_at            timestamptz,
  completed_at           timestamptz,
  cancelled_at           timestamptz,
  cancelled_by           uuid references public.profiles (id),
  cancel_reason          text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.job_offers (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs (id) on delete cascade,
  driver_id    uuid not null references public.drivers (id) on delete cascade,
  status       public.offer_status not null default 'pending',
  price_quote  numeric(10, 2) not null,
  distance_km  numeric(7, 2),
  eta_min      integer,
  expires_at   timestamptz not null,
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (job_id, driver_id)
);

create table public.job_events (
  id           bigint generated always as identity primary key,
  job_id       uuid not null references public.jobs (id) on delete cascade,
  actor_id     uuid references public.profiles (id) on delete set null,
  from_status  public.job_status,
  to_status    public.job_status not null,
  note         text,
  location     geography(Point, 4326),
  created_at   timestamptz not null default now()
);

create table public.job_photos (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs (id) on delete cascade,
  uploaded_by   uuid not null references public.profiles (id) on delete cascade,
  kind          public.photo_kind not null,
  storage_path  text not null,  -- bucket job-photos: {job_id}/{uuid}.jpg
  created_at    timestamptz not null default now()
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null unique references public.jobs (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 2000),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Indeksy
-- ---------------------------------------------------------------------
create index driver_locations_location_gix on public.driver_locations using gist (location);
create index driver_locations_online_gix   on public.driver_locations using gist (location) where is_online;
create index drivers_base_location_gix     on public.drivers using gist (base_location);
create index jobs_pickup_gix               on public.jobs using gist (pickup);
create index jobs_dropoff_gix              on public.jobs using gist (dropoff);
create index jobs_client_idx               on public.jobs (client_id, created_at desc);
create index jobs_driver_idx               on public.jobs (driver_id, created_at desc);
create index jobs_active_status_idx        on public.jobs (status) where status in ('searching', 'accepted', 'en_route', 'arrived', 'in_transit');
create index job_offers_driver_pending_idx on public.job_offers (driver_id) where status = 'pending';
create index job_offers_expires_idx        on public.job_offers (expires_at) where status = 'pending';
create index job_events_job_idx            on public.job_events (job_id, created_at);
create index job_photos_job_idx            on public.job_photos (job_id);
create index vehicles_driver_idx           on public.vehicles (driver_id);
create index reviews_driver_idx            on public.reviews (driver_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. Funkcje pomocnicze (security definer -> brak rekursji w RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_job_client(p_job_id uuid)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.jobs where id = p_job_id and client_id = auth.uid());
$$;

create or replace function public.is_job_driver(p_job_id uuid)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.jobs where id = p_job_id and driver_id = auth.uid());
$$;

create or replace function public.has_pending_offer(p_job_id uuid)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.job_offers
    where job_id = p_job_id and driver_id = auth.uid() and status = 'pending' and expires_at > now()
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at  before update on public.profiles  for each row execute function public.set_updated_at();
create trigger drivers_updated_at   before update on public.drivers   for each row execute function public.set_updated_at();
create trigger vehicles_updated_at  before update on public.vehicles  for each row execute function public.set_updated_at();
create trigger pricing_updated_at   before update on public.pricing   for each row execute function public.set_updated_at();
create trigger jobs_updated_at      before update on public.jobs      for each row execute function public.set_updated_at();

-- Nowy użytkownik Auth -> profil. Rola z metadanych tylko client/driver (nigdy admin).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'driver' then 'driver'::public.user_role else 'client'::public.user_role end,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Zmiana roli: tylko admin; wyjątek client -> driver przez samego użytkownika.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin()
     and not (old.role = 'client' and new.role = 'driver' and old.id = auth.uid()) then
    raise exception 'role_change_forbidden';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Offline => kasujemy pozycję (RODO: lokalizacja tylko gdy online)
create or replace function public.clear_location_when_offline()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  if not new.is_online then
    new.location := null;
    new.heading := null;
    new.speed_kmh := null;
    new.accuracy_m := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger driver_locations_privacy before insert or update on public.driver_locations
  for each row execute function public.clear_location_when_offline();

-- Klient nie może sam ustawić statusu / kierowcy / ceny zablokowanej
create or replace function public.jobs_before_insert()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.client_id := auth.uid();
    new.status := 'searching';
    new.driver_id := null;
    new.vehicle_id := null;
    new.price_locked := null;
    new.accepted_at := null;
    new.completed_at := null;
    new.cancelled_at := null;
  end if;
  return new;
end;
$$;

create trigger jobs_before_insert before insert on public.jobs
  for each row execute function public.jobs_before_insert();

-- Historia statusów (note przekazywany przez set_config('app.status_note', ...))
create or replace function public.log_job_status()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.job_events (job_id, actor_id, from_status, to_status, note)
    values (
      new.id,
      auth.uid(),
      case when tg_op = 'UPDATE' then old.status end,
      new.status,
      nullif(current_setting('app.status_note', true), '')
    );
  end if;
  return new;
end;
$$;

create trigger jobs_log_status after insert or update of status on public.jobs
  for each row execute function public.log_job_status();

-- Średnia ocen kierowcy
create or replace function public.refresh_driver_rating()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.drivers d
     set rating_avg = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.driver_id = new.driver_id), 0),
         rating_count = (select count(*) from public.reviews r where r.driver_id = new.driver_id)
   where d.id = new.driver_id;
  return new;
end;
$$;

create trigger reviews_refresh_rating after insert on public.reviews
  for each row execute function public.refresh_driver_rating();

-- ---------------------------------------------------------------------
-- 5. Cena
-- ---------------------------------------------------------------------
-- Cena = max(min_price, (start + (dojazd - darmowe km) * zł/km dojazdu + holowanie * zł/km) * (1 + noc% + weekend%))
create or replace function public.calc_price(
  p_driver_id   uuid,
  p_approach_km numeric,
  p_tow_km      numeric,
  p_at          timestamptz default now()
)
returns numeric language sql stable set search_path = public, extensions as $$
  with t as (
    select (p_at at time zone 'Europe/Warsaw')::time as local_time,
           extract(isodow from (p_at at time zone 'Europe/Warsaw')) as dow
  )
  select round(greatest(
           ( p.base_fee
             + greatest(coalesce(p_approach_km, 0) - p.free_approach_km, 0) * p.approach_per_km
             + coalesce(p_tow_km, 0) * p.per_km )
           * ( 1
               + case
                   when p.night_start > p.night_end
                        and (t.local_time >= p.night_start or t.local_time < p.night_end) then p.night_surcharge_pct / 100
                   when p.night_start <= p.night_end
                        and t.local_time >= p.night_start and t.local_time < p.night_end then p.night_surcharge_pct / 100
                   else 0
                 end
               + case when t.dow in (6, 7) then p.weekend_surcharge_pct / 100 else 0 end ),
           p.min_price), 0)
  from public.pricing p cross join t
  where p.driver_id = p_driver_id;
$$;

-- ---------------------------------------------------------------------
-- 6. RPC: wyszukiwanie najbliższych lawet
-- ---------------------------------------------------------------------
-- Dystans drogowy ~ linia prosta * 1.3; ETA przy średnio 45 km/h + 5 min na wyjazd.
-- Dokładne ETA/cena dla top-N liczone w Edge Function (OSRM/ORS) przy składaniu zlecenia.
-- Pozycja zwracana z dokładnością ~200 m (prywatność kierowcy).
create or replace function public.nearby_drivers(
  lat          double precision,
  lng          double precision,
  radius_km    double precision default 30,
  vehicle_type public.tow_vehicle_type default null,
  dropoff_lat  double precision default null,
  dropoff_lng  double precision default null,
  max_results  integer default 20
)
returns table (
  driver_id      uuid,
  company_name   text,
  rating_avg     numeric,
  rating_count   integer,
  vehicle_id     uuid,
  tow_type       public.tow_vehicle_type,
  has_hds        boolean,
  max_load_kg    integer,
  approx_lat     double precision,
  approx_lng     double precision,
  distance_km    numeric,
  eta_min        integer,
  tow_km         numeric,
  price_estimate numeric,
  last_seen      timestamptz
)
language sql stable security definer set search_path = public, extensions as $$
  with q as (
    select st_setsrid(st_makepoint(nearby_drivers.lng, nearby_drivers.lat), 4326)::geography as pickup,
           case when nearby_drivers.dropoff_lat is not null and nearby_drivers.dropoff_lng is not null
                then st_setsrid(st_makepoint(nearby_drivers.dropoff_lng, nearby_drivers.dropoff_lat), 4326)::geography
           end as dropoff
  ),
  c as (
    select d.id, d.company_name, d.rating_avg, d.rating_count,
           v.id as vid, v.type, v.has_hds, v.max_load_kg,
           dl.location, dl.updated_at,
           st_distance(dl.location, q.pickup) / 1000.0 as crow_km,
           case when q.dropoff is not null then st_distance(q.pickup, q.dropoff) / 1000.0 * 1.3 else 0 end as tow_km_est
    from q
    join public.driver_locations dl
      on dl.is_online
     and dl.updated_at > now() - interval '2 minutes'
     and st_dwithin(dl.location, q.pickup, least(nearby_drivers.radius_km, 300) * 1000)
    join public.drivers d  on d.id = dl.driver_id and d.verification = 'verified'
    join public.vehicles v on v.id = dl.vehicle_id and v.is_active
    where (nearby_drivers.vehicle_type is null or v.type = nearby_drivers.vehicle_type)
      and not exists (
        select 1 from public.jobs j
        where j.driver_id = d.id and j.status in ('accepted', 'en_route', 'arrived', 'in_transit')
      )
    order by dl.location <-> q.pickup
    limit greatest(least(nearby_drivers.max_results, 50), 1)
  )
  select c.id, c.company_name, c.rating_avg, c.rating_count,
         c.vid, c.type, c.has_hds, c.max_load_kg,
         round(st_y(st_snaptogrid(c.location::geometry, 0.002))::numeric, 4)::double precision,
         round(st_x(st_snaptogrid(c.location::geometry, 0.002))::numeric, 4)::double precision,
         round(c.crow_km::numeric, 1),
         (ceil(c.crow_km * 1.3 / 45.0 * 60) + 5)::integer,
         round(c.tow_km_est::numeric, 1),
         public.calc_price(c.id, (c.crow_km * 1.3)::numeric, c.tow_km_est::numeric),
         c.updated_at
  from c
  order by c.crow_km;
$$;

-- ---------------------------------------------------------------------
-- 7. RPC: lokalizacja i dostępność kierowcy
-- ---------------------------------------------------------------------
create or replace function public.set_driver_online(p_online boolean, p_vehicle_id uuid default null,
                                                    p_lat double precision default null, p_lng double precision default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_vehicle uuid;
begin
  if not exists (select 1 from public.drivers where id = auth.uid() and verification = 'verified') and p_online then
    raise exception 'driver_not_verified';
  end if;

  v_vehicle := coalesce(p_vehicle_id,
                        (select vehicle_id from public.driver_locations where driver_id = auth.uid()),
                        (select id from public.vehicles where driver_id = auth.uid() and is_active order by created_at limit 1));

  if v_vehicle is not null and not exists (select 1 from public.vehicles where id = v_vehicle and driver_id = auth.uid()) then
    raise exception 'vehicle_not_owned';
  end if;

  insert into public.driver_locations (driver_id, vehicle_id, location, is_online)
  values (auth.uid(), v_vehicle,
          case when p_lat is not null then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end,
          p_online)
  on conflict (driver_id) do update
    set vehicle_id = excluded.vehicle_id,
        location   = coalesce(excluded.location, public.driver_locations.location),
        is_online  = excluded.is_online;
end;
$$;

create or replace function public.update_my_location(p_lat double precision, p_lng double precision,
                                                     p_heading smallint default null, p_speed_kmh numeric default null,
                                                     p_accuracy_m numeric default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.driver_locations
     set location   = st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
         heading    = p_heading,
         speed_kmh  = p_speed_kmh,
         accuracy_m = p_accuracy_m
   where driver_id = auth.uid() and is_online;
  if not found then
    raise exception 'driver_offline';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. RPC: matching (oferty) i statusy
-- ---------------------------------------------------------------------
-- Opcja A: klient wybiera konkretnego kierowcę z listy -> oferta na 90 s.
create or replace function public.request_driver(p_job_id uuid, p_driver_id uuid, p_ttl_seconds integer default 90)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  j        public.jobs;
  v_km     numeric;
  v_offer  uuid;
begin
  select * into j from public.jobs where id = p_job_id for update;
  if not found or j.client_id <> auth.uid() then raise exception 'job_not_found'; end if;
  if j.status <> 'searching' then raise exception 'job_not_searching'; end if;

  select st_distance(dl.location, j.pickup) / 1000.0 * 1.3 into v_km
    from public.driver_locations dl
    join public.drivers d on d.id = dl.driver_id and d.verification = 'verified'
   where dl.driver_id = p_driver_id and dl.is_online;
  if v_km is null then raise exception 'driver_unavailable'; end if;

  insert into public.job_offers (job_id, driver_id, price_quote, distance_km, eta_min, expires_at)
  values (p_job_id, p_driver_id,
          public.calc_price(p_driver_id, v_km, coalesce(j.route_km, 0)),
          round(v_km, 1),
          (ceil(v_km / 45.0 * 60) + 5)::integer,
          now() + make_interval(secs => least(greatest(p_ttl_seconds, 30), 300)))
  on conflict (job_id, driver_id) do update
    set status = 'pending', price_quote = excluded.price_quote, distance_km = excluded.distance_km,
        eta_min = excluded.eta_min, expires_at = excluded.expires_at, responded_at = null
  returning id into v_offer;

  update public.jobs set price_estimate = (select price_quote from public.job_offers where id = v_offer)
   where id = p_job_id;
  return v_offer;
end;
$$;

-- Opcja B: broadcast do N najbliższych (pierwszy wygrywa).
create or replace function public.broadcast_job(p_job_id uuid, p_count integer default 5,
                                                p_radius_km double precision default 40, p_ttl_seconds integer default 60)
returns integer language plpgsql security definer set search_path = public, extensions as $$
declare
  j     public.jobs;
  v_n   integer;
begin
  select * into j from public.jobs where id = p_job_id for update;
  if not found or (j.client_id <> auth.uid() and not public.is_admin()) then raise exception 'job_not_found'; end if;
  if j.status <> 'searching' then raise exception 'job_not_searching'; end if;

  insert into public.job_offers (job_id, driver_id, price_quote, distance_km, eta_min, expires_at)
  select p_job_id, n.driver_id, n.price_estimate, n.distance_km, n.eta_min,
         now() + make_interval(secs => least(greatest(p_ttl_seconds, 30), 300))
  from public.nearby_drivers(st_y(j.pickup::geometry), st_x(j.pickup::geometry), p_radius_km,
                             j.requested_vehicle_type,
                             st_y(j.dropoff::geometry), st_x(j.dropoff::geometry),
                             least(greatest(p_count, 1), 20)) n
  on conflict (job_id, driver_id) do nothing;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Akceptacja oferty: atomowo, pierwszy wygrywa. Zwraca false, gdy ktoś był szybszy.
create or replace function public.accept_offer(p_offer_id uuid)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  o public.job_offers;
begin
  select * into o from public.job_offers where id = p_offer_id and driver_id = auth.uid() for update;
  if not found then raise exception 'offer_not_found'; end if;
  if o.status <> 'pending' or o.expires_at <= now() then
    update public.job_offers set status = 'expired', responded_at = now() where id = o.id and status = 'pending';
    return false;
  end if;

  update public.jobs
     set driver_id    = o.driver_id,
         vehicle_id   = (select vehicle_id from public.driver_locations where driver_id = o.driver_id),
         status       = 'accepted',
         price_locked = o.price_quote,
         approach_km  = o.distance_km,
         accepted_at  = now()
   where id = o.job_id and status = 'searching' and driver_id is null;

  if not found then
    update public.job_offers set status = 'expired', responded_at = now() where id = o.id;
    return false;
  end if;

  update public.job_offers set status = 'accepted', responded_at = now() where id = o.id;
  update public.job_offers set status = 'cancelled', responded_at = now()
   where job_id = o.job_id and id <> o.id and status = 'pending';
  return true;
end;
$$;

create or replace function public.decline_offer(p_offer_id uuid)
returns void language sql security definer set search_path = public, extensions as $$
  update public.job_offers set status = 'declined', responded_at = now()
   where id = p_offer_id and driver_id = auth.uid() and status = 'pending';
$$;

-- Przejścia statusów z kontrolą, kto może co zmienić.
create or replace function public.set_job_status(p_job_id uuid, p_status public.job_status, p_note text default null)
returns public.jobs language plpgsql security definer set search_path = public, extensions as $$
declare
  j          public.jobs;
  v_uid      uuid := auth.uid();
  v_move     text;
  v_allowed  boolean;
begin
  select * into j from public.jobs where id = p_job_id for update;
  if not found then raise exception 'job_not_found'; end if;

  v_move := j.status::text || '>' || p_status::text;

  if public.is_admin() then
    v_allowed := true;
  elsif j.driver_id = v_uid then
    v_allowed := v_move = any (array[
      'accepted>en_route', 'en_route>arrived', 'arrived>in_transit', 'in_transit>delivered',
      'delivered>completed', 'accepted>cancelled', 'en_route>cancelled', 'arrived>cancelled']);
  elsif j.client_id = v_uid then
    v_allowed := v_move = any (array['searching>cancelled', 'accepted>cancelled', 'en_route>cancelled']);
  else
    raise exception 'forbidden';
  end if;

  if not v_allowed then raise exception 'invalid_transition %', v_move; end if;
  if p_status = 'cancelled' and j.driver_id = v_uid and coalesce(trim(p_note), '') = '' then
    raise exception 'cancel_reason_required';
  end if;

  perform set_config('app.status_note', coalesce(p_note, ''), true);

  update public.jobs
     set status        = p_status,
         completed_at  = case when p_status = 'completed' then now() else completed_at end,
         cancelled_at  = case when p_status = 'cancelled' then now() else cancelled_at end,
         cancelled_by  = case when p_status = 'cancelled' then v_uid else cancelled_by end,
         cancel_reason = case when p_status = 'cancelled' then p_note else cancel_reason end
   where id = p_job_id
  returning * into j;

  if p_status = 'cancelled' then
    update public.job_offers set status = 'cancelled', responded_at = now()
     where job_id = p_job_id and status = 'pending';
  end if;
  if p_status = 'completed' then
    update public.drivers set jobs_completed = jobs_completed + 1 where id = j.driver_id;
  end if;

  perform set_config('app.status_note', '', true);
  return j;
end;
$$;

-- Numer telefonu drugiej strony: tylko w trakcie aktywnego zlecenia.
create or replace function public.get_job_contact(p_job_id uuid)
returns table (name text, phone text) language sql stable security definer set search_path = public, extensions as $$
  select case when j.client_id = auth.uid() then d.company_name else coalesce(pc.full_name, 'Klient') end,
         case when j.client_id = auth.uid() then d.phone else coalesce(j.contact_phone, pc.phone) end
  from public.jobs j
  join public.drivers d   on d.id = j.driver_id
  join public.profiles pc on pc.id = j.client_id
  where j.id = p_job_id
    and auth.uid() in (j.client_id, j.driver_id)
    and j.status in ('accepted', 'en_route', 'arrived', 'in_transit', 'delivered');
$$;

-- Do odpalania z pg_cron co minutę: select public.expire_stale();
create or replace function public.expire_stale()
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.job_offers set status = 'expired', responded_at = now()
   where status = 'pending' and expires_at <= now();

  update public.jobs set status = 'expired'
   where status = 'searching' and created_at < now() - interval '15 minutes' and scheduled_at is null;

  -- kierowca, który nie wysłał pozycji od 5 min, przestaje być online (np. zamknięta apka)
  update public.driver_locations set is_online = false
   where is_online and updated_at < now() - interval '5 minutes';
end;
$$;

-- Retencja (RODO) - odpalać raz na dobę: select public.purge_old_data();
create or replace function public.purge_old_data()
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.job_events set location = null where location is not null and created_at < now() - interval '90 days';
  update public.jobs set contact_phone = null, notes = null where contact_phone is not null and created_at < now() - interval '12 months';
  delete from public.job_offers where created_at < now() - interval '90 days';
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Widok publicznych danych kierowcy (bez telefonu / NIP)
-- ---------------------------------------------------------------------
create view public.drivers_public as
  select id, company_name, rating_avg, rating_count, jobs_completed, verification
  from public.drivers
  where verification = 'verified';

-- ---------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.drivers          enable row level security;
alter table public.vehicles         enable row level security;
alter table public.pricing          enable row level security;
alter table public.driver_locations enable row level security;
alter table public.jobs             enable row level security;
alter table public.job_offers       enable row level security;
alter table public.job_events       enable row level security;
alter table public.job_photos       enable row level security;
alter table public.reviews          enable row level security;

-- profiles
create policy profiles_select_self on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_select_counterpart on public.profiles for select to authenticated
  using (exists (select 1 from public.jobs j
                 where (j.client_id = (select auth.uid()) and j.driver_id = profiles.id)
                    or (j.driver_id = (select auth.uid()) and j.client_id = profiles.id)));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- drivers: pełny rekord tylko właściciel/admin; reszta przez drivers_public / RPC
create policy drivers_select_own on public.drivers for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy drivers_insert_own on public.drivers for insert to authenticated
  with check (id = (select auth.uid())
              and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'driver'));
create policy drivers_update_own on public.drivers for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- kolumny weryfikacji i ratingu nie są edytowalne przez użytkownika
revoke insert, update on public.drivers from anon, authenticated;
grant insert (id, company_name, nip, phone, service_radius_km, base_location) on public.drivers to authenticated;
grant update (company_name, nip, phone, service_radius_km, base_location) on public.drivers to authenticated;

-- vehicles
create policy vehicles_owner_all on public.vehicles for all to authenticated
  using (driver_id = (select auth.uid()) or public.is_admin())
  with check (driver_id = (select auth.uid()) or public.is_admin());
create policy vehicles_select_job_client on public.vehicles for select to authenticated
  using (exists (select 1 from public.jobs j where j.vehicle_id = vehicles.id and j.client_id = (select auth.uid())));

-- pricing: cennik jest jawny (transparentność ceny), edycja tylko właściciel
create policy pricing_select_all on public.pricing for select to anon, authenticated using (true);
create policy pricing_owner_write on public.pricing for all to authenticated
  using (driver_id = (select auth.uid()) or public.is_admin())
  with check (driver_id = (select auth.uid()) or public.is_admin());

-- driver_locations: kierowca swoją; klient tylko kierowcy przypisanego do jego aktywnego zlecenia
create policy driver_locations_owner on public.driver_locations for all to authenticated
  using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid())
              and (vehicle_id is null or exists (select 1 from public.vehicles v
                                                 where v.id = vehicle_id and v.driver_id = (select auth.uid()))));
create policy driver_locations_active_job_client on public.driver_locations for select to authenticated
  using (exists (select 1 from public.jobs j
                 where j.driver_id = driver_locations.driver_id
                   and j.client_id = (select auth.uid())
                   and j.status in ('accepted', 'en_route', 'arrived', 'in_transit')));
create policy driver_locations_admin on public.driver_locations for select to authenticated
  using (public.is_admin());

-- jobs: insert przez klienta; zmiany statusu wyłącznie przez RPC (brak polityki UPDATE poza adminem)
create policy jobs_insert_client on public.jobs for insert to authenticated
  with check (client_id = (select auth.uid()));
create policy jobs_select_participants on public.jobs for select to authenticated
  using (client_id = (select auth.uid())
         or driver_id = (select auth.uid())
         or public.has_pending_offer(id)
         or public.is_admin());
create policy jobs_update_admin on public.jobs for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- job_offers: tylko odczyt (zapisy przez RPC)
create policy job_offers_select on public.job_offers for select to authenticated
  using (driver_id = (select auth.uid()) or public.is_job_client(job_id) or public.is_admin());

-- job_events: odczyt dla uczestników (zapisy z triggera)
create policy job_events_select on public.job_events for select to authenticated
  using (public.is_job_client(job_id) or public.is_job_driver(job_id) or public.is_admin());

-- job_photos
create policy job_photos_select on public.job_photos for select to authenticated
  using (public.is_job_client(job_id) or public.is_job_driver(job_id) or public.is_admin());
create policy job_photos_insert on public.job_photos for insert to authenticated
  with check (uploaded_by = (select auth.uid())
              and (public.is_job_client(job_id) or public.is_job_driver(job_id)));

-- reviews: publiczne; dodaje klient po zakończonym zleceniu
create policy reviews_select_all on public.reviews for select to anon, authenticated using (true);
create policy reviews_insert_client on public.reviews for insert to authenticated
  with check (author_id = (select auth.uid())
              and exists (select 1 from public.jobs j
                          where j.id = reviews.job_id
                            and j.client_id = (select auth.uid())
                            and j.driver_id = reviews.driver_id
                            and j.status = 'completed'));

-- ---------------------------------------------------------------------
-- 11. Uprawnienia do RPC
-- ---------------------------------------------------------------------
revoke execute on function public.expire_stale() from public, anon, authenticated;
revoke execute on function public.purge_old_data() from public, anon, authenticated;
grant execute on function public.nearby_drivers(double precision, double precision, double precision,
                                                public.tow_vehicle_type, double precision, double precision, integer)
  to anon, authenticated;
grant select on public.drivers_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 12. Storage: prywatny bucket na zdjęcia (ścieżka: {job_id}/{plik})
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

create policy job_photos_storage_read on storage.objects for select to authenticated
  using (bucket_id = 'job-photos'
         and exists (select 1 from public.jobs j
                     where j.id::text = (storage.foldername(name))[1]
                       and (j.client_id = (select auth.uid()) or j.driver_id = (select auth.uid()))));
create policy job_photos_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'job-photos'
              and exists (select 1 from public.jobs j
                          where j.id::text = (storage.foldername(name))[1]
                            and (j.client_id = (select auth.uid()) or j.driver_id = (select auth.uid()))));

-- ---------------------------------------------------------------------
-- 13. Realtime: publikacja zmian (postgres_changes respektuje RLS)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.jobs, public.job_offers, public.job_events, public.driver_locations;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 14. Harmonogram (opcjonalnie, wymaga rozszerzenia pg_cron w Supabase)
-- ---------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- select cron.schedule('expire-stale', '* * * * *', $$select public.expire_stale()$$);
-- select cron.schedule('purge-old-data', '17 3 * * *', $$select public.purge_old_data()$$);
