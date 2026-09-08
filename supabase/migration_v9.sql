-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v9 — Grant Admin Management Policies
-- ============================================================

-- 1. Ensure Admins can update and delete attempts
DROP POLICY IF EXISTS "Admins can update attempts" ON public.attempts;
CREATE POLICY "Admins can update attempts" ON public.attempts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete attempts" ON public.attempts;
CREATE POLICY "Admins can delete attempts" ON public.attempts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Ensure Admins can delete answers and violations when granting retakes
DROP POLICY IF EXISTS "Admins can delete answers" ON public.answers;
CREATE POLICY "Admins can delete answers" ON public.answers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete violations" ON public.violations;
CREATE POLICY "Admins can delete violations" ON public.violations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
