ALTER TABLE public.fb_post_queue
  DROP COLUMN IF EXISTS progress_at,
  DROP COLUMN IF EXISTS deferred_at,
  DROP COLUMN IF EXISTS stall_reason,
  DROP COLUMN IF EXISTS defer_count;