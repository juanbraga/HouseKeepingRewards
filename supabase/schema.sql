-- ============================================================
-- HouseKeepingRewards — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
--
-- NOTE: RLS is intentionally DISABLED on all tables.
-- The app is private/trusted; RLS caused persistent 403 issues
-- that were never fully resolved. Do not re-enable without
-- thorough end-to-end testing of every write path.
-- ============================================================

-- ── households ──────────────────────────────────────────────
create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── household_members ───────────────────────────────────────
create table if not exists household_members (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid references households(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete set null,
  display_name    text not null,
  email           text,
  role            text not null default 'member' check (role in ('admin','member')),
  points_balance  integer not null default 0,
  avatar_color    text default '#7c3aed',
  avatar_emoji    text,
  created_at      timestamptz default now()
);

-- ── tasks ───────────────────────────────────────────────────
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid references households(id) on delete cascade,
  name_en         text not null,
  name_es         text,
  description_en  text,
  description_es  text,
  points          integer not null default 10,
  frequency       text not null default 'weekly' check (frequency in ('daily','weekly','monthly','one-time')),
  category        text not null default 'other' check (category in ('cleaning','cooking','laundry','shopping','maintenance','other')),
  is_template     boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz default now()
);

-- ── task_completions ────────────────────────────────────────
create table if not exists task_completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references tasks(id) on delete cascade not null,
  member_id     uuid references household_members(id) on delete cascade not null,
  completed_at  timestamptz default now(),
  points_earned integer not null,
  notes         text
);

-- ── rewards ─────────────────────────────────────────────────
create table if not exists rewards (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid references households(id) on delete cascade not null,
  name_en         text not null,
  name_es         text,
  description_en  text,
  description_es  text,
  points_cost     integer not null default 50,
  is_predefined   boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz default now()
);

-- ── reward_redemptions ──────────────────────────────────────
create table if not exists reward_redemptions (
  id           uuid primary key default gen_random_uuid(),
  reward_id    uuid references rewards(id) on delete cascade not null,
  member_id    uuid references household_members(id) on delete cascade not null,
  redeemed_at  timestamptz default now(),
  points_spent integer not null,
  status       text not null default 'pending' check (status in ('pending','approved','fulfilled','rejected'))
);

-- ── household_invites ───────────────────────────────────────
create table if not exists household_invites (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid references households(id) on delete cascade not null,
  token         text not null unique,
  created_by    uuid references auth.users(id) on delete set null,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  used_at       timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- Row Level Security — DISABLED (see note at top of file)
-- ============================================================

alter table households          disable row level security;
alter table household_members   disable row level security;
alter table tasks               disable row level security;
alter table task_completions    disable row level security;
alter table rewards             disable row level security;
alter table reward_redemptions  disable row level security;
alter table household_invites   disable row level security;

--============================================================
-- Seed: Task templates (household_id is null = global templates)
-- ============================================================

insert into tasks (household_id, name_en, name_es, description_en, description_es, points, frequency, category, is_template, is_active) values
  -- Cleaning
  (null, 'Vacuum living room',     'Aspirar el living',             'Vacuum all rugs and floors in the living room',        'Aspirar alfombras y pisos del living',          15, 'weekly',  'cleaning',    true, true),
  (null, 'Clean bathrooms',        'Limpiar baños',                 'Scrub toilet, sink and mirrors',                       'Limpiar inodoro, lavamanos y espejos',          20, 'weekly',  'cleaning',    true, true),
  (null, 'Mop floors',             'Trapear pisos',                 'Mop all hard floors in the house',                     'Trapear todos los pisos de la casa',            15, 'weekly',  'cleaning',    true, true),
  (null, 'Clean kitchen',          'Limpiar cocina',                'Wipe counters, stovetop and sink',                     'Limpiar mesadas, cocina y pileta',              15, 'daily',   'cleaning',    true, true),
  (null, 'Take out trash',         'Sacar la basura',               'Take out all trash bins',                              'Sacar todos los tachos de basura',              10, 'daily',   'cleaning',    true, true),
  (null, 'Clean windows',          'Limpiar ventanas',              'Wipe all windows inside',                              'Limpiar ventanas por dentro',                   20, 'monthly', 'cleaning',    true, true),
  (null, 'Dust furniture',         'Desempolvar muebles',           'Dust all surfaces and furniture',                      'Limpiar el polvo de muebles y superficies',     10, 'weekly',  'cleaning',    true, true),
  -- Cooking
  (null, 'Cook dinner',            'Cocinar la cena',               'Prepare dinner for the household',                     'Preparar la cena para el hogar',                20, 'daily',   'cooking',     true, true),
  (null, 'Prepare breakfast',      'Preparar el desayuno',          'Prepare breakfast for everyone',                       'Preparar el desayuno para todos',               10, 'daily',   'cooking',     true, true),
  (null, 'Wash dishes',            'Lavar los platos',              'Wash all dishes after meals',                          'Lavar todos los platos después de comer',       10, 'daily',   'cooking',     true, true),
  (null, 'Load dishwasher',        'Cargar el lavavajillas',        'Load and run the dishwasher',                          'Cargar y poner en marcha el lavavajillas',       8, 'daily',   'cooking',     true, true),
  -- Laundry
  (null, 'Do laundry',             'Hacer la ropa',                 'Wash, dry and fold a load of laundry',                 'Lavar, secar y doblar una carga de ropa',       15, 'weekly',  'laundry',     true, true),
  (null, 'Iron clothes',           'Planchar ropa',                 'Iron a basket of clothes',                             'Planchar una canasta de ropa',                  15, 'weekly',  'laundry',     true, true),
  (null, 'Put away clothes',       'Guardar la ropa',               'Fold and put away clean laundry',                      'Doblar y guardar la ropa limpia',               10, 'weekly',  'laundry',     true, true),
  -- Shopping
  (null, 'Grocery shopping',       'Hacer las compras',             'Buy groceries from the list',                          'Comprar los víveres de la lista',               20, 'weekly',  'shopping',    true, true),
  (null, 'Write shopping list',    'Hacer lista de compras',        'Write the weekly shopping list',                       'Escribir la lista de compras semanal',           5, 'weekly',  'shopping',    true, true),
  -- Maintenance
  (null, 'Water plants',           'Regar las plantas',             'Water all indoor and outdoor plants',                  'Regar todas las plantas de interior y exterior', 5, 'weekly',  'maintenance', true, true),
  (null, 'Clean fridge',           'Limpiar la heladera',           'Remove old food and wipe down the fridge',             'Tirar lo viejo y limpiar la heladera',          15, 'monthly', 'maintenance', true, true),
  (null, 'Feed pets',              'Darle de comer a las mascotas', 'Feed all pets',                                        'Darle de comer a todas las mascotas',           10, 'daily',   'maintenance', true, true)
on conflict do nothing;

-- ============================================================
-- Note: rewards are created per household by users, not seeded globally.
-- After running this script, also disable email confirmation in
-- Supabase Dashboard > Authentication > Settings > Email auth.
-- ============================================================
