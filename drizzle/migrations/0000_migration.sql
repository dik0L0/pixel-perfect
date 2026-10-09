create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  employment text,
  income_frequency text default 'mensuel',
  salary numeric not null default 0,
  secondary_income numeric not null default 0,
  other_income numeric not null default 0,
  payday int not null default 25,
  fixed_charges jsonb not null default '{}'::jsonb,
  main_goal text,
  onboarded boolean not null default false,
  plan text not null default 'gratuit',
  alert_threshold int not null default 80,
  alerts_enabled jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = id);

-- plan column must not be user-editable
create or replace function public.protect_plan() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.plan is distinct from old.plan and current_setting('request.jwt.claim.role', true) = 'authenticated' then
    new.plan := old.plan;
  end if;
  return new;
end $$;
create trigger profiles_protect_plan before update on public.profiles for each row execute function public.protect_plan();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name',''),' ',1), ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  kind text not null default 'depense',
  created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text not null check (type in ('revenu','depense')),
  amount numeric not null check (amount >= 0),
  category text not null,
  date date not null default current_date,
  description text,
  payment_method text not null default 'Espèces',
  exceptional boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.transactions(user_id, date);
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  month text not null,
  category text not null,
  amount numeric not null default 0,
  unique(user_id, month, category)
);
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  target numeric not null,
  saved numeric not null default 0,
  target_date date,
  priority text not null default 'moyenne',
  created_at timestamptz not null default now()
);
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date
);
create table public.notification_reads (
  user_id uuid not null default auth.uid(),
  key text not null,
  primary key (user_id, key)
);

do $$ declare t text; begin
  foreach t in array array['categories','transactions','budgets','goals','goal_contributions','notification_reads'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own select" on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy "own update" on public.%I for update to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy "own delete" on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
  end loop;
end $$;