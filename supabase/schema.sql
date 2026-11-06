-- ==============================================================================
-- TECHNOVIX Chat - Supabase PostgreSQL Database Schema
-- Production Architecture for Supabase Auth, Row-Level Security & Real-Time Messaging
-- Audited for Non-Recursive RLS, Concurrency Safety, and Hardened Security
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Extensions Setup
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table (Synced automatically with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT DEFAULT 'Cruising the TECHNOVIX neural grid',
    status_indicator TEXT DEFAULT 'online' CHECK (status_indicator IN ('online', 'busy', 'away', 'offline')),
    custom_status TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for searching profiles by handle or name
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- ------------------------------------------------------------------------------
-- 2. Conversations Table (Direct 1-on-1 & Group channels)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT, -- Null for 1-on-1 direct messages; set for groups/channels
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'channel')),
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    direct_key TEXT UNIQUE, -- Unique deterministic token for 1-on-1 chats: 'min_uuid:max_uuid'
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure direct_key column and full UNIQUE constraint exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'direct_key'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN direct_key TEXT;
  END IF;

  -- Drop legacy partial index (partial index with WHERE clause cannot be used as arbiter for ON CONFLICT (direct_key))
  DROP INDEX IF EXISTS public.idx_conversations_direct_key;

  -- Clean up any duplicates if any exist from concurrent inserts before constraint
  DELETE FROM public.conversations c1
  WHERE c1.direct_key IS NOT NULL
    AND c1.created_at < (
      SELECT MAX(c2.created_at)
      FROM public.conversations c2
      WHERE c2.direct_key = c1.direct_key
    );

  -- Ensure an explicit, full UNIQUE constraint exists on conversations(direct_key)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.conversations'::regclass 
      AND (conname = 'conversations_direct_key_unique' OR conname = 'conversations_direct_key_key')
  ) THEN
    ALTER TABLE public.conversations 
      ADD CONSTRAINT conversations_direct_key_unique UNIQUE (direct_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_last_msg 
    ON public.conversations(last_message_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Conversation Participants Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, profile_id)
);

-- Ensure conversation_participants has an explicit unique constraint on (conversation_id, profile_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.conversation_participants'::regclass 
      AND contype IN ('p', 'u')
      AND array_to_string(conkey, ',') = (
        SELECT array_to_string(array_agg(attnum ORDER BY attnum), ',')
        FROM pg_attribute 
        WHERE attrelid = 'public.conversation_participants'::regclass 
          AND attname IN ('conversation_id', 'profile_id')
      )
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'conversation_participants' 
      AND indexdef ILIKE '%(conversation_id, profile_id)%'
      AND indexdef ILIKE '%UNIQUE%'
  ) THEN
    -- Deduplicate if any duplicate participants exist
    DELETE FROM public.conversation_participants cp1
    WHERE cp1.ctid < (
      SELECT MAX(cp2.ctid)
      FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = cp1.conversation_id
        AND cp2.profile_id = cp1.profile_id
    );

    ALTER TABLE public.conversation_participants 
      ADD CONSTRAINT conversation_participants_conv_profile_unique UNIQUE (conversation_id, profile_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conv_participants_profile 
    ON public.conversation_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv 
    ON public.conversation_participants(conversation_id);

-- ------------------------------------------------------------------------------
-- 4. Messages Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'system')),
    attachments JSONB DEFAULT '[]'::jsonb,
    is_edited BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender 
    ON public.messages(sender_id);

-- ------------------------------------------------------------------------------
-- 5. Security Definer Helper Functions (RLS Recursion Breakers)
-- ------------------------------------------------------------------------------

-- Helper 1: Check conversation membership without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
    target_conv_id UUID,
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = target_conv_id
      AND profile_id = target_user_id
  );
$$;

-- Helper 2: Check conversation administration/ownership privileges safely
CREATE OR REPLACE FUNCTION public.is_conversation_admin(
    target_conv_id UUID,
    target_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = target_conv_id
      AND profile_id = target_user_id
      AND role IN ('owner', 'admin')
  ) OR EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = target_conv_id
      AND created_by = target_user_id
  );
$$;

-- ------------------------------------------------------------------------------
-- 6. Automatic Profile Creation on User Sign-Up (Trigger)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  extracted_username TEXT;
  extracted_full_name TEXT;
  extracted_avatar TEXT;
BEGIN
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 4)
  );

  extracted_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (NEW.id, extracted_username, extracted_full_name, extracted_avatar)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning to PostgreSQL log and ensure user auth registration does not fail
  RAISE WARNING 'handle_new_user trigger warning: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. Trigger to Update Conversation Timestamp on New Message
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- ------------------------------------------------------------------------------
-- 8. Concurrency-Safe 1-to-1 Direct Conversation Lookup or Creation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  p_user1 UUID;
  p_user2 UUID;
  d_key TEXT;
  existing_conv_id UUID;
  new_conv_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself';
  END IF;

  -- Ensure target recipient profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = other_user_id) THEN
    RAISE EXCEPTION 'Target user profile does not exist';
  END IF;

  -- Construct deterministic canonical pair token (e.g. 'uuid1:uuid2' in sorted order)
  p_user1 := LEAST(current_user_id, other_user_id);
  p_user2 := GREATEST(current_user_id, other_user_id);
  d_key := p_user1::text || ':' || p_user2::text;

  -- 1. Acquire transaction-level advisory lock on the hash of this exact pair
  -- This completely serializes concurrent requests between these two users
  PERFORM pg_advisory_xact_lock(hashtext('direct_conv:' || d_key));

  -- 2. Fast lookup by unique direct_key
  SELECT id INTO existing_conv_id
  FROM public.conversations
  WHERE direct_key = d_key
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    -- Ensure both participants are present in conversation_participants
    BEGIN
      INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
      VALUES 
        (existing_conv_id, current_user_id, 'owner'),
        (existing_conv_id, other_user_id, 'member')
      ON CONFLICT (conversation_id, profile_id) DO NOTHING;
    EXCEPTION WHEN invalid_column_reference OR undefined_column OR unique_violation THEN
      INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
      SELECT existing_conv_id, current_user_id, 'owner'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = existing_conv_id AND profile_id = current_user_id
      );

      INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
      SELECT existing_conv_id, other_user_id, 'member'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = existing_conv_id AND profile_id = other_user_id
      );
    END;

    RETURN existing_conv_id;
  END IF;

  -- 3. Legacy fallback: check if a conversation already exists without direct_key
  SELECT c.id INTO existing_conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.profile_id = current_user_id
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.profile_id = other_user_id
  WHERE c.type = 'direct'
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    -- Backfill direct_key for instant future lookups
    UPDATE public.conversations
    SET direct_key = d_key
    WHERE id = existing_conv_id AND direct_key IS NULL;

    -- Ensure both participants are present in conversation_participants
    BEGIN
      INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
      VALUES 
        (existing_conv_id, current_user_id, 'owner'),
        (existing_conv_id, other_user_id, 'member')
      ON CONFLICT (conversation_id, profile_id) DO NOTHING;
    EXCEPTION WHEN invalid_column_reference OR undefined_column OR unique_violation THEN
      INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
      SELECT existing_conv_id, current_user_id, 'owner'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = existing_conv_id AND profile_id = current_user_id
      );

      INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
      SELECT existing_conv_id, other_user_id, 'member'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = existing_conv_id AND profile_id = other_user_id
      );
    END;

    RETURN existing_conv_id;
  END IF;

  -- 4. Create new direct conversation with direct_key
  -- Uses the unique constraint conversations_direct_key_unique
  BEGIN
    INSERT INTO public.conversations (type, created_by, direct_key)
    VALUES ('direct', current_user_id, d_key)
    ON CONFLICT (direct_key) DO NOTHING
    RETURNING id INTO new_conv_id;
  EXCEPTION WHEN invalid_column_reference OR undefined_column OR unique_violation THEN
    SELECT id INTO new_conv_id
    FROM public.conversations
    WHERE direct_key = d_key
    LIMIT 1;

    IF new_conv_id IS NULL THEN
      INSERT INTO public.conversations (type, created_by, direct_key)
      VALUES ('direct', current_user_id, d_key)
      RETURNING id INTO new_conv_id;
    END IF;
  END;

  -- If concurrent insert succeeded right before us, fetch it
  IF new_conv_id IS NULL THEN
    SELECT id INTO new_conv_id
    FROM public.conversations
    WHERE direct_key = d_key
    LIMIT 1;
  END IF;

  IF new_conv_id IS NULL THEN
    RAISE EXCEPTION 'Could not create or find direct conversation';
  END IF;

  -- 5. Insert both participants atomically
  BEGIN
    INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
    VALUES 
      (new_conv_id, current_user_id, 'owner'),
      (new_conv_id, other_user_id, 'member')
    ON CONFLICT (conversation_id, profile_id) DO NOTHING;
  EXCEPTION WHEN invalid_column_reference OR undefined_column OR unique_violation THEN
    INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
    SELECT new_conv_id, current_user_id, 'owner'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = new_conv_id AND profile_id = current_user_id
    );

    INSERT INTO public.conversation_participants (conversation_id, profile_id, role)
    SELECT new_conv_id, other_user_id, 'member'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = new_conv_id AND profile_id = other_user_id
    );
  END;

  RETURN new_conv_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Policies (Hardened & Non-Recursive)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- CONVERSATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT TO authenticated USING (
        public.is_conversation_participant(id, auth.uid())
    );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = created_by
    );

DROP POLICY IF EXISTS "Admins or participants can update conversation details" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
CREATE POLICY "Admins or participants can update conversation details" ON public.conversations
    FOR UPDATE TO authenticated USING (
        public.is_conversation_admin(id, auth.uid())
    );

-- ------------------------------------------------------------------------------
-- CONVERSATION PARTICIPANTS POLICIES (Recursion-Free)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can view conversation members" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation members" ON public.conversation_participants
    FOR SELECT TO authenticated USING (
        profile_id = auth.uid() OR
        public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins or creators can add participants" ON public.conversation_participants;
CREATE POLICY "Admins or creators can add participants" ON public.conversation_participants
    FOR INSERT TO authenticated WITH CHECK (
        public.is_conversation_admin(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own participant state" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant state" ON public.conversation_participants
    FOR UPDATE TO authenticated 
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave or admins can remove participants" ON public.conversation_participants;
CREATE POLICY "Users can leave or admins can remove participants" ON public.conversation_participants
    FOR DELETE TO authenticated USING (
        profile_id = auth.uid() OR
        public.is_conversation_admin(conversation_id, auth.uid())
    );

-- ------------------------------------------------------------------------------
-- MESSAGES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT TO authenticated USING (
        public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = sender_id AND
        public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE TO authenticated USING (
        auth.uid() = sender_id
    );

-- ------------------------------------------------------------------------------
-- 10. Execution Permissions Configuration
-- ------------------------------------------------------------------------------
-- Revoke execution from PUBLIC on security-sensitive functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conversation_participant(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conversation_admin(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM PUBLIC;

-- Grant execution to authenticated users for client RPCs and policy helpers
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 11. Realtime Publication Setup (Idempotent)
-- ------------------------------------------------------------------------------
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables if not already present
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;
END $$;
