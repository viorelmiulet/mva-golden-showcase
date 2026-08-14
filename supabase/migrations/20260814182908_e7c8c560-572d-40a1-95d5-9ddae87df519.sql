ALTER TABLE public.fb_post_queue
  ADD COLUMN IF NOT EXISTS progress_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deferred_at timestamptz,
  ADD COLUMN IF NOT EXISTS defer_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stall_reason text;