-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v10 — Grant Admins DELETE policy on public.exams
-- ============================================================

DROP POLICY IF EXISTS "Admins can delete exams" ON public.exams;
CREATE POLICY "Admins can delete exams" ON public.exams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
