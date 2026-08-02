ALTER TABLE public.fb_post_queue
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

ALTER TABLE public.fb_groups
  ADD COLUMN IF NOT EXISTS paused_until timestamptz,
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.fb_queue_state (
  id integer PRIMARY KEY DEFAULT 1,
  stopped boolean NOT NULL DEFAULT false,
  stop_reason text,
  stopped_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fb_queue_state_single_row CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.fb_queue_state TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.fb_queue_state TO anon;
GRANT ALL ON public.fb_queue_state TO service_role;

ALTER TABLE public.fb_queue_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fb_queue_state_read" ON public.fb_queue_state;
CREATE POLICY "fb_queue_state_read" ON public.fb_queue_state
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "fb_queue_state_write" ON public.fb_queue_state;
CREATE POLICY "fb_queue_state_write" ON public.fb_queue_state
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "fb_queue_state_insert" ON public.fb_queue_state;
CREATE POLICY "fb_queue_state_insert" ON public.fb_queue_state
  FOR INSERT TO anon, authenticated WITH CHECK (id = 1);

INSERT INTO public.fb_queue_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;