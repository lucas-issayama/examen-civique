"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  QUESTIONS,
  THEMES,
  THEME_BY_SLUG,
  type ListCode,
  type ThemeSlug,
} from "@/lib/questions";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUESTIONS.filter((item) => {
      if (theme !== "all" && item.themeSlug !== theme) return false;
      if (list !== "all" && !item.lists.includes(list)) return false;
      if (q && !item.q.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [theme, list, query]);

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
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
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
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
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
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
