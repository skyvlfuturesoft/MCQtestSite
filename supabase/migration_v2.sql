-- ============================================================
-- SECURE ONLINE EXAMINATION MANAGEMENT SYSTEM (SOEMS)
-- Database Migration v2 — Proctoring, Violations & Audit Logs
-- ============================================================

-- 1. VIOLATIONS TABLE
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL, -- 'tab_switch', 'window_blur', 'fullscreen_exit', 'devtools_open', 'refresh_attempt', etc.
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    device TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KICK LOGS TABLE
CREATE TABLE IF NOT EXISTS public.kick_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    violation_count INTEGER DEFAULT 0,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    device TEXT,
    final_score INTEGER,
    duration_completed INTEGER, -- seconds
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'logout', 'exam_started', 'violation_warning', 'student_kicked', 'exam_submitted', 'network_lost', 'network_restored'
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role TEXT NOT NULL DEFAULT 'admin' CHECK (recipient_role IN ('student', 'admin')),
    type TEXT NOT NULL, -- 'exam_started', 'exam_submitted', 'violation_warning', 'student_kicked', 'network_lost', 'network_restored'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE UNIQUE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_question_index INTEGER DEFAULT 0,
    answered_count INTEGER DEFAULT 0,
    time_remaining INTEGER, -- seconds
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    connection_status TEXT NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected')),
    is_paused BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADMIN ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'pause', 'resume', 'force_submit', 'terminate', 'extend_timer', 'reset_violations', 'lock_student'
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_violations_attempt_id ON public.violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_kick_logs_student_id ON public.kick_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_attempt_id ON public.live_sessions(attempt_id);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kick_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can do everything. Students can insert/read their own values.
-- VIOLATIONS POLICIES
CREATE POLICY "Students can insert own violations" ON public.violations
    FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Users can read own violations" ON public.violations
    FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admins can view all violations" ON public.violations
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- KICK LOGS POLICIES
CREATE POLICY "Students can view own kick logs" ON public.kick_logs
    FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admins can view all kick logs" ON public.kick_logs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ACTIVITY LOGS POLICIES
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- LIVE SESSIONS POLICIES
CREATE POLICY "Students can manage own live session" ON public.live_sessions
    FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Admins can manage all live sessions" ON public.live_sessions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ADMIN ACTIONS POLICIES
CREATE POLICY "Students can view own actions" ON public.admin_actions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = admin_actions.attempt_id AND attempts.student_id = auth.uid()));
CREATE POLICY "Admins can manage actions" ON public.admin_actions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Enable Supabase Realtime for live monitoring and activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.violations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kick_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
