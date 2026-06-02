import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** La fonctionnalité de statistiques globales est-elle configurée ? */
export const STATS_ENABLED = Boolean(URL && ANON_KEY);

let cached: SupabaseClient | null = null;

function client(): SupabaseClient | null {
  if (!STATS_ENABLED) return null;
  if (!cached) {
    cached = createClient(URL as string, ANON_KEY as string, {
      // Aucune session : on reste 100 % anonyme, pas de stockage local Supabase.
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export interface QuestionStat {
  question_id: number;
  attempts: number;
  wrong: number;
}

/**
 * Enregistre (de façon anonyme et best-effort) le résultat des questions d'un
 * quiz terminé. N'échoue jamais bruyamment : si Supabase est absent ou en
 * erreur, on ignore silencieusement.
 */
export async function recordAnswers(
  answers: { id: number; wrong: boolean }[],
): Promise<void> {
  const c = client();
  if (!c || answers.length === 0) return;
  try {
    await c.rpc("record_answers", {
      p_answers: answers.map((a) => ({ id: a.id, wrong: a.wrong })),
    });
  } catch {
    /* best-effort : on n'interrompt pas l'expérience pour des stats */
  }
}

/** Récupère les compteurs agrégés, indexés par identifiant de question. */
export async function fetchQuestionStats(): Promise<Map<number, QuestionStat>> {
  const c = client();
  if (!c) return new Map();
  try {
    const { data, error } = await c
      .from("question_stats")
      .select("question_id, attempts, wrong");
    if (error || !data) return new Map();
    return new Map(
      (data as QuestionStat[]).map((r) => [r.question_id, r]),
    );
  } catch {
    return new Map();
  }
}

/** Taux d'échec (0–100) d'une question, ou null si non significatif. */
export function failRate(stat: QuestionStat | undefined, minAttempts = 1): number | null {
  if (!stat || stat.attempts < minAttempts) return null;
  return Math.round((stat.wrong / stat.attempts) * 100);
}
