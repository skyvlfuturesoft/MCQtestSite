-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v3 — Scheduling, Constraints, & Settings
-- ============================================================

-- 1. Update attempts status constraint to include 'terminated'
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_status_check;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_status_check CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'terminated'));

-- 2. Add scheduling and configuration parameters to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS negative_marking FLOAT DEFAULT 0.0;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS pass_threshold INTEGER DEFAULT 50;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS max_violations INTEGER DEFAULT 3;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS allowed_violations JSONB DEFAULT '["tab_switch", "window_blur", "fullscreen_exit", "devtools_open", "copy_paste_right_click", "network_disconnect"]'::jsonb;
