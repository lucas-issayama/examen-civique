"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  THEMES,
  THEME_BY_SLUG,
  shuffle,
  type ListCode,
  type Question,
  type ThemeSlug,
} from "@/lib/questions";
import {
  applyQuiz,
  levelInfo,
  loadProfile,
  pointsForStreak,
  streakMultiplier,
  type Badge,
  type QuizOutcome,
  type QuizSession,
} from "@/lib/gamification";

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
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);

  const available = useMemo(() => {
    return QUESTIONS.filter((item) => {
      if (theme !== "all" && item.themeSlug !== theme) return false;
      if (list !== "all" && !item.lists.includes(list)) return false;
      return true;
    });
  }, [theme, list]);

  // Mode immersif pendant le jeu : masque le chrome global (en-tête, pied, nav)
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "playing") root.setAttribute("data-quiz-immersive", "true");
    else root.removeAttribute("data-quiz-immersive");
    return () => root.removeAttribute("data-quiz-immersive");
  }, [phase]);

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

  function finish(finalItems: QuizItem[]) {
    const session = buildSession(finalItems);
    setOutcome(applyQuiz(loadProfile(), session));
    setPhase("results");
  }

  function next() {
    if (current + 1 < items.length) {
      setCurrent((c) => c + 1);
    } else {
      finish(items);
    }
  }

  function restart() {
    setPhase("setup");
    setItems([]);
    setCurrent(0);
    setOutcome(null);
  }

  // Série de bonnes réponses se terminant à la question courante (affichage live)
  const liveStreak = useMemo(() => {
    let s = 0;
    for (let i = 0; i <= current && i < items.length; i++) {
      const it = items[i];
      if (it.picked === null) break;
      s = it.picked === it.correctIdx ? s + 1 : 0;
    }
    return s;
  }, [items, current]);

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

  if (phase === "results" && outcome) {
    return <Results items={items} outcome={outcome} onRestart={restart} />;
  }

  return (
    <Playing
      items={items}
      current={current}
      streak={liveStreak}
      onAnswer={answer}
      onNext={next}
      onQuit={restart}
    />
  );
}

/** Compute scoring + per-theme breakdown from the played items, in order. */
function buildSession(items: QuizItem[]): QuizSession {
  let streak = 0;
  let bestStreak = 0;
  let xp = 0;
  let correct = 0;
  const answers: QuizSession["answers"] = [];

  for (const it of items) {
    const ok = it.picked === it.correctIdx;
    answers.push({ themeSlug: it.question.themeSlug, correct: ok });
    if (ok) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      xp += pointsForStreak(streak);
      correct += 1;
    } else {
      streak = 0;
    }
  }
  // Bonus quiz parfait
  if (items.length >= 10 && correct === items.length) xp += 50;

  return { length: items.length, correct, answers, bestStreak, xpEarned: xp };
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
        className="w-full touch-manipulation rounded-xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.99] active:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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
  streak,
  onAnswer,
  onNext,
  onQuit,
}: {
  items: QuizItem[];
  current: number;
  streak: number;
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
  const mult = streakMultiplier(streak);
  const gained = answered && isCorrect ? pointsForStreak(streak) : 0;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-2xl flex-col px-4">
      {/* Haut : progression (fixe) */}
      <div
        className="shrink-0"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <button
            onClick={onQuit}
            className="touch-manipulation hover:text-slate-900 active:opacity-60"
          >
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
        {/* Compteur de série / combo */}
        {streak >= 2 && (
          <div className="mt-2 flex animate-fade-in items-center justify-center gap-2 text-sm font-semibold">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                streak >= 5
                  ? "bg-orange-100 text-orange-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              🔥 Série de {streak}
            </span>
            {mult > 1 && (
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white">
                combo ×{mult}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Milieu : question + réponses (défile si nécessaire) */}
      <div
        key={current}
        className="animate-fade-in min-h-0 flex-1 overflow-y-auto py-4"
      >
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${t.chip}`}
        >
          {t.emoji} {t.short}
        </span>
        <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
          {item.question.q}
        </h2>

        <div className="mt-4 space-y-2.5">
          {item.options.map((opt, i) => {
            const state = optionState(i, item, answered);
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => onAnswer(i)}
                className={`flex w-full touch-manipulation items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-slate-800 transition ${stateClasses(state)}`}
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
          <div
            className={`animate-fade-in mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              isCorrect
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {isCorrect ? "✓ Bonne réponse !" : "✕ Mauvaise réponse."}
              {gained > 0 && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  +{gained} XP
                </span>
              )}
            </span>{" "}
            <span className="font-normal text-slate-600">
              {item.question.explanation}
            </span>
          </div>
        )}
      </div>

      {/* Bas : bouton suivant (toujours visible une fois la réponse donnée) */}
      {answered && (
        <div
          className="shrink-0 border-t border-slate-100 pt-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
        >
          <button
            onClick={onNext}
            className="w-full touch-manipulation rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 active:scale-[0.99] active:bg-slate-800"
          >
            {isLast ? "Voir mon résultat →" : "Question suivante →"}
          </button>
        </div>
      )}
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
      return "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 active:border-slate-900 active:bg-slate-100 active:scale-[0.99] cursor-pointer";
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
  outcome,
  onRestart,
}: {
  items: QuizItem[];
  outcome: QuizOutcome;
  onRestart: () => void;
}) {
  const score = items.filter((i) => i.picked === i.correctIdx).length;
  const total = items.length;
  const pct = Math.round((score / total) * 100);
  const { emoji, message } = verdict(pct);
  const li = levelInfo(outcome.profile.totalXp);
  const bestStreak = Math.max(...sessionStreaks(items), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Level-up banner */}
      {outcome.leveledUp && (
        <div className="animate-fade-in rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-center text-white shadow">
          <div className="text-3xl">🎉</div>
          <p className="mt-1 text-lg font-extrabold">
            Niveau {outcome.newLevel} atteint !
          </p>
          <p className="text-sm opacity-90">Continuez sur votre lancée 💪</p>
        </div>
      )}

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

        {/* Gains de la partie */}
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="XP gagnés" value={`+${outcome.xpGained}`} accent="text-emerald-600" />
          <Stat label="Série max" value={`🔥 ${bestStreak}`} />
          <Stat
            label="Jours d'affilée"
            value={`📅 ${outcome.dailyStreak}`}
          />
        </div>

        {/* Progression de niveau */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">
              Niveau {li.level}
            </span>
            <span className="text-slate-500">
              {li.current} / {li.needed} XP
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-500"
              style={{ width: `${li.pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Encore {li.toNext} XP avant le niveau {li.level + 1}.
          </p>
        </div>

        {/* Badges débloqués */}
        {outcome.newBadges.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              🏅 Nouveau{outcome.newBadges.length > 1 ? "x" : ""} badge
              {outcome.newBadges.length > 1 ? "s" : ""} débloqué
              {outcome.newBadges.length > 1 ? "s" : ""} !
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {outcome.newBadges.map((b: Badge) => (
                <div
                  key={b.id}
                  className="flex w-24 animate-fade-in flex-col items-center text-center"
                  title={b.description}
                >
                  <span className="text-3xl">{b.emoji}</span>
                  <span className="mt-1 text-xs font-semibold text-amber-900">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onRestart}
            className="touch-manipulation rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 active:scale-[0.99] active:bg-slate-800"
          >
            🔁 Nouveau quiz
          </button>
          <Link
            href="/progression"
            className="touch-manipulation rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-800 transition hover:bg-slate-100 active:scale-[0.99]"
          >
            🏆 Ma progression
          </Link>
        </div>
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

/** Running streak lengths reached during the quiz (for "best streak" display). */
function sessionStreaks(items: QuizItem[]): number[] {
  const out: number[] = [];
  let s = 0;
  for (const it of items) {
    s = it.picked === it.correctIdx ? s + 1 : 0;
    out.push(s);
  }
  return out;
}

function Stat({
  label,
  value,
  accent = "text-slate-900",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className={`text-lg font-extrabold ${accent}`}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
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
      className={`touch-manipulation rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
