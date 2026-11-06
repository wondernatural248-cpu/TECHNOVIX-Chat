-- ==============================================================================
-- TECHNOVIX Chat - Migration: Fix ON CONFLICT constraint for 1-to-1 conversations
-- Run this migration in your Supabase SQL Editor to resolve:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- ==============================================================================

-- 1. Ensure direct_key column exists on public.conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'direct_key'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN direct_key TEXT;
  END IF;
END $$;

-- 2. Drop the legacy partial index (partial index cannot serve as arbiter for ON CONFLICT (direct_key))
DROP INDEX IF EXISTS public.idx_conversations_direct_key;

-- 3. Clean up any duplicate direct_key values if concurrent inserts created any prior to constraint
DELETE FROM public.conversations c1
WHERE c1.direct_key IS NOT NULL
  AND c1.created_at < (
    SELECT MAX(c2.created_at)
    FROM public.conversations c2
    WHERE c2.direct_key = c1.direct_key
  );

-- 4. Enforce an explicit, full UNIQUE constraint on conversations(direct_key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.conversations'::regclass 
      AND (conname = 'conversations_direct_key_unique' OR conname = 'conversations_direct_key_key')
  ) THEN
    ALTER TABLE public.conversations 
      ADD CONSTRAINT conversations_direct_key_unique UNIQUE (direct_key);
  END IF;
END $$;

-- 5. Ensure conversation_participants has an explicit unique constraint on (conversation_id, profile_id)
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

-- 6. Deploy the hardened, concurrency-safe get_or_create_direct_conversation RPC
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

-- 7. Grant execution permission to authenticated users
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
