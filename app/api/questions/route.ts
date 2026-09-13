import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { PublicQuestion, Question } from '@/lib/types';

// Serves questions to the browser with the answer key and AI hint stripped
// out, so a user can't read them from the network tab before submitting.
// See app/api/submit/route.ts for where scoring actually happens.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicQuestions: PublicQuestion[] = (data as Question[]).map((q) => {
    const { correct_option, ai_hint, ...rest } = q;
    void correct_option;
    void ai_hint;
    return rest;
  });

  return NextResponse.json({ questions: publicQuestions });
}
