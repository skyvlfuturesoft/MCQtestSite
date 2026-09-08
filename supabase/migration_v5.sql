-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v5 — Performance Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_violations_student_id ON public.violations(student_id);
CREATE INDEX IF NOT EXISTS idx_kick_logs_exam_id ON public.kick_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_attempt_id ON public.admin_actions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON public.attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON public.violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON public.event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kick_logs_created_at ON public.kick_logs(created_at DESC);
