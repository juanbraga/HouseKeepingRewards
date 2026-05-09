-- ============================================================
-- HouseKeepingRewards — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
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
  role            text not null default 'member' check (role in ('admin','member')),
  points_balance  integer not null default 0,
  avatar_color    text default '#7c3aed',
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

-- ============================================================
-- Row Level Security
-- ============================================================

alter table households          enable row level security;
alter table household_members   enable row level security;
alter table tasks               enable row level security;
alter table task_completions    enable row level security;
alter table rewards             enable row level security;
alter table reward_redemptions  enable row level security;

-- Helper: is the current user a member of a given household?
create or replace function is_member(hh_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from household_members
    where household_id = hh_id and user_id = auth.uid()
  );
$$;

-- Helper: is the current user an admin of a given household?
create or replace function is_admin(hh_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from household_members
    where household_id = hh_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- households
create policy "members can view their households"
  on households for select using (is_member(id));

create policy "members can update their households"
  on households for update using (is_admin(id));

create policy "authenticated users can create households"
  on households for insert with check (auth.uid() is not null);

create policy "admins can delete their households"
  on households for delete using (is_admin(id));

-- household_members
create policy "members can view household members"
  on household_members for select using (is_member(household_id));

create policy "admins can insert members"
  on household_members for insert with check (
    is_admin(household_id) or
    -- allow the household creator to add the first member (themselves)
    (select created_by from households where id = household_id) = auth.uid()
  );

create policy "admins can update members"
  on household_members for update using (is_admin(household_id));

create policy "admins can delete members"
  on household_members for delete using (is_admin(household_id));

-- tasks (templates have null household_id — readable by all authenticated users)
create policy "members can view household tasks"
  on tasks for select using (
    household_id is null or is_member(household_id)
  );

create policy "members can create tasks"
  on tasks for insert with check (is_member(household_id));

create policy "members can update tasks"
  on tasks for update using (is_member(household_id));

create policy "members can delete tasks"
  on tasks for delete using (is_admin(household_id));

-- task_completions
create policy "members can view completions"
  on task_completions for select using (
    exists (
      select 1 from tasks t
      join household_members hm on hm.household_id = t.household_id
      where t.id = task_completions.task_id and hm.user_id = auth.uid()
    )
  );

create policy "members can insert completions"
  on task_completions for insert with check (
    exists (
      select 1 from household_members
      where id = task_completions.member_id and user_id = auth.uid()
    )
  );

-- rewards
create policy "members can view rewards"
  on rewards for select using (is_member(household_id));

create policy "members can create rewards"
  on rewards for insert with check (is_member(household_id));

create policy "members can update rewards"
  on rewards for update using (is_member(household_id));

create policy "members can delete rewards"
  on rewards for delete using (is_admin(household_id));

-- reward_redemptions
create policy "members can view redemptions"
  on reward_redemptions for select using (
    exists (
      select 1 from rewards r
      join household_members hm on hm.household_id = r.household_id
      where r.id = reward_redemptions.reward_id and hm.user_id = auth.uid()
    )
  );

create policy "members can redeem"
  on reward_redemptions for insert with check (
    exists (
      select 1 from household_members
      where id = reward_redemptions.member_id and user_id = auth.uid()
    )
  );

create policy "admins can update redemptions"
  on reward_redemptions for update using (
    exists (
      select 1 from rewards r
      where r.id = reward_redemptions.reward_id and is_admin(r.household_id)
    )
  );

-- ============================================================
-- Seed: Task templates (household_id is null = global templates)
-- ============================================================

insert into tasks (household_id, name_en, name_es, description_en, description_es, points, frequency, category, is_template, is_active) values
  -- Cleaning
  (null, 'Vacuum living room',     'Aspirar el living',        'Vacuum all rugs and floors in the living room',        'Aspirar alfombras y pisos del living',         15, 'weekly',  'cleaning',     true, true),
  (null, 'Clean bathrooms',        'Limpiar baños',             'Scrub toilet, sink and mirrors',                       'Limpiar inodoro, lavamanos y espejos',          20, 'weekly',  'cleaning',     true, true),
  (null, 'Mop floors',             'Trapear pisos',             'Mop all hard floors in the house',                     'Trapear todos los pisos de la casa',            15, 'weekly',  'cleaning',     true, true),
  (null, 'Clean kitchen',          'Limpiar cocina',            'Wipe counters, stovetop and sink',                     'Limpiar mesadas, cocina y pileta',              15, 'daily',   'cleaning',     true, true),
  (null, 'Take out trash',         'Sacar la basura',           'Take out all trash bins',                              'Sacar todos los tachos de basura',              10, 'daily',   'cleaning',     true, true),
  (null, 'Clean windows',          'Limpiar ventanas',          'Wipe all windows inside',                              'Limpiar ventanas por dentro',                   20, 'monthly', 'cleaning',     true, true),
  (null, 'Dust furniture',         'Desempolvar muebles',       'Dust all surfaces and furniture',                      'Limpiar el polvo de muebles y superficies',     10, 'weekly',  'cleaning',     true, true),
  -- Cooking
  (null, 'Cook dinner',            'Cocinar la cena',           'Prepare dinner for the household',                     'Preparar la cena para el hogar',                20, 'daily',   'cooking',      true, true),
  (null, 'Prepare breakfast',      'Preparar el desayuno',      'Prepare breakfast for everyone',                       'Preparar el desayuno para todos',               10, 'daily',   'cooking',      true, true),
  (null, 'Wash dishes',            'Lavar los platos',          'Wash all dishes after meals',                          'Lavar todos los platos después de comer',       10, 'daily',   'cooking',      true, true),
  (null, 'Load dishwasher',        'Cargar el lavavajillas',    'Load and run the dishwasher',                          'Cargar y poner en marcha el lavavajillas',       8, 'daily',   'cooking',      true, true),
  -- Laundry
  (null, 'Do laundry',             'Hacer la ropa',             'Wash, dry and fold a load of laundry',                 'Lavar, secar y doblar una carga de ropa',       15, 'weekly',  'laundry',      true, true),
  (null, 'Iron clothes',           'Planchar ropa',             'Iron a basket of clothes',                             'Planchar una canasta de ropa',                  15, 'weekly',  'laundry',      true, true),
  (null, 'Put away clothes',       'Guardar la ropa',           'Fold and put away clean laundry',                      'Doblar y guardar la ropa limpia',               10, 'weekly',  'laundry',      true, true),
  -- Shopping
  (null, 'Grocery shopping',       'Hacer las compras',         'Buy groceries from the list',                          'Comprar los víveres de la lista',               20, 'weekly',  'shopping',     true, true),
  (null, 'Write shopping list',    'Hacer lista de compras',    'Write the weekly shopping list',                       'Escribir la lista de compras semanal',           5, 'weekly',  'shopping',     true, true),
  -- Maintenance
  (null, 'Water plants',           'Regar las plantas',         'Water all indoor and outdoor plants',                  'Regar todas las plantas de interior y exterior', 5, 'weekly',  'maintenance',  true, true),
  (null, 'Clean fridge',           'Limpiar la heladera',       'Remove old food and wipe down the fridge',             'Tirar lo viejo y limpiar la heladera',          15, 'monthly', 'maintenance',  true, true),
  (null, 'Feed pets',              'Darle de comer a las mascotas', 'Feed all pets',                                    'Darle de comer a todas las mascotas',           10, 'daily',   'maintenance',  true, true)
on conflict do nothing;

-- ============================================================
-- Note: rewards are created per household by users, not seeded globally.
-- ============================================================
