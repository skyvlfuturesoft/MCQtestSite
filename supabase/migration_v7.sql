-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v7 — Reset Password RPC Function
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_student_password(p_email text, p_new_password text)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Email not found');
  END IF;
  
  -- Update user password in auth schema
  UPDATE auth.users 
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Password reset successful');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
