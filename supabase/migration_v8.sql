-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v8 — Fix RLS Policy for Attempts Update
-- ============================================================

DROP POLICY IF EXISTS "Students can update own in-progress attempts" ON public.attempts;

CREATE POLICY "Students can update own in-progress attempts" ON public.attempts
  FOR UPDATE
  USING (student_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (student_id = auth.uid());
