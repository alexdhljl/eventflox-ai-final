create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  date date,
  location text,
  organizer_name text,
  description text,
  status text default 'planning',
  created_at timestamptz default now()
);

create table if not exists public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  status text default 'open',
  owner_name text,
  created_at timestamptz default now()
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  task_id uuid not null references public.event_tasks(id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.guest_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  created_at timestamptz default now(),
  unique(event_id, guest_email)
);

alter table public.events enable row level security;
alter table public.event_tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.event_messages enable row level security;
alter table public.guest_registrations enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "Public read events" on public.events;
drop policy if exists "Public insert events" on public.events;
drop policy if exists "Public update events" on public.events;
drop policy if exists "Public read tasks" on public.event_tasks;
drop policy if exists "Public insert tasks" on public.event_tasks;
drop policy if exists "Public update tasks" on public.event_tasks;
drop policy if exists "Public read submissions" on public.task_submissions;
drop policy if exists "Public insert submissions" on public.task_submissions;
drop policy if exists "Public read messages" on public.event_messages;
drop policy if exists "Public insert messages" on public.event_messages;
drop policy if exists "Public read registrations" on public.guest_registrations;
drop policy if exists "Public insert registrations" on public.guest_registrations;
drop policy if exists "Public read checkins" on public.checkins;
drop policy if exists "Public insert checkins" on public.checkins;

create policy "Public read events" on public.events for select using (true);
create policy "Public insert events" on public.events for insert with check (true);
create policy "Public update events" on public.events for update using (true) with check (true);

create policy "Public read tasks" on public.event_tasks for select using (true);
create policy "Public insert tasks" on public.event_tasks for insert with check (true);
create policy "Public update tasks" on public.event_tasks for update using (true) with check (true);

create policy "Public read submissions" on public.task_submissions for select using (true);
create policy "Public insert submissions" on public.task_submissions for insert with check (true);

create policy "Public read messages" on public.event_messages for select using (true);
create policy "Public insert messages" on public.event_messages for insert with check (true);

create policy "Public read registrations" on public.guest_registrations for select using (true);
create policy "Public insert registrations" on public.guest_registrations for insert with check (true);

create policy "Public read checkins" on public.checkins for select using (true);
create policy "Public insert checkins" on public.checkins for insert with check (true);

insert into public.events (title, slug, date, location, organizer_name, description, status)
values (
  'EventFloX Demo Launch',
  'demo-launch',
  '2026-07-18',
  'New York, NY',
  'EventFloX Team',
  'A shared event room for team communication, task ownership, guest registration, and on-site check-in.',
  'planning'
)
on conflict (slug) do nothing;

insert into public.event_tasks (event_id, title, description, status)
select id, 'Confirm venue setup timeline', 'Coordinate loading dock time, AV test, signage, and reception desk setup.', 'open'
from public.events
where slug = 'demo-launch'
and not exists (
  select 1 from public.event_tasks where title = 'Confirm venue setup timeline'
);

insert into public.event_messages (event_id, author_name, body)
select id, 'EventFloX Demo', 'Welcome. Use this room to keep all event decisions, task updates, and check-in notes in one place.'
from public.events
where slug = 'demo-launch'
and not exists (
  select 1 from public.event_messages where body like 'Welcome. Use this room%'
);
