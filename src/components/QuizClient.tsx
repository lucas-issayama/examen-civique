"use client";

import { useMemo, useState } from "react";
import {
  QUESTIONS,
  THEMES,
  THEME_BY_SLUG,
  shuffle,
  type ListCode,
  type Question,
  type ThemeSlug,
} from "@/lib/questions";

type Phase = "setup" | "playing" | "results";

interface QuizItem {
  question: Question;
  /** options reordered for display */
  options: string[];
  /** index (in the shuffled options) of the correct answer */
  correctIdx: number;
  /** index the user picked, or null */
  picked: number | null;
}

const LENGTHS = [10, 20, 30];

export default function QuizClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [theme, setTheme] = useState<ThemeSlug | "all">("all");
  const [list, setList] = useState<ListCode | "all">("all");
  const [length, setLength] = useState(10);

  const [items, setItems] = useState<QuizItem[]>([]);
  const [current, setCurrent] = useState(0);

  const available = useMemo(() => {
    return QUESTIONS.filter((item) => {
      if (theme !== "all" && item.themeSlug !== theme) return false;
      if (list !== "all" && !item.lists.includes(list)) return false;
      return true;
    });
  }, [theme, list]);

  function start() {
    const picked = shuffle(available).slice(0, Math.min(length, available.length));
    const built: QuizItem[] = picked.map((question) => {
      const order = shuffle(question.options.map((_, i) => i));
      return {
        question,
        options: order.map((i) => question.options[i]),
        correctIdx: order.indexOf(question.correct),
        picked: null,
      };
    });
    setItems(built);
    setCurrent(0);
    setPhase("playing");
  }

  function answer(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === current ? { ...it, picked: idx } : it)),
    );
  }

  function next() {
    if (current + 1 < items.length) {
      setCurrent((c) => c + 1);
    } else {
      setPhase("results");
    }
  }

  function restart() {
    setPhase("setup");
    setItems([]);
    setCurrent(0);
  }

  if (phase === "setup") {
    return (
      <Setup
        theme={theme}
        setTheme={setTheme}
        list={list}
        setList={setList}
        length={length}
        setLength={setLength}
        available={available.length}
        onStart={start}
      />
    );
  }

  if (phase === "results") {
    return <Results items={items} onRestart={restart} />;
  }

  return (
    <Playing
      items={items}
      current={current}
      onAnswer={answer}
      onNext={next}
      onQuit={restart}
    />
  );
}

/* ---------------- Setup ---------------- */

function Setup({
  theme,
  setTheme,
  list,
  setList,
  length,
  setLength,
  available,
  onStart,
}: {
  theme: ThemeSlug | "all";
  setTheme: (t: ThemeSlug | "all") => void;
  list: ListCode | "all";
  setList: (l: ListCode | "all") => void;
  length: number;
  setLength: (n: number) => void;
  available: number;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Lancer un quiz</h1>
        <p className="mt-1 text-slate-600">
          Choisissez vos paramètres et entraînez-vous.
        </p>
      </div>

      <Section title="Thématique">
        <div className="flex flex-wrap gap-2">
          <Pill active={theme === "all"} onClick={() => setTheme("all")}>
            Toutes
          </Pill>
          {THEMES.map((t) => (
            <Pill
              key={t.slug}
              active={theme === t.slug}
              onClick={() => setTheme(t.slug)}
            >
              {t.emoji} {t.short}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Liste officielle">
        <div className="flex flex-wrap gap-2">
          <Pill active={list === "all"} onClick={() => setList("all")}>
            Toutes
          </Pill>
          <Pill active={list === "CSP"} onClick={() => setList("CSP")}>
            CSP
          </Pill>
          <Pill active={list === "CR"} onClick={() => setList("CR")}>
            CR
          </Pill>
        </div>
      </Section>

      <Section title="Nombre de questions">
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map((n) => (
            <Pill key={n} active={length === n} onClick={() => setLength(n)}>
              {n}
            </Pill>
          ))}
        </div>
      </Section>

      <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm text-slate-600">
        {available} questions disponibles · le quiz en tirera{" "}
        <strong>{Math.min(length, available)}</strong> au hasard.
      </div>

      <button
        onClick={onStart}
        disabled={available === 0}
        className="w-full rounded-xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Commencer →
      </button>
    </div>
  );
}

/* ---------------- Playing ---------------- */

function Playing({
  items,
  current,
  onAnswer,
  onNext,
  onQuit,
}: {
  items: QuizItem[];
  current: number;
  onAnswer: (idx: number) => void;
  onNext: () => void;
  onQuit: () => void;
}) {
  const item = items[current];
  const t = THEME_BY_SLUG[item.question.themeSlug];
  const answered = item.picked !== null;
  const isCorrect = item.picked === item.correctIdx;
  const score = items.filter((i) => i.picked === i.correctIdx).length;
  const progress = ((current + (answered ? 1 : 0)) / items.length) * 100;
  const isLast = current + 1 === items.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <button onClick={onQuit} className="hover:text-slate-900">
            ← Quitter
          </button>
          <span>
            Question {current + 1} / {items.length}
          </span>
          <span className="font-medium text-slate-700">Score : {score}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        key={current}
        className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${t.chip}`}
        >
          {t.emoji} {t.short}
        </span>
        <h2 className="mt-4 text-xl font-bold leading-snug text-slate-900">
          {item.question.q}
        </h2>

        <div className="mt-5 space-y-2.5">
          {item.options.map((opt, i) => {
            const state = optionState(i, item, answered);
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => onAnswer(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-slate-800 transition ${stateClasses(state)}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${badgeClasses(state)}`}
                >
                  {state === "correct"
                    ? "✓"
                    : state === "wrong"
                      ? "✕"
                      : String.fromCharCode(65 + i)}
                </span>
                <span className="font-medium">{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="animate-fade-in mt-5">
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                isCorrect
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              {isCorrect ? "✓ Bonne réponse !" : "✕ Mauvaise réponse."}{" "}
              <span className="font-normal text-slate-600">
                {item.question.explanation}
              </span>
            </div>
            <button
              onClick={onNext}
              className="mt-4 w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              {isLast ? "Voir mon résultat →" : "Question suivante →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type OptState = "idle" | "correct" | "wrong" | "muted";

function optionState(i: number, item: QuizItem, answered: boolean): OptState {
  if (!answered) return "idle";
  if (i === item.correctIdx) return "correct";
  if (i === item.picked) return "wrong";
  return "muted";
}

function stateClasses(s: OptState): string {
  switch (s) {
    case "idle":
      return "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 cursor-pointer";
    case "correct":
      return "border-emerald-500 bg-emerald-50";
    case "wrong":
      return "border-rose-500 bg-rose-50";
    case "muted":
      return "border-slate-200 bg-white opacity-60";
  }
}

function badgeClasses(s: OptState): string {
  switch (s) {
    case "correct":
      return "border-emerald-500 bg-emerald-500 text-white";
    case "wrong":
      return "border-rose-500 bg-rose-500 text-white";
    default:
      return "border-slate-300 bg-white text-slate-500";
  }
}

/* ---------------- Results ---------------- */

function Results({
  items,
  onRestart,
}: {
  items: QuizItem[];
  onRestart: () => void;
}) {
  const score = items.filter((i) => i.picked === i.correctIdx).length;
  const total = items.length;
  const pct = Math.round((score / total) * 100);
  const { emoji, message } = verdict(pct);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">{emoji}</div>
        <h1 className="mt-3 text-3xl font-extrabold">
          {score} / {total}
        </h1>
        <p className="mt-1 text-lg font-medium text-slate-700">{pct} %</p>
        <p className="mt-2 text-slate-600">{message}</p>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          onClick={onRestart}
          className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          🔁 Nouveau quiz
        </button>
      </div>

      {/* Review */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Récapitulatif</h2>
        <ul className="space-y-3">
          {items.map((it, idx) => {
            const ok = it.picked === it.correctIdx;
            return (
              <li
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-2">
                  <span>{ok ? "✅" : "❌"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{it.question.q}</p>
                    {!ok && it.picked !== null && (
                      <p className="mt-1 text-sm text-rose-700">
                        Votre réponse : {it.options[it.picked]}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-emerald-700">
                      Bonne réponse : {it.options[it.correctIdx]}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      💡 {it.question.explanation}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function verdict(pct: number): { emoji: string; message: string } {
  if (pct >= 90)
    return { emoji: "🏆", message: "Excellent ! Vous maîtrisez le sujet." };
  if (pct >= 70)
    return { emoji: "🎉", message: "Bien joué ! Vous êtes sur la bonne voie." };
  if (pct >= 50)
    return {
      emoji: "💪",
      message: "Pas mal, continuez à réviser les thématiques fragiles.",
    };
  return {
    emoji: "📚",
    message: "Il reste du travail — passez par le mode révision !",
  };
}

/* ---------------- Shared UI ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
