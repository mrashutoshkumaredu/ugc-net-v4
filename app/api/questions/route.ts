import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { PublicQuestion, Question } from '@/lib/types';

// Serves questions to the browser with the answer key and AI hint stripped
// out, so a user can't read them from the network tab before submitting.
// See app/api/submit/route.ts for where scoring actually happens.
//
// Supabase/PostgREST caps a single request at 1000 rows by default, so with
// more than 1000 rows in a table a plain select would silently drop
// everything past that cutoff (e.g. newer cycles inserted at higher ids).
// Page through each table in batches until a short page tells us we're done.
const PAGE_SIZE = 1000;

type HindiRow = {
  english_question_ref_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

async function fetchAllRows<T>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  columns: string
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as T[];
    allRows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return allRows;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  let englishRows: Question[];
  let hindiRows: HindiRow[];

  try {
    [englishRows, hindiRows] = await Promise.all([
      fetchAllRows<Question>(supabase, 'questions', '*'),
      fetchAllRows<HindiRow>(
        supabase,
        'questions_hindi',
        'english_question_ref_id, question_text, option_a, option_b, option_c, option_d'
      ),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Hindi text lives in its own table (questions_hindi), one row per
  // English question, linked by english_question_ref_id. Build a lookup so
  // each English row can carry its Hindi translation alongside it — the UI
  // (QuestionPanel's language toggle) expects the two merged onto one object.
  const hindiByEnglishId = new Map<number, HindiRow>();
  for (const row of hindiRows) {
    hindiByEnglishId.set(row.english_question_ref_id, row);
  }

  const publicQuestions: PublicQuestion[] = englishRows.map((q) => {
    const { correct_option, ai_hint, ...rest } = q;
    void correct_option;
    void ai_hint;

    const hi = hindiByEnglishId.get(q.id);

    return {
      ...rest,
      question_text_hi: hi?.question_text ?? rest.question_text_hi ?? null,
      option_a_hi: hi?.option_a ?? rest.option_a_hi ?? null,
      option_b_hi: hi?.option_b ?? rest.option_b_hi ?? null,
      option_c_hi: hi?.option_c ?? rest.option_c_hi ?? null,
      option_d_hi: hi?.option_d ?? rest.option_d_hi ?? null,
    };
  });

  return NextResponse.json({ questions: publicQuestions });
}
