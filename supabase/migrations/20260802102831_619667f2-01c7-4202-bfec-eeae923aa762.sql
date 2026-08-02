ALTER TABLE public.fb_post_queue ADD COLUMN IF NOT EXISTS group_attempts jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Unblock current state: retry failed rows, clear paused groups and global stop
UPDATE public.fb_post_queue SET status='pending', attempts=0, failed_at=NULL, next_attempt_at=now() WHERE status IN ('failed','posting');
UPDATE public.fb_groups SET paused_until=NULL, pause_reason=NULL, consecutive_failures=0;
UPDATE public.fb_queue_state SET stopped=false, stop_reason=NULL, stopped_at=NULL, consecutive_failures=0 WHERE id=1;