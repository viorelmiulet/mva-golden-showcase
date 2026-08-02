UPDATE public.fb_post_queue
SET status = 'failed',
    failed_at = now(),
    last_error = COALESCE(last_error, errors[array_length(errors, 1)])
WHERE attempts >= 3 AND status IN ('pending', 'posting', 'error');