import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { scoreSubmission } from '@/lib/scoring';
import type { Question, SubmitResult } from '@/lib/types';

type SubmitBody = {
  questionIds: number[];
  answers: Record<number, number>;
  testMode: string;
  paperId: string;
  timeTakenSeconds: number;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { questionIds, answers, testMode, paperId, timeTakenSeconds } = body;
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: 'No questions submitted.' }, { status: 400 });
  }

  // Re-fetch the real rows server-side — the client never had the answer
  // key, so scoring has to happen here, not in the browser.
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Could not load questions.' }, { status: 500 });
  }

  const questions = data as Question[];
  const { correctCount, totalQuestions, scorePercentage, unitBreakdown } = scoreSubmission(
    questions,
    answers || {}
  );

  let saved = false;
  if (user) {
    const studentName = (user.user_metadata?.full_name as string | undefined) || 'Student';
    const { error: insertError } = await supabase.from('test_submissions').insert({
      user_id: user.id,
      user_email: user.email,
      student_name: studentName,
      paper_id: paperId,
      test_mode: testMode,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      score_percentage: scorePercentage,
      time_taken_seconds: timeTakenSeconds,
      unit_breakdown: unitBreakdown,
    });
    if (insertError) {
      console.error('Failed to save test submission:', insertError.message);
    } else {
      saved = true;
    }
  }

  const answerKey: SubmitResult['answerKey'] = {};
  for (const q of questions) {
    answerKey[q.id] = { correctOption: q.correct_option, aiHint: q.ai_hint };
  }

  const result: SubmitResult = {
    correctCount,
    totalQuestions,
    scorePercentage,
    unitBreakdown,
    answerKey,
    saved,
    loggedIn: Boolean(user),
  };

  return NextResponse.json(result);
}
