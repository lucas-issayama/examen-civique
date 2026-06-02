import { THEMES, type ThemeSlug } from "@/lib/questions";

const STORAGE_KEY = "examen-civique:profile:v1";

export interface ThemeStat {
  correct: number;
  answered: number;
}

export interface Profile {
  totalXp: number;
  quizzesPlayed: number;
  totalCorrect: number;
  totalAnswered: number;
  bestStreak: number;
  /** YYYY-MM-DD of last completed quiz */
  lastPlayedDate: string | null;
  /** consecutive days with at least one quiz */
  dailyStreak: number;
  perTheme: Record<ThemeSlug, ThemeStat>;
  badges: string[];
}

/** Result of one finished quiz, used to update the profile. */
export interface QuizSession {
  length: number;
  correct: number;
  answers: { themeSlug: ThemeSlug; correct: boolean }[];
  bestStreak: number;
  /** XP earned during play (per-question points + bonuses) */
  xpEarned: number;
}

export function emptyProfile(): Profile {
  const perTheme = {} as Record<ThemeSlug, ThemeStat>;
  for (const t of THEMES) perTheme[t.slug] = { correct: 0, answered: 0 };
  return {
    totalXp: 0,
    quizzesPlayed: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    bestStreak: 0,
    lastPlayedDate: null,
    dailyStreak: 0,
    perTheme,
    badges: [],
  };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<Profile>;
    // merge with defaults so new fields/themes never break older saves
    const base = emptyProfile();
    return {
      ...base,
      ...parsed,
      perTheme: { ...base.perTheme, ...(parsed.perTheme ?? {}) },
      badges: parsed.badges ?? [],
    };
  } catch {
    return emptyProfile();
  }
}

function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function resetProfile(): Profile {
  const p = emptyProfile();
  saveProfile(p);
  return p;
}

/* ---------------- XP & levels ---------------- */

/** Cumulative XP required to *reach* a given level (level 1 = 0). */
export function xpToReachLevel(level: number): number {
  return 50 * (level - 1) * level; // L2=100, L3=300, L4=600, L5=1000...
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpToReachLevel(level + 1)) level++;
  return level;
}

export interface LevelInfo {
  level: number;
  current: number; // xp into current level
  needed: number; // xp span of current level
  pct: number; // 0-100 progress within current level
  toNext: number; // xp remaining to next level
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelForXp(xp);
  const floor = xpToReachLevel(level);
  const ceil = xpToReachLevel(level + 1);
  const current = xp - floor;
  const needed = ceil - floor;
  return {
    level,
    current,
    needed,
    pct: Math.round((current / needed) * 100),
    toNext: ceil - xp,
  };
}

/** Per-question points based on the current streak (combo). */
export function pointsForStreak(streak: number): number {
  return Math.round(10 * streakMultiplier(streak));
}

export function streakMultiplier(streak: number): number {
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/* ---------------- Badges ---------------- */

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
  /** True when the badge condition is met after a quiz. */
  test: (p: Profile, s: QuizSession) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "first-quiz",
    emoji: "🎓",
    label: "Premiers pas",
    description: "Terminer votre premier quiz",
    test: (p) => p.quizzesPlayed >= 1,
  },
  {
    id: "flawless",
    emoji: "💯",
    label: "Sans faute",
    description: "100 % à un quiz d'au moins 10 questions",
    test: (_p, s) => s.length >= 10 && s.correct === s.length,
  },
  {
    id: "on-fire",
    emoji: "🔥",
    label: "En feu",
    description: "Atteindre une série de 5 bonnes réponses",
    test: (_p, s) => s.bestStreak >= 5,
  },
  {
    id: "unstoppable",
    emoji: "⚡",
    label: "Imbattable",
    description: "Atteindre une série de 10 bonnes réponses",
    test: (_p, s) => s.bestStreak >= 10,
  },
  {
    id: "marathon",
    emoji: "🏃",
    label: "Marathonien",
    description: "Terminer un quiz de 30 questions",
    test: (_p, s) => s.length >= 30,
  },
  {
    id: "scholar",
    emoji: "📚",
    label: "Érudit",
    description: "Répondre à 100 questions au total",
    test: (p) => p.totalAnswered >= 100,
  },
  {
    id: "veteran",
    emoji: "🎖️",
    label: "Vétéran",
    description: "Répondre à 500 questions au total",
    test: (p) => p.totalAnswered >= 500,
  },
  {
    id: "regular",
    emoji: "📅",
    label: "Assidu",
    description: "Jouer 3 jours d'affilée",
    test: (p) => p.dailyStreak >= 3,
  },
  {
    id: "devoted",
    emoji: "🗓️",
    label: "Dévoué",
    description: "Jouer 7 jours d'affilée",
    test: (p) => p.dailyStreak >= 7,
  },
  {
    id: "level-5",
    emoji: "🌟",
    label: "Citoyen confirmé",
    description: "Atteindre le niveau 5",
    test: (p) => levelForXp(p.totalXp) >= 5,
  },
  {
    id: "level-10",
    emoji: "👑",
    label: "Citoyen d'honneur",
    description: "Atteindre le niveau 10",
    test: (p) => levelForXp(p.totalXp) >= 10,
  },
  // Maîtrise par thématique : ≥ 80 % sur au moins 15 réponses
  ...THEMES.map(
    (t): Badge => ({
      id: `master-${t.slug}`,
      emoji: t.emoji,
      label: `Maître · ${t.short}`,
      description: `≥ 80 % de réussite sur « ${t.short} » (15 réponses min.)`,
      test: (p) => {
        const st = p.perTheme[t.slug];
        return st.answered >= 15 && st.correct / st.answered >= 0.8;
      },
    }),
  ),
];

export const BADGE_BY_ID: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);

/* ---------------- Daily streak ---------------- */

function todayKey(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/* ---------------- Apply a finished quiz ---------------- */

export interface QuizOutcome {
  profile: Profile;
  xpGained: number;
  prevLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: Badge[];
  dailyStreak: number;
  dailyStreakIncreased: boolean;
}

export function applyQuiz(prev: Profile, session: QuizSession): QuizOutcome {
  const prevLevel = levelForXp(prev.totalXp);
  const today = todayKey();

  let dailyStreak = prev.dailyStreak;
  let dailyStreakIncreased = false;
  if (prev.lastPlayedDate === null) {
    dailyStreak = 1;
    dailyStreakIncreased = true;
  } else if (prev.lastPlayedDate !== today) {
    const gap = daysBetween(prev.lastPlayedDate, today);
    dailyStreak = gap === 1 ? prev.dailyStreak + 1 : 1;
    dailyStreakIncreased = true;
  }

  const perTheme = structuredCloneSafe(prev.perTheme);
  for (const a of session.answers) {
    perTheme[a.themeSlug].answered += 1;
    if (a.correct) perTheme[a.themeSlug].correct += 1;
  }

  const next: Profile = {
    ...prev,
    totalXp: prev.totalXp + session.xpEarned,
    quizzesPlayed: prev.quizzesPlayed + 1,
    totalCorrect: prev.totalCorrect + session.correct,
    totalAnswered: prev.totalAnswered + session.length,
    bestStreak: Math.max(prev.bestStreak, session.bestStreak),
    lastPlayedDate: today,
    dailyStreak,
    perTheme,
    badges: [...prev.badges],
  };

  const newBadges: Badge[] = [];
  for (const badge of BADGES) {
    if (!next.badges.includes(badge.id) && badge.test(next, session)) {
      next.badges.push(badge.id);
      newBadges.push(badge);
    }
  }

  saveProfile(next);
  const newLevel = levelForXp(next.totalXp);

  return {
    profile: next,
    xpGained: session.xpEarned,
    prevLevel,
    newLevel,
    leveledUp: newLevel > prevLevel,
    newBadges,
    dailyStreak,
    dailyStreakIncreased,
  };
}

function structuredCloneSafe(
  obj: Record<ThemeSlug, ThemeStat>,
): Record<ThemeSlug, ThemeStat> {
  const out = {} as Record<ThemeSlug, ThemeStat>;
  for (const k of Object.keys(obj) as ThemeSlug[]) {
    out[k] = { ...obj[k] };
  }
  return out;
}
