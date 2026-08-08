CREATE TABLE public.project_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  youtube_id text NOT NULL,
  title text,
  position integer NOT NULL DEFAULT 1,
  thumb_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.project_videos TO anon;
GRANT SELECT ON public.project_videos TO authenticated;
GRANT ALL ON public.project_videos TO service_role;

ALTER TABLE public.project_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view development videos"
ON public.project_videos FOR SELECT
USING (true);

CREATE INDEX idx_project_videos_project ON public.project_videos(project_id, position);

CREATE TRIGGER update_project_videos_updated_at
BEFORE UPDATE ON public.project_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.project_videos (project_id, youtube_id, title, position, thumb_url)
SELECT id, video_id, 'Prezentare', 1, video_thumb_url
FROM public.real_estate_projects
WHERE video_id IS NOT NULL AND btrim(video_id) <> '';

UPDATE public.real_estate_projects
SET video_manual = NULL, video_id = NULL, video_thumb_url = NULL
WHERE video_id IS NOT NULL;