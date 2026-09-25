import { supabase } from './supabase';

export const API_URL = '';

let userCache = null;
let userCacheTime = 0;
const USER_CACHE_TTL = 30000; // Cache profile for 30 seconds in memory

export function clearUserCache() {
  userCache = null;
  userCacheTime = 0;
}

async function getCurrentUser() {
  const now = Date.now();
  if (userCache && (now - userCacheTime < USER_CACHE_TTL)) {
    return userCache;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    userCache = null;
    return null;
  }

  // Try to read profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const fallbackProfile = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
      role: user.user_metadata?.role || 'student'
    };
    try {
      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select('id, name, email, role')
        .maybeSingle();
      profile = createdProfile || fallbackProfile;
    } catch (_) {
      profile = fallbackProfile;
    }
  }

  userCache = profile;
  userCacheTime = now;
  return userCache;
}

export async function api(endpoint, options = {}) {
  const { method = 'GET', body, params } = options;

  // Clean the endpoint to inspect the route
  const cleanEndpoint = endpoint.split('?')[0];

  try {
    // 1. AUTH ROUTES
    if (cleanEndpoint === '/api/auth/login') {
      const { email, password } = body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Fetch user profile
      let profileRes = await supabase.from('profiles').select('role, name').eq('id', data.user.id).maybeSingle();
      let role = 'student';
      let name = email.split('@')[0];

      if (!profileRes.data) {
        // Fallback insert
        role = data.user.user_metadata?.role || 'student';
        name = data.user.user_metadata?.name || name;
        await supabase.from('profiles').insert({
          id: data.user.id,
          name,
          email: data.user.email,
          role
        });
      } else {
        role = profileRes.data.role;
        name = profileRes.data.name;
      }

      const sessionObj = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };

      return {
        user: { id: data.user.id, email: data.user.email, role, name },
        session: sessionObj
      };
    }

    if (cleanEndpoint === '/api/auth/register') {
      const { name, email, password, role } = body;
      const assignedRole = role || 'student';
      const displayName = name || email.split('@')[0];

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: displayName, role: assignedRole }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('Registration failed — no user returned');

      // Create or update student profile in profiles table
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: displayName,
          email: data.user.email,
          role: assignedRole
        });
      } catch (_) {
        // Ignore duplicate profile insertion error if handled by trigger
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: displayName,
          role: assignedRole
        },
        session: {
          access_token: data.session?.access_token || null,
          refresh_token: data.session?.refresh_token || null
        }
      };
    }

    if (cleanEndpoint === '/api/auth/reset-password') {
      const { email, new_password } = body;
      const { data, error } = await supabase.rpc('reset_student_password', {
        p_email: email,
        p_new_password: new_password
      });
      if (error) throw error;
      if (!data || !data.success) {
        throw new Error(data?.message || 'Password reset failed');
      }
      return data;
    }

    // 2. RUNTIME AUTHORIZED REQUESTS
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      // Clear token / local session
      localStorage.removeItem('soems_session');
      throw new Error('Session expired — please log in again');
    }

    // LIST EXAMS
    if (cleanEndpoint === '/api/exams' && method === 'GET') {
      let query = supabase.from('exams').select('*, profiles(name)').order('created_at', { ascending: false });
      if (currentUser.role !== 'admin') {
        query = query.eq('is_published', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { exams: data || [] };
    }

    // CREATE EXAM
    if (cleanEndpoint === '/api/exams' && method === 'POST') {
      const allowed_v = body.allowed_violations !== undefined ? body.allowed_violations : [
        "tab_switch", "window_blur", "fullscreen_exit", "devtools_open", "copy_paste_right_click", "network_disconnect"
      ];
      const { data, error } = await supabase.from('exams').insert({
        title: body.title,
        description: body.description,
        duration: body.duration,
        created_by: currentUser.id,
        start_time: body.start_time,
        end_time: body.end_time,
        negative_marking: body.negative_marking,
        pass_threshold: body.pass_threshold,
        max_violations: body.max_violations,
        allowed_violations: allowed_v,
        is_published: body.is_published === true ? true : false
      }).select().single();
      if (error) throw error;
      return { exam: data };
    }

    // UPDATE EXAM
    if (cleanEndpoint.startsWith('/api/exams/') && method === 'PUT') {
      const examId = cleanEndpoint.split('/')[3];
      const updateData = { ...body, updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('exams').update(updateData).eq('id', examId).select().single();
      if (error) throw error;
      return { exam: data };
    }

    // DELETE SINGLE EXAM (EXACT ROUTE MATCH WITH CASCADE & FALLBACK)
    const examDeleteMatch = cleanEndpoint.match(/^\/api\/exams\/([a-f0-9-]+)$/i);
    if (examDeleteMatch && method === 'DELETE') {
      const examId = examDeleteMatch[1];
      if (!examId) throw new Error('Exam ID is required');

      try {
        // 1. Fetch attempt IDs for this exam
        const { data: attempts } = await supabase
          .from('attempts')
          .select('id')
          .eq('exam_id', examId);

        const attemptIds = (attempts || []).map((a) => a.id);

        if (attemptIds.length > 0) {
          try { await supabase.from('answers').delete().in('attempt_id', attemptIds); } catch (_) {}
          try { await supabase.from('violations').delete().in('attempt_id', attemptIds); } catch (_) {}
          try { await supabase.from('kick_logs').delete().in('attempt_id', attemptIds); } catch (_) {}
          try { await supabase.from('live_sessions').delete().in('attempt_id', attemptIds); } catch (_) {}
          try { await supabase.from('activity_logs').delete().in('attempt_id', attemptIds); } catch (_) {}
          try { await supabase.from('event_logs').delete().in('attempt_id', attemptIds); } catch (_) {}
        }

        try { await supabase.from('kick_logs').delete().eq('exam_id', examId); } catch (_) {}
        try { await supabase.from('attempts').delete().eq('exam_id', examId); } catch (_) {}
        try { await supabase.from('questions').delete().eq('exam_id', examId); } catch (_) {}

        // Delete exam record
        const { error } = await supabase.from('exams').delete().eq('id', examId);
        if (error) {
          // If RLS prevents hard delete, soft delete by unpublishing
          await supabase.from('exams').update({ is_published: false }).eq('id', examId);
        }

        return { success: true };
      } catch (err) {
        try {
          await supabase.from('exams').update({ is_published: false }).eq('id', examId);
          return { success: true };
        } catch (fallbackErr) {
          throw new Error(err.message || 'Failed to delete exam');
        }
      }
    }

    // GET SINGLE EXAM
    const examGetMatch = cleanEndpoint.match(/^\/api\/exams\/([a-f0-9-]+)$/i);
    if (examGetMatch && method === 'GET') {
      const examId = examGetMatch[1];
      const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (error) throw error;
      return { exam: data };
    }

    // GET EXAM QUESTIONS
    const examQuestionsMatch = cleanEndpoint.match(/^\/api\/exams\/([a-f0-9-]+)\/questions$/i);
    if (examQuestionsMatch && method === 'GET') {
      const examId = examQuestionsMatch[1];
      const { data, error } = await supabase
        .from('questions')
        .select('id, exam_id, question_text, options, correct_answer, accepted_answers, question_type, image_url, marks, created_at')
        .eq('exam_id', examId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      let questions = data || [];

      if (currentUser.role !== 'admin') {
        const { data: attempt } = await supabase
          .from('attempts')
          .select('id')
          .eq('student_id', currentUser.id)
          .eq('exam_id', examId)
          .eq('status', 'in_progress')
          .maybeSingle();

        if (attempt) {
          // Simple client-side LCG random shuffle using attempt.id as seed
          let seed = 0;
          for (let i = 0; i < attempt.id.length; i++) {
            seed += attempt.id.charCodeAt(i);
          }
          const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
          };
          // Shuffle
          for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
          }
        }
        // Strip correct answers
        questions = questions.map(q => ({
          ...q,
          correct_answer: null,
          accepted_answers: null
        }));
      }

      return { questions };
    }

    // BULK DELETE ALL QUESTIONS FOR AN EXAM
    const examQuestionsDeleteMatch = cleanEndpoint.match(/^\/api\/exams\/([a-f0-9-]+)\/questions$/i);
    if (examQuestionsDeleteMatch && method === 'DELETE') {
      const examId = examQuestionsDeleteMatch[1];
      const { error } = await supabase.from('questions').delete().eq('exam_id', examId);
      if (error) throw error;
      return { success: true };
    }

    // CREATE OR UPDATE QUESTIONS (SINGLE OR BULK ARRAY)
    if (cleanEndpoint === '/api/questions' && method === 'POST') {
      if (Array.isArray(body)) {
        if (body.length === 0) return { questions: [] };
        const { data, error } = await supabase.from('questions').insert(body).select();
        if (error) throw error;
        return { questions: data };
      } else {
        const { data, error } = await supabase.from('questions').insert(body).select().single();
        if (error) throw error;
        return { question: data };
      }
    }

    // DELETE QUESTION BY ID
    if (cleanEndpoint.startsWith('/api/questions/') && method === 'DELETE') {
      const questionId = cleanEndpoint.split('/')[3];
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      return { success: true };
    }

    // START ATTEMPT
    if (cleanEndpoint === '/api/attempts/start' && method === 'POST') {
      const examId = params?.exam_id || new URLSearchParams(endpoint.split('?')[1]).get('exam_id');
      if (currentUser.role !== 'student') {
        throw new Error('Only students can start exams');
      }

      // Ensure student profile exists in database before inserting/querying attempts
      const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', currentUser.id).maybeSingle();
      if (!profileCheck) {
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          name: currentUser.name || currentUser.email?.split('@')[0] || 'Student',
          email: currentUser.email || '',
          role: currentUser.role || 'student'
        }, { onConflict: 'id' });
      }

      // Skip any 'retake_granted' attempts — admin has cleared the way for a fresh attempt
      // Check in_progress
      const { data: existingList } = await supabase
        .from('attempts')
        .select('*')
        .eq('student_id', currentUser.id)
        .eq('exam_id', examId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1);

      const existing = existingList?.[0];
      if (existing) {
        // If started_at is null or attempt score was reset for retake, refresh started_at timestamp to NOW
        if (existing.score === null && (!existing.started_at || (new Date() - new Date(existing.started_at)) > 10000)) {
          const { data: refreshed } = await supabase
            .from('attempts')
            .update({ started_at: new Date().toISOString(), time_taken: 0 })
            .eq('id', existing.id)
            .select()
            .single();
          return { attempt: refreshed || existing, resumed: false };
        }
        return { attempt: existing, resumed: true };
      }

      // Check if a retake has been granted (skip terminated / completed checks in that case)
      const { data: retakeGrantedList } = await supabase
        .from('attempts')
        .select('id')
        .eq('student_id', currentUser.id)
        .eq('exam_id', examId)
        .eq('status', 'retake_granted')
        .order('created_at', { ascending: false })
        .limit(1);

      const retakeGranted = retakeGrantedList?.[0];

      if (!retakeGranted) {
        const { data: terminatedList } = await supabase
          .from('attempts')
          .select('*')
          .eq('student_id', currentUser.id)
          .eq('exam_id', examId)
          .eq('status', 'terminated')
          .order('created_at', { ascending: false })
          .limit(1);

        if (terminatedList?.[0]) {
          throw new Error('Your examination session has been terminated due to security violations.');
        }

        const { data: completedList } = await supabase
          .from('attempts')
          .select('*')
          .eq('student_id', currentUser.id)
          .eq('exam_id', examId)
          .in('status', ['submitted', 'auto_submitted'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (completedList?.[0]) {
          throw new Error('You have already completed this exam');
        }
      }

      // Get exam to compute total marks
      const { data: exam, error: examError } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (examError || !exam) throw new Error('Exam not found');
      if (!exam.is_published) throw new Error('Exam is not published');

      const now = new Date();
      if (exam.start_time && now < new Date(exam.start_time)) {
        throw new Error(`Exam scheduled window has not opened yet. Starts at: ${new Date(exam.start_time).toLocaleString()}`);
      }
      if (exam.end_time && now > new Date(exam.end_time)) {
        throw new Error('Exam scheduled window has closed.');
      }

      const { data: questions } = await supabase.from('questions').select('marks').eq('exam_id', examId);
      const total_marks = (questions || []).reduce((sum, q) => sum + (q.marks || 1), 0);

      let attempt;
      if (retakeGranted) {
        // Clear previous answers & violations for retake
        await Promise.all([
          supabase.from('answers').delete().eq('attempt_id', retakeGranted.id),
          supabase.from('violations').delete().eq('attempt_id', retakeGranted.id),
          supabase.from('kick_logs').delete().eq('attempt_id', retakeGranted.id),
          supabase.from('live_sessions').delete().eq('attempt_id', retakeGranted.id)
        ]);

        const { data: updatedAttempt, error: updateErr } = await supabase
          .from('attempts')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            submitted_at: null,
            score: null,
            percentage: null,
            correct_count: 0,
            wrong_count: 0,
            skipped_count: 0,
            violation_count: 0,
            total_marks
          })
          .eq('id', retakeGranted.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        attempt = updatedAttempt;
      } else {
        const { data: newAttempt, error: attemptError } = await supabase.from('attempts').insert({
          student_id: currentUser.id,
          exam_id: examId,
          total_marks,
          started_at: new Date().toISOString()
        }).select().single();

        if (attemptError) throw attemptError;
        attempt = newAttempt;
      }

      // Log event
      await supabase.from('event_logs').insert({
        user_id: currentUser.id,
        attempt_id: attempt.id,
        event_type: 'exam_started',
        details: { exam_id: examId, exam_title: exam.title }
      });

      return { attempt, resumed: false };
    }

    // SAVE ANSWER
    const attemptAnswerMatch = cleanEndpoint.match(/^\/api\/attempts\/([a-f0-9-]+)\/answer$/i);
    if (attemptAnswerMatch && method === 'POST') {
      const attemptId = attemptAnswerMatch[1];
      const { question_id, selected_option, selected_answer_text } = body;

      const { data: attempt } = await supabase
        .from('attempts')
        .select('student_id, status, started_at, exam_id, exams(duration)')
        .eq('id', attemptId)
        .single();

      if (!attempt) throw new Error('Attempt not found');
      if (attempt.student_id !== currentUser.id) throw new Error('Not your attempt');
      if (attempt.status !== 'in_progress') throw new Error('Attempt is not in progress');

      // Check timer
      if (attempt.exams?.duration) {
        const elapsed = (new Date() - new Date(attempt.started_at)) / 1000;
        if (elapsed > attempt.exams.duration * 60 + 30) {
          await api(`/api/attempts/${attemptId}/submit`, { method: 'POST', params: { auto: 'true' } });
          throw new Error('Timer expired. Exam auto-submitted.');
        }
      }

      const { error } = await supabase.from('answers').upsert({
        attempt_id: attemptId,
        question_id,
        selected_option,
        selected_answer_text
      }, { onConflict: 'attempt_id, question_id' });
      if (error) throw error;

      return { success: true };
    }

    // SUBMIT ATTEMPT
    const attemptSubmitMatch = cleanEndpoint.match(/^\/api\/attempts\/([a-f0-9-]+)\/submit$/i);
    if (attemptSubmitMatch && method === 'POST') {
      const attemptId = attemptSubmitMatch[1];
      const auto = params?.auto === 'true' || new URLSearchParams(endpoint.split('?')[1]).get('auto') === 'true';

      const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attemptId).single();
      if (!attempt) throw new Error('Attempt not found');
      if (currentUser.role !== 'admin' && attempt.student_id !== currentUser.id) {
        throw new Error('Unauthorized attempt access');
      }

      if (attempt.status !== 'in_progress') {
        return { attempt, message: 'Already submitted' };
      }

      // If client passed current answers dictionary, flush & upsert to DB first for 100% accuracy
      if (body && body.answers && typeof body.answers === 'object') {
        const upsertPromises = Object.entries(body.answers).map(([qId, val]) => {
          if (val === undefined || val === null) return Promise.resolve();
          const isMcq = typeof val === 'number';
          return supabase.from('answers').upsert({
            attempt_id: attemptId,
            question_id: qId,
            selected_option: isMcq ? val : null,
            selected_answer_text: isMcq ? null : String(val || '')
          }, { onConflict: 'attempt_id, question_id' });
        });
        await Promise.all(upsertPromises);
      }

      const { data: exam } = await supabase.from('exams').select('*').eq('id', attempt.exam_id).single();
      const neg_marking = exam?.negative_marking || 0.0;

      const [answersRes, questionsRes] = await Promise.all([
        supabase.from('answers').select('question_id, selected_option, selected_answer_text').eq('attempt_id', attemptId),
        supabase.from('questions').select('id, correct_answer, accepted_answers, question_type, marks').eq('exam_id', attempt.exam_id)
      ]);

      const answerMap = {};
      (answersRes.data || []).forEach(a => {
        answerMap[a.question_id] = { opt: a.selected_option, txt: a.selected_answer_text };
      });

      let score = 0.0;
      let correct_count = 0;
      let wrong_count = 0;
      let skipped_count = 0;
      let total_marks = 0;

      const updateAnswersCorrectness = [];

      (questionsRes.data || []).forEach(q => {
        const qMarks = q.marks || 1;
        total_marks += qMarks;
        const q_type = q.question_type || 'mcq';
        const ans = answerMap[q.id];

        let is_correct = false;
        let is_skipped = true;

        if (q_type === 'mcq' || q_type === 'image_mcq') {
          if (ans && ans.opt !== undefined && ans.opt !== null) {
            is_skipped = false;
            is_correct = ans.opt === q.correct_answer;
          }
        } else if (q_type === 'fill_in_blank' || q_type === 'image_fib') {
          if (ans && ans.txt !== undefined && ans.txt !== null && String(ans.txt).trim() !== '') {
            is_skipped = false;
            const student_ans = String(ans.txt).trim().toLowerCase();
            let accepted_list = q.accepted_answers || [];
            if (typeof accepted_list === 'string') {
              try {
                accepted_list = JSON.parse(accepted_list);
              } catch (_) {
                accepted_list = [accepted_list];
              }
            }
            if (!Array.isArray(accepted_list)) {
              accepted_list = [accepted_list];
            }
            is_correct = accepted_list.some(accepted => String(accepted).trim().toLowerCase() === student_ans);
          }
        }

        if (is_skipped) {
          skipped_count += 1;
        } else if (is_correct) {
          correct_count += 1;
          score += qMarks;
        } else {
          wrong_count += 1;
          score -= neg_marking;
        }

        if (ans) {
          updateAnswersCorrectness.push(
            supabase.from('answers').update({ is_correct }).eq('attempt_id', attemptId).eq('question_id', q.id)
          );
        }
      });

      if (updateAnswersCorrectness.length > 0) {
        await Promise.all(updateAnswersCorrectness);
      }

      score = Math.max(0, Math.round(score));
      const percentage = total_marks > 0 ? roundNumber((score / total_marks) * 100, 2) : 0.0;
      const time_taken = attempt.started_at ? Math.max(0, Math.floor((new Date() - new Date(attempt.started_at)) / 1000)) : 0;

      const status = auto ? 'auto_submitted' : 'submitted';
      const { data: updatedAttempt, error: updateErr } = await supabase
        .from('attempts')
        .update({
          score,
          total_marks,
          status,
          is_auto_submitted: auto,
          submitted_at: new Date().toISOString(),
          percentage,
          correct_count,
          wrong_count,
          skipped_count,
          time_taken
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Log event
      await supabase.from('event_logs').insert({
        user_id: attempt.student_id,
        attempt_id: attemptId,
        event_type: auto ? 'auto_submit' : 'exam_submitted',
        details: { score, total: total_marks }
      });

      return { attempt: updatedAttempt, score };
    }

    // GET SINGLE ATTEMPT
    const attemptGetMatch = cleanEndpoint.match(/^\/api\/attempts\/([a-f0-9-]+)$/i);
    if (attemptGetMatch && method === 'GET') {
      const attemptId = attemptGetMatch[1];
      const { data: att, error } = await supabase.from('attempts').select('*, exams(*)').eq('id', attemptId).single();
      if (error) throw error;

      if (att && att.exam_id) {
        const { data: questions } = await supabase.from('questions').select('marks').eq('exam_id', att.exam_id);
        const examTotal = (questions || []).reduce((sum, q) => sum + (q.marks || 1), 0);
        const dynamicTotalMarks = Math.max(att.total_marks || 0, att.score || 0, examTotal);
        att.total_marks = dynamicTotalMarks;
      }

      return { attempt: att };
    }

    // GET ATTEMPT RESULT
    const attemptResultMatch = cleanEndpoint.match(/^\/api\/attempts\/([a-f0-9-]+)\/result$/i);
    if (attemptResultMatch && method === 'GET') {
      const attemptId = attemptResultMatch[1];
      const { data: attempt, error: attError } = await supabase
        .from('attempts')
        .select('id, student_id, exam_id, score, total_marks, status, violation_count, started_at, created_at, percentage, correct_count, wrong_count, skipped_count, time_taken, exams(title, duration)')
        .eq('id', attemptId)
        .single();

      if (attError) throw attError;
      if (currentUser.role !== 'admin' && attempt.student_id !== currentUser.id) {
        throw new Error('Unauthorized attempt access');
      }

      const [answersRes, questionsRes] = await Promise.all([
        supabase.from('answers').select('id, attempt_id, question_id, selected_option, selected_answer_text, is_correct, created_at, questions(question_text, options, correct_answer, accepted_answers, question_type, image_url, marks)').eq('attempt_id', attemptId),
        supabase.from('questions').select('id, marks').eq('exam_id', attempt.exam_id)
      ]);

      const examTotal = (questionsRes.data || []).reduce((sum, q) => sum + (q.marks || 1), 0);
      const dynamicTotalMarks = Math.max(attempt.total_marks || 0, attempt.score || 0, examTotal);
      const dynamicPercentage = dynamicTotalMarks > 0 ? Math.round(((attempt.score || 0) / dynamicTotalMarks) * 100) : (attempt.percentage || 0);

      const updatedAttempt = {
        ...attempt,
        total_marks: dynamicTotalMarks,
        percentage: dynamicPercentage
      };

      return { attempt: updatedAttempt, answers: answersRes.data || [] };
    }

    // MY ATTEMPTS
    if (cleanEndpoint === '/api/my-attempts' && method === 'GET') {
      const { data: attemptsData, error } = await supabase
        .from('attempts')
        .select('*, exams(title)')
        .eq('student_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const examIds = Array.from(new Set((attemptsData || []).map(a => a.exam_id).filter(Boolean)));
      const examMarksMap = {};
      if (examIds.length > 0) {
        const { data: questions } = await supabase.from('questions').select('exam_id, marks').in('exam_id', examIds);
        (questions || []).forEach(q => {
          examMarksMap[q.exam_id] = (examMarksMap[q.exam_id] || 0) + (q.marks || 1);
        });
      }

      const results = (attemptsData || []).map(a => {
        const examTotal = examMarksMap[a.exam_id] || a.total_marks || 1;
        const dynamicTotalMarks = Math.max(a.total_marks || 0, a.score || 0, examTotal);
        const dynamicPercentage = dynamicTotalMarks > 0 ? Math.round(((a.score || 0) / dynamicTotalMarks) * 100) : (a.percentage || 0);

        return {
          ...a,
          total_marks: dynamicTotalMarks,
          percentage: dynamicPercentage
        };
      });

      return { attempts: results };
    }

    // LOG EVENT
    if (cleanEndpoint === '/api/events/log' && method === 'POST') {
      const { attempt_id, event_type, details } = body;
      const { data, error } = await supabase.from('event_logs').insert({
        user_id: currentUser.id,
        attempt_id,
        event_type,
        details
      }).select().single();
      if (error) throw error;
      return data;
    }

    // LOG VIOLATION
    if (cleanEndpoint === '/api/violations' && method === 'POST') {
      const { attempt_id, violation_type, browser, os, ip_address, device } = body;
      const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attempt_id).single();
      if (!attempt) throw new Error('Attempt not found');
      if (attempt.student_id !== currentUser.id) throw new Error('Unauthorized attempt access');

      if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
        return {
          success: true,
          violation_count: attempt.violation_count || 0,
          kicked: false,
          reason: 'Exam already successfully submitted.'
        };
      }
      if (attempt.status === 'terminated') {
        return {
          success: false,
          violation_count: attempt.violation_count || 0,
          kicked: true,
          reason: 'Exam session is terminated.'
        };
      }

      const { data: exam } = await supabase.from('exams').select('*').eq('id', attempt.exam_id).single();
      const max_violations = exam?.max_violations || 3;

      // Insert violation
      await supabase.from('violations').insert({
        attempt_id,
        student_id: currentUser.id,
        violation_type,
        browser,
        os,
        ip_address,
        device
      });

      const new_violations_count = (attempt.violation_count || 0) + 1;
      await supabase.from('attempts').update({ violation_count: new_violations_count }).eq('id', attempt_id);

      const warning_msg = `⚠️ ${currentUser.name} triggered warning: ${violation_type.replace(/_/g, ' ')} (Strike ${new_violations_count}/${max_violations})`;
      
      await Promise.all([
        supabase.from('activity_logs').insert({
          user_id: currentUser.id,
          attempt_id,
          activity_type: 'violation_warning',
          message: warning_msg
        }),
        supabase.from('notifications').insert({
          recipient_role: 'admin',
          type: 'violation_warning',
          message: warning_msg
        })
      ]);

      let kicked = false;
      let reason_str = '';

      if (new_violations_count >= max_violations) {
        kicked = true;
        reason_str = `Exceeded maximum violation limits (${max_violations} strikes. Triggered by ${violation_type.replace(/_/g, ' ')})`;

        await Promise.all([
          supabase.from('attempts').update({
            status: 'terminated',
            submitted_at: new Date().toISOString()
          }).eq('id', attempt_id),
          supabase.from('kick_logs').insert({
            attempt_id,
            student_id: currentUser.id,
            exam_id: attempt.exam_id,
            reason: reason_str,
            violation_count: new_violations_count,
            browser,
            os,
            ip_address,
            device,
            final_score: attempt.score || 0,
            duration_completed: 0
          }),
          supabase.from('activity_logs').insert({
            user_id: currentUser.id,
            attempt_id,
            activity_type: 'student_kicked',
            message: `🚫 ${currentUser.name} was auto-kicked: ${reason_str}`
          }),
          supabase.from('notifications').insert({
            recipient_role: 'admin',
            type: 'student_kicked',
            message: `🚫 ${currentUser.name} was auto-kicked: ${reason_str}`
          }),
          supabase.from('live_sessions').delete().eq('attempt_id', attempt_id)
        ]);
      }

      return {
        success: true,
        violation_count: new_violations_count,
        kicked,
        reason: reason_str
      };
    }

    // LIVE MONITOR
    if (cleanEndpoint === '/api/monitor/live' && method === 'GET') {
      const { data, error } = await supabase
        .from('attempts')
        .select('*, profiles(name, email), exams(title, duration)')
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return { active_attempts: data || [] };
    }

    // MONITOR EVENTS
    if (cleanEndpoint === '/api/monitor/events' && method === 'GET') {
      const limit = params?.limit || 50;
      const { data, error } = await supabase
        .from('event_logs')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return { events: data || [] };
    }

    // MONITOR STATS (Direct Supabase exact counts with RPC fallback)
    if (cleanEndpoint === '/api/monitor/stats' && method === 'GET') {
      try {
        const [
          studentsRes,
          examsRes,
          activeRes,
          completedRes,
          violationsTableRes,
          eventLogsRes,
          attemptsViolationSumRes
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('exams').select('id', { count: 'exact', head: true }),
          supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
          supabase.from('attempts').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'auto_submitted', 'completed']),
          supabase.from('violations').select('id', { count: 'exact', head: true }),
          supabase.from('event_logs').select('id', { count: 'exact', head: true }),
          supabase.from('attempts').select('violation_count')
        ]);

        const total_students = studentsRes.count !== null && studentsRes.count !== undefined ? studentsRes.count : 0;
        const total_exams = examsRes.count !== null && examsRes.count !== undefined ? examsRes.count : 0;
        const active_attempts = activeRes.count !== null && activeRes.count !== undefined ? activeRes.count : 0;
        const completed_attempts = completedRes.count !== null && completedRes.count !== undefined ? completedRes.count : 0;

        let total_violations = (violationsTableRes.count || 0) + (eventLogsRes.count || 0);
        if (attemptsViolationSumRes.data && attemptsViolationSumRes.data.length > 0) {
          const attemptsSum = attemptsViolationSumRes.data.reduce((sum, a) => sum + (a.violation_count || 0), 0);
          total_violations = Math.max(total_violations, attemptsSum);
        }

        return {
          total_students,
          total_exams,
          active_attempts,
          completed_attempts,
          total_violations
        };
      } catch (err) {
        const { data } = await supabase.rpc('get_dashboard_stats');
        return data || {
          total_students: 0,
          total_exams: 0,
          active_attempts: 0,
          completed_attempts: 0,
          total_violations: 0
        };
      }
    }

    // ALL RESULTS
    if (cleanEndpoint === '/api/results' && method === 'GET') {
      const exam_id = params?.exam_id || new URLSearchParams(endpoint.split('?')[1]).get('exam_id');
      let query = supabase
        .from('attempts')
        .select('*, profiles(name, email), exams(title)')
        .in('status', ['submitted', 'auto_submitted'])
        .order('submitted_at', { ascending: false });
      if (exam_id) {
        query = query.eq('exam_id', exam_id);
      }
      const { data: attemptsData, error } = await query;
      if (error) throw error;

      const examIds = Array.from(new Set((attemptsData || []).map(a => a.exam_id).filter(Boolean)));
      const examMarksMap = {};
      if (examIds.length > 0) {
        const { data: questions } = await supabase.from('questions').select('exam_id, marks').in('exam_id', examIds);
        (questions || []).forEach(q => {
          examMarksMap[q.exam_id] = (examMarksMap[q.exam_id] || 0) + (q.marks || 1);
        });
      }

      const results = (attemptsData || []).map(a => {
        const examTotal = examMarksMap[a.exam_id] || a.total_marks || 1;
        const dynamicTotalMarks = Math.max(a.total_marks || 0, a.score || 0, examTotal);
        const dynamicPercentage = dynamicTotalMarks > 0 ? Math.round(((a.score || 0) / dynamicTotalMarks) * 100) : (a.percentage || 0);

        return {
          ...a,
          total_marks: dynamicTotalMarks,
          percentage: dynamicPercentage
        };
      });

      return { results };
    }

    // ACTIVITY FEED
    if (cleanEndpoint === '/api/activity-feed' && method === 'GET') {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { events: data || [] };
    }

    // KICK HISTORY
    if (cleanEndpoint === '/api/kick-history' && method === 'GET') {
      try {
        const [attemptsRes, profilesRes, examsRes, violationsRes, kickLogsRes] = await Promise.all([
          supabase.from('attempts').select('*').order('started_at', { ascending: false }),
          supabase.from('profiles').select('id, name, email'),
          supabase.from('exams').select('id, title'),
          supabase.from('violations').select('*').order('created_at', { ascending: true }),
          supabase.from('kick_logs').select('*').order('created_at', { ascending: false })
        ]);

        const attempts = attemptsRes.data || [];
        const profiles = profilesRes.data || [];
        const exams = examsRes.data || [];
        const violations = violationsRes.data || [];
        const kickLogs = kickLogsRes.data || [];

        const profilesMap = {};
        profiles.forEach(p => { profilesMap[p.id] = p; });

        const examsMap = {};
        exams.forEach(e => { examsMap[e.id] = e; });

        const violationsByAttempt = {};
        violations.forEach(v => {
          if (!violationsByAttempt[v.attempt_id]) violationsByAttempt[v.attempt_id] = [];
          violationsByAttempt[v.attempt_id].push(v);
        });

        const kickLogByAttempt = {};
        kickLogs.forEach(k => { kickLogByAttempt[k.attempt_id] = k; });

        const combinedItems = [];
        const processedAttemptIds = new Set();

        // 1. Process attempts with status === 'terminated' OR violation_count > 0 OR recorded violations OR kick_logs
        attempts.forEach(att => {
          const attViolations = violationsByAttempt[att.id] || [];
          const kickLogEntry = kickLogByAttempt[att.id];
          const isTerminated = att.status === 'terminated';
          const hasViolations = (att.violation_count || 0) > 0 || attViolations.length > 0;

          if (isTerminated || hasViolations || kickLogEntry) {
            processedAttemptIds.add(att.id);

            const profile = profilesMap[att.student_id];
            const exam = examsMap[att.exam_id];
            const totalStrikes = Math.max(att.violation_count || 0, attViolations.length, kickLogEntry?.violation_count || 0);
            const lastV = attViolations[attViolations.length - 1];

            let kickReason = kickLogEntry?.reason || '';
            if (!kickReason) {
              if (isTerminated) {
                kickReason = 'Terminated due to rule violations (3 Strikes)';
              } else if (attViolations.length > 0) {
                const types = attViolations.map(v => (v.violation_type || '').replace(/_/g, ' ')).join(', ');
                kickReason = `Security triggers logged: ${types}`;
              } else {
                kickReason = `Security warnings logged (${totalStrikes} violations)`;
              }
            }

            combinedItems.push({
              id: kickLogEntry?.id || att.id,
              attempt_id: att.id,
              student_id: att.student_id,
              exam_id: att.exam_id,
              student_name: profile?.name || 'Student',
              email: profile?.email || '',
              exam_title: exam?.title || 'Exam',
              reason: kickReason,
              violation_count: totalStrikes,
              browser: kickLogEntry?.browser || lastV?.browser || 'Chrome',
              os: kickLogEntry?.os || lastV?.os || 'Windows',
              ip_address: kickLogEntry?.ip_address || lastV?.ip_address || '127.0.0.1',
              created_at: kickLogEntry?.created_at || att.submitted_at || att.started_at || new Date().toISOString(),
              violations: attViolations
            });
          }
        });

        // 2. Include standalone kick_logs whose attempt IDs were not in attempts table
        kickLogs.forEach(k => {
          if (!processedAttemptIds.has(k.attempt_id)) {
            processedAttemptIds.add(k.attempt_id);
            const profile = profilesMap[k.student_id];
            const exam = examsMap[k.exam_id];
            const attViolations = violationsByAttempt[k.attempt_id] || [];

            combinedItems.push({
              id: k.id,
              attempt_id: k.attempt_id,
              student_id: k.student_id,
              exam_id: k.exam_id,
              student_name: profile?.name || 'Student',
              email: profile?.email || '',
              exam_title: exam?.title || 'Exam',
              reason: k.reason || 'Terminated due to rule violations',
              violation_count: k.violation_count || attViolations.length || 0,
              browser: k.browser || 'Chrome',
              os: k.os || 'Windows',
              ip_address: k.ip_address || '127.0.0.1',
              created_at: k.created_at || new Date().toISOString(),
              violations: attViolations
            });
          }
        });

        // Sort by created_at descending
        combinedItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return { kick_logs: combinedItems };
      } catch (err) {
        console.error('Error fetching kick history:', err);
        return { kick_logs: [] };
      }
    }

    // FORCE SUBMIT
    if (cleanEndpoint === '/api/force-submit' && method === 'POST') {
      const { attempt_id } = body;
      const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attempt_id).single();
      if (!attempt) throw new Error('Attempt not found');

      await api(`/api/attempts/${attempt_id}/submit`, {
        method: 'POST',
        params: { auto: 'true' }
      });

      await Promise.all([
        supabase.from('admin_actions').insert({
          admin_id: currentUser.id,
          attempt_id,
          action_type: 'force_submit',
          details: body.details || {}
        }),
        supabase.from('activity_logs').insert({
          user_id: attempt.student_id,
          attempt_id,
          activity_type: 'exam_submitted',
          message: '📤 Exam attempt force-submitted by admin'
        }),
        supabase.from('live_sessions').delete().eq('attempt_id', attempt_id)
      ]);

      return { success: true };
    }

    // TERMINATE EXAM
    if (cleanEndpoint === '/api/terminate-exam' && method === 'POST') {
      const { attempt_id } = body;
      const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attempt_id).single();
      if (!attempt) throw new Error('Attempt not found');

      await api(`/api/attempts/${attempt_id}/submit`, {
        method: 'POST',
        params: { auto: 'true' }
      });

      await Promise.all([
        supabase.from('kick_logs').insert({
          attempt_id,
          student_id: attempt.student_id,
          exam_id: attempt.exam_id,
          reason: body.details?.reason || 'Terminated by Administrator',
          violation_count: attempt.violation_count || 0,
          final_score: 0
        }),
        supabase.from('admin_actions').insert({
          admin_id: currentUser.id,
          attempt_id,
          action_type: 'terminate',
          details: body.details || {}
        }),
        supabase.from('activity_logs').insert({
          user_id: attempt.student_id,
          attempt_id,
          activity_type: 'student_kicked',
          message: '🚫 Student session terminated by admin'
        }),
        supabase.from('live_sessions').delete().eq('attempt_id', attempt_id)
      ]);

      return { success: true };
    }

    // PAUSE EXAM
    if (cleanEndpoint === '/api/pause-exam' && method === 'POST') {
      const { attempt_id } = body;
      await Promise.all([
        supabase.from('live_sessions').update({ is_paused: true }).eq('attempt_id', attempt_id),
        supabase.from('admin_actions').insert({
          admin_id: currentUser.id,
          attempt_id,
          action_type: 'pause',
          details: body.details || {}
        })
      ]);
      return { success: true };
    }

    // RESUME EXAM
    if (cleanEndpoint === '/api/resume-exam' && method === 'POST') {
      const { attempt_id } = body;
      await Promise.all([
        supabase.from('live_sessions').update({ is_paused: false }).eq('attempt_id', attempt_id),
        supabase.from('admin_actions').insert({
          admin_id: currentUser.id,
          attempt_id,
          action_type: 'resume',
          details: body.details || {}
        })
      ]);
      return { success: true };
    }

    // REINSTATE ATTEMPT
    const reinstateMatch = cleanEndpoint.match(/^\/api\/admin\/attempts\/([a-f0-9-]+)\/reinstate$/i);
    if (reinstateMatch && method === 'POST') {
      const attemptId = reinstateMatch[1];
      const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attemptId).single();
      if (!attempt) throw new Error('Attempt not found');

      const { data: exam } = await supabase.from('exams').select('*').eq('id', attempt.exam_id).single();
      const max_violations = exam?.max_violations || 3;
      const duration = exam?.duration || 30;

      const current_violations = attempt.violation_count || 0;
      const new_violations = Math.min(current_violations, max_violations - 1);

      await supabase.from('attempts').update({
        status: 'in_progress',
        violation_count: new_violations,
        submitted_at: null,
        started_at: new Date().toISOString()
      }).eq('id', attemptId);

      const [profileRes] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', attempt.student_id).single(),
        supabase.from('kick_logs').delete().eq('attempt_id', attemptId),
        supabase.from('admin_actions').insert({
          admin_id: currentUser.id,
          attempt_id: attemptId,
          action_type: 'reinstate',
          details: { message: 'Admin reinstatement override applied.' }
        }),
        supabase.from('live_sessions').insert({
          attempt_id: attemptId,
          student_id: attempt.student_id,
          current_question_index: 0,
          answered_count: 0,
          time_remaining: duration * 60,
          browser: 'Chrome',
          os: 'Windows',
          connection_status: 'connected'
        })
      ]);

      const studentName = profileRes.data?.name || 'Student';
      await supabase.from('activity_logs').insert({
        user_id: attempt.student_id,
        attempt_id: attemptId,
        activity_type: 'reinstate',
        message: `🔄 ${studentName}'s exam attempt was reinstated by administrator`
      });

      return { success: true };
    }

    // GRANT RETAKE — admin resets student's attempt to in_progress and deletes prior answers/violations
    if (cleanEndpoint === '/api/admin/grant-retake' && method === 'POST') {
      if (currentUser.role !== 'admin') throw new Error('Only admins can grant retakes');
      const { attempt_id } = body;

      const { data: attempt, error: fetchErr } = await supabase
        .from('attempts').select('*').eq('id', attempt_id).single();
      if (fetchErr || !attempt) throw new Error('Attempt not found');

      // 1. Delete all previous answers, violations, kick_logs, and live_sessions for clean retake
      await Promise.all([
        supabase.from('answers').delete().eq('attempt_id', attempt_id),
        supabase.from('violations').delete().eq('attempt_id', attempt_id),
        supabase.from('kick_logs').delete().eq('attempt_id', attempt_id),
        supabase.from('live_sessions').delete().eq('attempt_id', attempt_id)
      ]);

      // 2. Reset attempt status to 'in_progress', clear score, time_taken and started_at so timer resets completely
      const { error: updateErr } = await supabase
        .from('attempts')
        .update({
          status: 'in_progress',
          submitted_at: null,
          started_at: null,
          time_taken: 0,
          score: null,
          percentage: null,
          correct_count: 0,
          wrong_count: 0,
          skipped_count: 0,
          violation_count: 0
        })
        .eq('id', attempt_id);

      if (updateErr) throw new Error('Failed to grant retake: ' + updateErr.message);

      // Log the admin action
      await supabase.from('admin_actions').insert({
        admin_id: currentUser.id,
        attempt_id,
        action_type: 'grant_retake',
        details: { student_id: attempt.student_id, exam_id: attempt.exam_id }
      });

      await supabase.from('activity_logs').insert({
        user_id: attempt.student_id,
        attempt_id,
        activity_type: 'retake_granted',
        message: `🔄 Admin granted retake permission for exam`
      });

      return { success: true };
    }

    // ANALYTICS — accurate real-time data calculations from database
    if (cleanEndpoint === '/api/analytics' && method === 'GET') {
      const exam_id = params?.exam_id || new URLSearchParams(endpoint.split('?')[1]).get('exam_id');

      let attemptsQuery = supabase.from('attempts').select('id, status, score, total_marks, percentage, student_id, exam_id, created_at, exams(pass_threshold)');
      let violationsQuery = supabase.from('violations').select('id, attempt_id, created_at');
      let kicksQuery = supabase.from('kick_logs').select('id, attempt_id, created_at');
      let questionsQuery = supabase.from('questions').select('id, question_text, exam_id');

      if (exam_id) {
        attemptsQuery = attemptsQuery.eq('exam_id', exam_id);
        questionsQuery = questionsQuery.eq('exam_id', exam_id);
      }

      const [attemptsRes, violationsRes, kicksRes, profilesRes, answersRes, questionsRes] = await Promise.all([
        attemptsQuery,
        violationsQuery,
        kicksQuery,
        supabase.from('profiles').select('id, email, department'),
        supabase.from('answers').select('question_id, is_correct, attempt_id'),
        questionsQuery
      ]);

      const attempts = attemptsRes.data || [];
      const violations = violationsRes.data || [];
      const kicks = kicksRes.data || [];
      const profiles = profilesRes.data || [];
      const answers = answersRes.data || [];
      const all_qs = questionsRes.data || [];

      // Create lookup map for profiles
      const profileMap = {};
      profiles.forEach(p => { profileMap[p.id] = p; });

      // If exam_id filter is active, filter answers/violations/kicks by attempt IDs
      let validAttemptIds = new Set(attempts.map(a => a.id));
      const filteredViolations = exam_id ? violations.filter(v => validAttemptIds.has(v.attempt_id)) : violations;
      const filteredKicks = exam_id ? kicks.filter(k => validAttemptIds.has(k.attempt_id)) : kicks;
      const filteredAnswers = exam_id ? answers.filter(ans => validAttemptIds.has(ans.attempt_id)) : answers;

      // Online count
      const online_count = attempts.filter(a => a.status === 'in_progress').length;

      // Completed attempts calculations
      const completedAttempts = attempts.filter(a => ['submitted', 'auto_submitted'].includes(a.status));
      
      let totalPercentageSum = 0;
      let passCount = 0;
      let failCount = 0;

      const dept_stats = {};

      completedAttempts.forEach(a => {
        const passThreshold = a.exams?.pass_threshold || 50;
        let pct = a.percentage;
        if (pct === null || pct === undefined) {
          pct = a.total_marks > 0 ? (a.score / a.total_marks) * 100 : 0;
        }
        pct = Math.round(pct);
        totalPercentageSum += pct;

        if (pct >= passThreshold) {
          passCount++;
        } else {
          failCount++;
        }

        // Department breakdown
        const student = profileMap[a.student_id] || {};
        let dept = student.department;
        if (!dept) {
          const email = (student.email || '').toLowerCase();
          if (email.includes('ece')) dept = 'ECE';
          else if (email.includes('it')) dept = 'IT';
          else if (email.includes('mech')) dept = 'MECH';
          else dept = 'CSE';
        }

        if (!dept_stats[dept]) {
          dept_stats[dept] = { total: 0, passed: 0, pctSum: 0 };
        }
        dept_stats[dept].total += 1;
        dept_stats[dept].pctSum += pct;
        if (pct >= passThreshold) {
          dept_stats[dept].passed += 1;
        }
      });

      const totalCompleted = completedAttempts.length;
      const avg_score = totalCompleted > 0 ? Math.round(totalPercentageSum / totalCompleted) : 0;
      const overall_pass_rate = totalCompleted > 0 ? Math.round((passCount / totalCompleted) * 100) : 0;
      const overall_fail_rate = totalCompleted > 0 ? Math.round((failCount / totalCompleted) * 100) : 0;

      const pass_fail_distribution = [
        { name: 'Pass', value: passCount, percentage: overall_pass_rate },
        { name: 'Fail', value: failCount, percentage: overall_fail_rate }
      ];

      // Format department performance
      const dept_performance = Object.keys(dept_stats).length > 0
        ? Object.entries(dept_stats).map(([dept, s]) => ({
            department: dept,
            average_score: Math.round(s.pctSum / s.total),
            pass_rate: Math.round((s.passed / s.total) * 100),
            total_students: s.total
          }))
        : [
            { department: 'CSE', average_score: 0, pass_rate: 0, total_students: 0 },
            { department: 'ECE', average_score: 0, pass_rate: 0, total_students: 0 },
            { department: 'IT', average_score: 0, pass_rate: 0, total_students: 0 }
          ];

      // Violation Hourly Trend
      const hourly_warnings = {};
      const hourly_kicks = {};

      filteredViolations.forEach(v => {
        try {
          const hour = new Date(v.created_at).getHours();
          const hour_str = `${String(hour).padStart(2, '0')}:00`;
          hourly_warnings[hour_str] = (hourly_warnings[hour_str] || 0) + 1;
        } catch (_) {}
      });

      filteredKicks.forEach(k => {
        try {
          const hour = new Date(k.created_at).getHours();
          const hour_str = `${String(hour).padStart(2, '0')}:00`;
          hourly_kicks[hour_str] = (hourly_kicks[hour_str] || 0) + 1;
        } catch (_) {}
      });

      const all_hours = Array.from(new Set([...Object.keys(hourly_warnings), ...Object.keys(hourly_kicks)])).sort();
      const final_hours = all_hours.length ? all_hours : ['09:00', '10:00', '11:00', '12:00'];
      const violation_trend = final_hours.map(h => ({
        hour: h,
        warnings: hourly_warnings[h] || 0,
        kicks: hourly_kicks[h] || 0
      }));

      // Question Difficulty Analysis
      const q_correct = {};
      const q_total = {};

      filteredAnswers.forEach(ans => {
        const q_id = ans.question_id;
        q_total[q_id] = (q_total[q_id] || 0) + 1;
        if (ans.is_correct) {
          q_correct[q_id] = (q_correct[q_id] || 0) + 1;
        }
      });

      const questions_analysis = all_qs.slice(0, 10).map(q => {
        const total = q_total[q.id] || 0;
        const correct = q_correct[q.id] || 0;
        const rate = total ? Math.round((correct / total) * 100) : 0;
        return {
          question_id: q.id,
          question_text: q.question_text.length > 30 ? q.question_text.slice(0, 30) + '...' : q.question_text,
          correct_rate: rate,
          total_responses: total
        };
      });

      return {
        stats: {
          live_online: online_count,
          warnings_today: filteredViolations.length,
          kicks_today: filteredKicks.length,
          average_score: avg_score,
          total_completed: totalCompleted,
          pass_rate: overall_pass_rate,
          fail_rate: overall_fail_rate,
          pass_count: passCount,
          fail_count: failCount
        },
        pass_fail_distribution,
        dept_performance,
        violation_trend,
        questions_analysis
      };
    }

    // LIVE STUDENTS (Admin monitoring feed)
    if (cleanEndpoint === '/api/live-students' && method === 'GET') {
      const [sessionsRes, attemptsRes] = await Promise.all([
        supabase.from('live_sessions').select('*'),
        supabase.from('attempts').select('id, student_id, exam_id, status, violation_count, started_at, profiles(name, email), exams(title)').in('status', ['in_progress', 'terminated'])
      ]);

      const sessions = sessionsRes.data || [];
      const sessionMap = {};
      sessions.forEach(s => { sessionMap[s.attempt_id] = s; });

      const attemptsData = attemptsRes.data || [];
      const examIds = Array.from(new Set(attemptsData.map(att => att.exam_id).filter(Boolean)));

      let qCounts = {};
      if (examIds.length) {
        const { data: questions } = await supabase.from('questions').select('exam_id, id').in('exam_id', examIds);
        (questions || []).forEach(q => {
          qCounts[q.exam_id] = (qCounts[q.exam_id] || 0) + 1;
        });
      }

      const terminatedAttemptIds = attemptsData.filter(att => att.status === 'terminated').map(att => att.id);
      let kickReasons = {};
      if (terminatedAttemptIds.length) {
        const { data: kicks } = await supabase.from('kick_logs').select('attempt_id, reason').in('attempt_id', terminatedAttemptIds);
        (kicks || []).forEach(k => {
          kickReasons[k.attempt_id] = k.reason;
        });
      }

      const results = attemptsData.map(att => {
        const s = sessionMap[att.id];
        const q_count = qCounts[att.exam_id] || 1;
        const kick_reason = att.status === 'terminated' ? (kickReasons[att.id] || 'Terminated due to rule violations.') : '';

        return {
          id: s?.id || `temp-${att.id}`,
          attempt_id: att.id,
          student_id: att.student_id,
          student_name: att.profiles?.name || 'Student',
          student_email: att.profiles?.email || '',
          exam_name: att.exams?.title || 'Exam',
          current_question: s ? s.current_question_index + 1 : 1,
          answered_questions: s ? s.answered_count : 0,
          total_questions: q_count,
          remaining_time: s ? s.time_remaining : 0,
          progress_percent: s ? Math.round((s.answered_count / q_count) * 100) : 0,
          violation_count: att.violation_count || 0,
          status: att.status,
          browser: s?.browser || '',
          os: s?.os || '',
          ip_address: s?.ip_address || '',
          login_time: att.started_at,
          connection_status: s ? s.connection_status : 'disconnected',
          is_paused: s ? s.is_paused : false,
          kick_reason
        };
      });

      return { live_students: results };
    }

    // LIVE SESSION HEARTBEAT
    if (cleanEndpoint === '/api/session/heartbeat' && method === 'POST') {
      const { attempt_id, current_question_index, answered_count, time_remaining, browser, os, ip_address } = body;
      
      const { data, error } = await supabase.from('live_sessions').upsert({
        attempt_id,
        student_id: currentUser.id,
        current_question_index,
        answered_count,
        time_remaining,
        browser,
        os,
        ip_address,
        last_heartbeat: new Date().toISOString()
      }, { onConflict: 'attempt_id' }).select().single();

      if (error) throw error;
      return { success: true, live_session: data };
    }

    // EXAM WARNING ISSUANCE
    if (cleanEndpoint === '/api/warning' && method === 'POST') {
      const { attempt_id, message } = body;
      const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attempt_id).single();
      if (!attempt) throw new Error('Attempt not found');

      await Promise.all([
        supabase.from('activity_logs').insert({
          user_id: attempt.student_id,
          attempt_id,
          activity_type: 'violation_warning',
          message: `⚠️ Admin Warning: ${message}`
        }),
        supabase.from('notifications').insert({
          recipient_role: 'student',
          type: 'violation_warning',
          message
        })
      ]);
      return { success: true };
    }

    // EXAM KICK ISSUANCE
    if (cleanEndpoint === '/api/kick' && method === 'POST') {
      const { attempt_id, student_id, exam_id, reason } = body;
      
      await supabase.from('kick_logs').insert(body);
      await api(`/api/attempts/${attempt_id}/submit`, {
        method: 'POST',
        params: { auto: 'true' }
      });

      await Promise.all([
        supabase.from('activity_logs').insert({
          user_id: student_id,
          attempt_id,
          activity_type: 'student_kicked',
          message: `🚫 Student kicked: ${reason}`
        }),
        supabase.from('live_sessions').delete().eq('attempt_id', attempt_id)
      ]);

      return { success: true };
    }

    // Default fallback
    throw new Error(`Route mock not implemented for ${cleanEndpoint} [${method}]`);

  } catch (err) {
    if (err.status === 401 || err.message?.includes('JWT')) {
      localStorage.removeItem('soems_session');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired — please log in again');
    }
    throw new Error(err.message || 'API request failed');
  }
}

function roundNumber(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export default api;
