-- ============================================================
-- E&TKS — Supabase Schema  (SQL Editor → New Query → Run)
-- Safe to re-run — uses IF NOT EXISTS + drop/recreate policies
-- ============================================================

-- ── Works ─────────────────────────────────────────────────────────────────────
create table if not exists public.works (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  format      text not null check (format in ('prose','comic','visual-novel','pdf','other')),
  tags        text[] not null default '{}',
  visibility  text not null default 'private' check (visibility in ('private','public')),
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists works_user_id_idx    on public.works (user_id, created_at desc);
create index if not exists works_visibility_idx on public.works (visibility, created_at desc);
create index if not exists works_tags_gin       on public.works using gin (tags);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at before update on public.works
  for each row execute function public.set_updated_at();

alter table public.works enable row level security;
do $$ begin
  drop policy if exists "Users read own works"   on public.works;
  drop policy if exists "Public works readable"  on public.works;
  drop policy if exists "Users insert own works" on public.works;
  drop policy if exists "Users update own works" on public.works;
  drop policy if exists "Users delete own works" on public.works;
end $$;
create policy "Users read own works"   on public.works for select using (auth.uid() = user_id);
create policy "Public works readable"  on public.works for select using (visibility = 'public');
create policy "Users insert own works" on public.works for insert with check (auth.uid() = user_id);
create policy "Users update own works" on public.works for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own works" on public.works for delete using (auth.uid() = user_id);

-- ── Reactions ─────────────────────────────────────────────────────────────────
create table if not exists public.work_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reaction text not null check (reaction in ('like','dislike')),
  created_at timestamptz not null default now(),
  unique (user_id, work_id)
);
create index if not exists reactions_work_id_idx on public.work_reactions (work_id);
alter table public.work_reactions enable row level security;
do $$ begin
  drop policy if exists "Reactions readable"         on public.work_reactions;
  drop policy if exists "Users insert own reactions" on public.work_reactions;
  drop policy if exists "Users delete own reactions" on public.work_reactions;
end $$;
create policy "Reactions readable"         on public.work_reactions for select using (true);
create policy "Users insert own reactions" on public.work_reactions for insert with check (auth.uid() = user_id);
create policy "Users delete own reactions" on public.work_reactions for delete using (auth.uid() = user_id);

-- ── Work Files ────────────────────────────────────────────────────────────────
create table if not exists public.work_files (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_type text not null check (file_type in ('pdf','image','comic_page')),
  file_url text not null,
  file_name text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);
create index if not exists work_files_work_id_idx on public.work_files (work_id, sort_order asc);
alter table public.work_files enable row level security;
do $$ begin
  drop policy if exists "Work files readable"      on public.work_files;
  drop policy if exists "Owners insert work files" on public.work_files;
  drop policy if exists "Owners delete work files" on public.work_files;
end $$;
create policy "Work files readable"      on public.work_files for select using (true);
create policy "Owners insert work files" on public.work_files for insert with check (auth.uid() = user_id);
create policy "Owners delete work files" on public.work_files for delete using (auth.uid() = user_id);

-- ── Comments ──────────────────────────────────────────────────────────────────
create table if not exists public.work_comments (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_work_id_idx on public.work_comments (work_id, created_at asc);
alter table public.work_comments enable row level security;
do $$ begin
  drop policy if exists "Comments readable"         on public.work_comments;
  drop policy if exists "Users post comments"       on public.work_comments;
  drop policy if exists "Users delete own comments" on public.work_comments;
end $$;
create policy "Comments readable"         on public.work_comments for select using (true);
create policy "Users post comments"       on public.work_comments for insert with check (auth.uid() = user_id);
create policy "Users delete own comments" on public.work_comments for delete using (auth.uid() = user_id);

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  bio        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_username_idx on public.profiles (username);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
do $$ begin
  drop policy if exists "Profiles readable"        on public.profiles;
  drop policy if exists "Users update own profile" on public.profiles;
end $$;
create policy "Profiles readable"        on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Storage ───────────────────────────────────────────────────────────────────
-- Step 1: Supabase Dashboard → Storage → New Bucket
--   Name: work-files
--   Public: ON (toggle)
--
-- Step 2: Storage → Policies → New Policy on storage.objects
--   Run these three separately:
--
-- Allow anyone to view files:
-- create policy "Public read files"
--   on storage.objects for select
--   using ( bucket_id = 'work-files' );
--
-- Allow signed-in users to upload:
-- create policy "Auth users can upload"
--   on storage.objects for insert
--   with check ( bucket_id = 'work-files' and auth.role() = 'authenticated' );
--
-- Allow uploader to delete their own files:
-- create policy "Owners can delete files"
--   on storage.objects for delete
--   using ( bucket_id = 'work-files' and auth.uid()::text = owner );
