-- ============================================================
-- Database Migration v6 — Multiple Question Types & Exam States
-- ============================================================

-- 1. Extend questions table to support different question types and images
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'fill_in_blank', 'image_mcq', 'image_fib'));
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS accepted_answers JSONB DEFAULT '[]'::jsonb;

-- 2. Extend answers table to support text answers (for Fill in the Blank)
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS selected_answer_text TEXT;

-- 3. Extend attempts table to store calculated statistics and snapshot history
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS percentage FLOAT DEFAULT 0.0;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS wrong_count INTEGER DEFAULT 0;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS skipped_count INTEGER DEFAULT 0;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS time_taken INTEGER DEFAULT 0;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS attempt_history JSONB DEFAULT '[]'::jsonb;

-- 4. Create public storage bucket for question images (with RLS support)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-images', 'exam-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket object access
DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
CREATE POLICY "Public Storage Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'exam-images');

DROP POLICY IF EXISTS "Admins manage objects" ON storage.objects;
CREATE POLICY "Admins manage objects" ON storage.objects 
  FOR ALL USING (
    bucket_id = 'exam-images' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
