import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { PublicQuestion, Question } from '@/lib/types';

// Serves questions to the browser with the answer key and AI hint stripped
// out, so a user can't read them from the network tab before submitting.
// See app/api/submit/route.ts for where scoring actually happens.
//
// Supabase/PostgREST caps a single request at 1000 rows by default, so with
// more than 1000 rows in the table a plain select would silently drop
// everything past that cutoff (e.g. newer cycles inserted at higher ids).
// Page through the table in batches until a short page tells us we're done.
const PAGE_SIZE = 1000;

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const allRows: Question[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const page = (data ?? []) as Question[];
    allRows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  const publicQuestions: PublicQuestion[] = allRows.map((q) => {
    const { correct_option, ai_hint, ...rest } = q;
    void correct_option;
    void ai_hint;
    return rest;
  });

  return NextResponse.json({ questions: publicQuestions });
}
