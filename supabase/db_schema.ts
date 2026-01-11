


export const DbSchema = `
-- ==============================================================================
-- SUPABASE DATABASE SCHEMA - KET NOI MOI NGUOI
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text, 
  full_name text, 
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Idempotent Column Additions
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'cover_url') then
    alter table public.profiles add column cover_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'bio') then
    alter table public.profiles add column bio text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text default 'User';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'location') then
    alter table public.profiles add column location text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'job') then
    alter table public.profiles add column job text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'education') then
    alter table public.profiles add column education text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'skills') then
    alter table public.profiles add column skills text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'hobbies') then
    alter table public.profiles add column hobbies text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'tags') then
    alter table public.profiles add column tags text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'privacy_settings') then
    alter table public.profiles add column privacy_settings jsonb default '{}'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'qr_code') then
    alter table public.profiles add column qr_code text;
  end if;
  
  -- NEW: Unique ID and Security Code
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'unique_id') then
    alter table public.profiles add column unique_id text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'security_code') then
    alter table public.profiles add column security_code text;
  end if;
  
  -- NEW: Birthday
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'birthday') then
    alter table public.profiles add column birthday text;
  end if;

  -- NEW: Detailed Info (JSONB) for granular filtering (Schools, Hometown, Games, etc.)
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'detailed_info') then
    alter table public.profiles add column detailed_info jsonb default '{}'::jsonb;
  end if;
end $$;

-- Enable RLS
alter table public.profiles enable row level security;

-- STRICT POLICIES
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Authenticated users can view profiles" on profiles; 

-- ALLOW AUTHENTICATED USERS TO VIEW ALL PROFILES (Needed for Suggestion/Search)
create policy "Authenticated users can view profiles" 
  on profiles for select using (auth.role() = 'authenticated');

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" 
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" 
  on profiles for update using (auth.uid() = id);


-- SECURE VIEW FUNCTION (Optional, for stricter partial data access)
create or replace function public.get_profile_view(target_id uuid)
returns jsonb
language plpgsql
security definer -- Runs with admin privileges to bypass RLS
set search_path = public
as $$
declare
  viewer_id uuid = auth.uid();
  target_profile profiles;
  privacy_settings jsonb;
  result jsonb;
  setting text;
begin
  -- 1. Fetch Target Profile
  select * into target_profile from profiles where id = target_id;
  
  if not found then
    return null;
  end if;

  -- 2. If Viewer is Owner, return everything
  if viewer_id = target_id then
    return to_jsonb(target_profile);
  end if;

  privacy_settings := coalesce(target_profile.privacy_settings, '{}'::jsonb);

  -- 3. Construct Public Base Object (Always Visible)
  result := jsonb_build_object(
    'id', target_profile.id,
    'name', target_profile.name,
    'avatar_url', target_profile.avatar_url,
    'role', target_profile.role,
    'bio', target_profile.bio -- Bio assumed public
  );

  -- 4. Conditionally Add Fields based on Settings
  setting := coalesce(privacy_settings->>'email', 'PRIVATE');
  if setting = 'PUBLIC' then
    result := result || jsonb_build_object('email', target_profile.email);
  end if;

  setting := coalesce(privacy_settings->>'job', 'PUBLIC');
  if setting = 'PUBLIC' then
    result := result || jsonb_build_object('job', target_profile.job);
  end if;

  setting := coalesce(privacy_settings->>'education', 'FRIENDS');
  if setting = 'PUBLIC' then
    result := result || jsonb_build_object('education', target_profile.education);
  end if;

  setting := coalesce(privacy_settings->>'skills', 'PUBLIC');
  if setting = 'PUBLIC' then
    result := result || jsonb_build_object('skills', target_profile.skills);
  end if;

  setting := coalesce(privacy_settings->>'hobbies', 'FRIENDS');
  if setting = 'PUBLIC' then
    result := result || jsonb_build_object('hobbies', target_profile.hobbies);
  end if;

  setting := coalesce(privacy_settings->>'address', 'CLOSE_FRIENDS');
  if setting = 'PUBLIC' then
    result := result || jsonb_build_object('location', target_profile.location);
  end if;

  return result;
end;
$$;


-- TRIGGER FOR NEW USER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User'), 
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

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
  birthday text,
  last_interaction_date date default CURRENT_DATE,
  source text default 'MANUAL',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.connections enable row level security;

drop policy if exists "Users can CRUD their own connections" on connections;
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
  sentiment_label text,
  sentiment_score float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.memories enable row level security;

drop policy if exists "Users can CRUD their own memories" on memories;
create policy "Users can CRUD their own memories" 
  on memories for all using (auth.uid() = user_id);


-- 5. CONNECTION_MEMORIES
create table if not exists public.connection_memories (
  memory_id uuid references public.memories(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  primary key (memory_id, connection_id)
);

alter table public.connection_memories enable row level security;

drop policy if exists "Users can CRUD their own memory links" on connection_memories;
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
  type text not null,
  is_favorite boolean default false,
  recurrence text default 'YEARLY', 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.events enable row level security;

drop policy if exists "Users can CRUD their own events" on events;
create policy "Users can CRUD their own events" 
  on events for all using (auth.uid() = user_id);


-- 7. VAULT_ITEMS TABLE
create table if not exists public.vault_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.vault_items(id) on delete cascade,
  name text not null,
  type text not null,
  size text,
  storage_path text,
  is_encrypted boolean default false,
  shared_with jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vault_items enable row level security;

drop policy if exists "Users can CRUD their own vault items" on vault_items;
create policy "Users can CRUD their own vault items" 
  on vault_items for all using (auth.uid() = user_id);


-- 8. STORAGE POLICIES
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('vault_files', 'vault_files', false) 
on conflict (id) do nothing;

drop policy if exists "Avatar Public Read" on storage.objects;
create policy "Avatar Public Read" 
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Avatar Auth Upload" on storage.objects;
create policy "Avatar Auth Upload" 
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

drop policy if exists "Vault Private Access" on storage.objects;
create policy "Vault Private Access" 
  on storage.objects for all using (
    bucket_id = 'vault_files' and auth.uid() = owner
  );


-- 9. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'BIRTHDAY', 'REMINDER', 'SYSTEM', 'INTERACTION', 'FRIEND_REQ'
  title text not null,
  message text,
  related_entity_id uuid, -- Link to Event, Connection, or Memory
  related_entity_type text, -- 'EVENT', 'CONNECTION', 'MEMORY', 'PROFILE'
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

-- Split policies to allow inserting notifications for other users (e.g. Friend Requests)
drop policy if exists "Users can CRUD their own notifications" on notifications;

drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications" 
  on notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" 
  on notifications for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on notifications;
create policy "Users can delete own notifications" 
  on notifications for delete using (auth.uid() = user_id);

drop policy if exists "Authenticated users can insert notifications" on notifications;
create policy "Authenticated users can insert notifications" 
  on notifications for insert with check (auth.role() = 'authenticated');

-- 10. RPC: CONNECT BY CODE
create or replace function public.connect_by_code(
    target_unique_id text,
    provided_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    sender_id uuid := auth.uid();
    target_profile profiles;
    sender_profile profiles;
    result_status text := 'NOT_FOUND';
    is_match boolean := false;
begin
    -- 1. Find Target
    select * into target_profile from profiles where unique_id = target_unique_id;
    
    if not found then
        return jsonb_build_object('status', 'NOT_FOUND', 'message', 'Mã người dùng không tồn tại.');
    end if;

    if target_profile.id = sender_id then
        return jsonb_build_object('status', 'SELF', 'message', 'Không thể kết bạn với chính mình.');
    end if;

    select * into sender_profile from profiles where id = sender_id;

    -- 2. Check Code
    if target_profile.security_code is not null 
       and target_profile.security_code <> '' 
       and target_profile.security_code = provided_code then
       is_match := true;
    end if;

    -- 3. Logic
    if is_match then
        -- A. Auto Connect (Mutual)
        
        -- Insert for Sender (You)
        insert into connections (user_id, name, role, avatar_url, tier, source, tags)
        values (
            sender_id,
            target_profile.name,
            target_profile.role,
            target_profile.avatar_url,
            1, -- Tier 1
            'APP',
            ARRAY[]::text[]
        );

        -- Insert for Target (Them)
        insert into connections (user_id, name, role, avatar_url, tier, source, tags)
        values (
            target_profile.id,
            sender_profile.name,
            sender_profile.role,
            sender_profile.avatar_url,
            1, -- Tier 1
            'APP',
            ARRAY[]::text[]
        );

        -- Notify Target
        insert into notifications (user_id, type, title, message, related_entity_id, related_entity_type)
        values (
            target_profile.id,
            'SYSTEM',
            'Tự động kết nối mới!',
            'Bạn đã được kết nối tự động với ' || sender_profile.name || ' qua Mã bảo mật.',
            sender_id,
            'PROFILE'
        );

        return jsonb_build_object('status', 'CONNECTED', 'message', 'Đã kết nối tự động thành công!');

    else
        -- B. Send Request (Notification Only)
        insert into notifications (user_id, type, title, message, related_entity_id, related_entity_type)
        values (
            target_profile.id,
            'FRIEND_REQ',
            sender_profile.name || ' muốn kết bạn',
            sender_profile.name || ' muốn kết nối với bạn. (Mã: ' || target_unique_id || ')',
            sender_id,
            'PROFILE'
        );

        return jsonb_build_object('status', 'REQUEST_SENT', 'message', 'Đã gửi lời mời kết bạn. Chờ xác nhận.');
    end if;
end;
$$;

-- 11. RPC: ACCEPT FRIEND REQUEST
create or replace function public.accept_friend_request(
    notification_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    receiver_id uuid := auth.uid(); -- Me, the one accepting
    sender_id uuid; -- The one who sent the request
    notif_record notifications;
    sender_profile profiles;
    receiver_profile profiles;
begin
    -- 1. Fetch Notification to get Sender ID
    select * into notif_record from notifications where id = notification_id and user_id = receiver_id;
    
    if not found then
        return jsonb_build_object('status', 'ERROR', 'message', 'Không tìm thấy lời mời.');
    end if;

    sender_id := notif_record.related_entity_id; -- Ensure related_entity_id was stored as sender_id in connect_by_code

    select * into sender_profile from profiles where id = sender_id;
    select * into receiver_profile from profiles where id = receiver_id;

    if not found then
         return jsonb_build_object('status', 'ERROR', 'message', 'Người dùng không tồn tại.');
    end if;

    -- 2. Create Mutual Connections
    
    -- Insert for Receiver (Me) - adding Sender
    insert into connections (user_id, name, role, avatar_url, tier, source, tags)
    values (
        receiver_id,
        sender_profile.name,
        sender_profile.role,
        sender_profile.avatar_url,
        1, -- Tier 1
        'APP',
        ARRAY[]::text[]
    );

    -- Insert for Sender (Them) - adding Me
    insert into connections (user_id, name, role, avatar_url, tier, source, tags)
    values (
        sender_id,
        receiver_profile.name,
        receiver_profile.role,
        receiver_profile.avatar_url,
        1, -- Tier 1
        'APP',
        ARRAY[]::text[]
    );

    -- 3. Update Notification Status
    update notifications 
    set is_read = true, 
        message = 'Bạn đã đồng ý kết bạn với ' || sender_profile.name
    where id = notification_id;

    -- 4. Notify Sender back
    insert into notifications (user_id, type, title, message, related_entity_id, related_entity_type)
    values (
        sender_id,
        'SYSTEM',
        'Lời mời được chấp nhận!',
        receiver_profile.name || ' đã đồng ý kết bạn với bạn.',
        receiver_id,
        'PROFILE'
    );

    return jsonb_build_object('status', 'SUCCESS', 'message', 'Đã kết bạn thành công!');
end;
$$;
