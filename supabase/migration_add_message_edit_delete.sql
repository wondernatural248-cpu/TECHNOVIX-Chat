-- ==============================================================================
-- TECHNOVIX Chat - Migration: Message Edit & Delete Support
-- Run this migration in your Supabase SQL Editor to ensure message editing and
-- soft deletion are enabled with proper Row-Level Security (RLS).
-- ==============================================================================

-- 1. Ensure is_edited and deleted_at columns exist on public.messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_edited'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN is_edited BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Ensure RLS UPDATE policy on messages permits only the original sender to modify their messages
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- 3. Ensure RLS DELETE policy on messages permits only the original sender to delete their messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE TO authenticated 
    USING (auth.uid() = sender_id);

-- 4. Ensure replica identity is full so Realtime broadcasts complete row data on UPDATE
ALTER TABLE public.messages REPLICA IDENTITY FULL;
