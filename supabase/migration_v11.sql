-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v11 — Fix Foreign Key Constraint & Ensure Profile Sync
-- ============================================================

-- 1. Grant authenticated users permissions to INSERT/UPSERT their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Backfill any missing profiles from auth.users into public.profiles
INSERT INTO public.profiles (id, name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1), 'Student'),
  email,
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure handle_new_user trigger inserts into public.profiles on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Student'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
