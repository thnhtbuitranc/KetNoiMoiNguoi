export const DbSchema = `
-- ==============================================================================
-- SUPABASE DATABASE SCHEMA - KET NOI MOI NGUOI
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard -> SQL Editor.
-- 2. Copy the content of this string (excluding the JS wrapper).
-- 3. Paste into the SQL Editor and click RUN.
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE (Syncs with Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'User',
  location text,
  qr_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on profiles for select using (true);

create policy "Users can insert their own profile" 
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on profiles for update using (auth.uid() = id);

-- Trigger to create profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. CONNECTIONS TABLE
create table if not exists public.connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  nickname text,
  role text,
  avatar_url text,
  tier int default 1 check (tier between 1 and 5),
  tags text[],
  phone text,
  location text,
  birthday text, -- Format: DD/MM or YYYY-MM-DD
  last_interaction_date date default CURRENT_DATE,
  source text default 'MANUAL', -- 'APP', 'MANUAL'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Connections
alter table public.connections enable row level security;

-- Connections Policies
create policy "Users can CRUD their own connections" 
  on connections for all using (auth.uid() = user_id);


-- 4. MEMORIES TABLE
create table if not exists public.memories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text,
  happened_at date default CURRENT_DATE,
  type text not null check (type in ('PHOTO', 'VIDEO', 'NOTE', 'VOICE')),
  media_url text,
  sentiment_label text, -- AI Generated
  sentiment_score float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Memories
alter table public.memories enable row level security;

-- Memories Policies
create policy "Users can CRUD their own memories" 
  on memories for all using (auth.uid() = user_id);


-- 5. CONNECTION_MEMORIES (Junction Table for Linking Memories to People)
create table if not exists public.connection_memories (
  memory_id uuid references public.memories(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  primary key (memory_id, connection_id)
);

-- Enable RLS for Junction
alter table public.connection_memories enable row level security;

-- Junction Policies
create policy "Users can CRUD their own memory links" 
  on connection_memories for all using (
    exists (select 1 from memories where id = connection_memories.memory_id and user_id = auth.uid())
  );


-- 6. EVENTS TABLE
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  connection_id uuid references public.connections(id) on delete set null,
  title text not null,
  event_date date not null,
  type text not null, -- 'BIRTHDAY', 'ANNIVERSARY', 'MEMORIAL', 'OTHER'
  is_favorite boolean default false,
  recurrence text default 'YEARLY', 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Events
alter table public.events enable row level security;

-- Events Policies
create policy "Users can CRUD their own events" 
  on events for all using (auth.uid() = user_id);


-- 7. VAULT_ITEMS TABLE (For File Storage Metadata)
create table if not exists public.vault_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.vault_items(id) on delete cascade,
  name text not null,
  type text not null, -- 'FOLDER', 'IMAGE', 'DOC', 'AUDIO'
  size text,
  storage_path text,
  is_encrypted boolean default false,
  shared_with jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Vault
alter table public.vault_items enable row level security;

-- Vault Policies
create policy "Users can CRUD their own vault items" 
  on vault_items for all using (auth.uid() = user_id);


-- 8. STORAGE BUCKETS SETUP
-- Insert standard buckets if not exists
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('vault_files', 'vault_files', false) 
on conflict (id) do nothing;

-- Storage Policies
-- Avatars: Public Read, Authenticated Upload
create policy "Avatar Public Read" 
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Avatar Auth Upload" 
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

-- Vault: Private Read/Write
create policy "Vault Private Access" 
  on storage.objects for all using (
    bucket_id = 'vault_files' and auth.uid() = owner
  );
`;