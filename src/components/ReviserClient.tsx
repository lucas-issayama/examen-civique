"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  QUESTIONS,
  THEMES,
  THEME_BY_SLUG,
  type ListCode,
  type ThemeSlug,
} from "@/lib/questions";
import {
  STATS_ENABLED,
  failRate,
  fetchQuestionStats,
  type QuestionStat,
} from "@/lib/stats";

const LISTS: { code: ListCode; label: string }[] = [
  { code: "CSP", label: "Carte de séjour pluriannuelle (CSP)" },
  { code: "CR", label: "Carte de résident (CR)" },
];

export default function ReviserClient() {
  const params = useSearchParams();
  const initialTheme = params.get("theme") as ThemeSlug | null;

  const [theme, setTheme] = useState<ThemeSlug | "all">(
    initialTheme && THEME_BY_SLUG[initialTheme] ? initialTheme : "all",
  );
  const [list, setList] = useState<ListCode | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [byDifficulty, setByDifficulty] = useState(false);
  const [stats, setStats] = useState<Map<number, QuestionStat>>(new Map());

  // Charge les statistiques globales (si Supabase est configuré)
  useEffect(() => {
    if (!STATS_ENABLED) return;
    let active = true;
    fetchQuestionStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);

  const hasStats = stats.size > 0;
  // Seuil de tentatives pour qu'un taux d'échec soit jugé significatif
  const MIN_ATTEMPTS = 5;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = QUESTIONS.filter((item) => {
      if (theme !== "all" && item.themeSlug !== theme) return false;
      if (list !== "all" && !item.lists.includes(list)) return false;
      if (q && !item.q.toLowerCase().includes(q)) return false;
      return true;
    });

    if (byDifficulty && hasStats) {
      const rate = (id: number) => {
        const r = failRate(stats.get(id), MIN_ATTEMPTS);
        // les questions sans assez de données passent en fin de liste
        return r === null ? -1 : r;
      };
      result.sort((a, b) => rate(b.id) - rate(a.id));
    }
    return result;
  }, [theme, list, query, byDifficulty, hasStats, stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Réviser les questions
        </h1>
        <p className="mt-1 text-slate-600">
          {filtered.length} question{filtered.length > 1 ? "s" : ""} affichée
          {filtered.length > 1 ? "s" : ""}. Cliquez pour révéler la réponse.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un mot-clé…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={theme === "all"}
            onClick={() => setTheme("all")}
            label="Toutes les thématiques"
          />
          {THEMES.map((t) => (
            <FilterChip
              key={t.slug}
              active={theme === t.slug}
              onClick={() => setTheme(t.slug)}
              label={`${t.emoji} ${t.short}`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Liste :
          </span>
          <FilterChip
            active={list === "all"}
            onClick={() => setList("all")}
            label="Toutes"
          />
          {LISTS.map((l) => (
            <FilterChip
              key={l.code}
              active={list === l.code}
              onClick={() => setList(l.code)}
              label={l.code}
              title={l.label}
            />
          ))}
        </div>

        {/* Tri par difficulté (statistiques globales anonymes) */}
        {STATS_ENABLED && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Trier :
            </span>
            <FilterChip
              active={!byDifficulty}
              onClick={() => setByDifficulty(false)}
              label="Par défaut"
            />
            <FilterChip
              active={byDifficulty}
              onClick={() => setByDifficulty(true)}
              label="🔥 Les plus difficiles"
              title="Classement par taux d'échec de l'ensemble des utilisateurs"
            />
            {byDifficulty && !hasStats && (
              <span className="text-xs text-slate-400">
                (pas encore assez de données)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aucune question ne correspond à ces filtres.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const t = THEME_BY_SLUG[item.themeSlug];
            const open = openId === item.id;
            const rate = failRate(stats.get(item.id), MIN_ATTEMPTS);
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full touch-manipulation items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 active:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${t.chip}`}
                      >
                        {t.emoji} {t.short}
                      </span>
                      {item.lists.map((l) => (
                        <span
                          key={l}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500"
                        >
                          {l}
                        </span>
                      ))}
                      {rate !== null && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            rate >= 50
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : rate >= 25
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                          title="Taux d'échec global (tous utilisateurs)"
                        >
                          ❌ {rate}% d&apos;échec
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-900">{item.q}</p>
                  </div>
                  <span
                    className={`mt-1 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {open && (
                  <div className="animate-fade-in border-t border-slate-100 px-5 py-4">
                    <ul className="space-y-1.5">
                      {item.options.map((opt, i) => {
                        const correct = i === item.correct;
                        return (
                          <li
                            key={i}
                            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                              correct
                                ? "bg-emerald-50 font-medium text-emerald-800"
                                : "text-slate-600"
                            }`}
                          >
                            <span>{correct ? "✓" : "·"}</span>
                            <span>{opt}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      💡 {item.explanation}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`touch-manipulation rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-95 ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}
