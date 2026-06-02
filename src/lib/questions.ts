import rawQuestions from "@/data/questions.json";

export type ListCode = "CSP" | "CR";

export interface Question {
  id: number;
  q: string;
  theme: string;
  themeSlug: ThemeSlug;
  lists: ListCode[];
  options: string[];
  correct: number;
  explanation: string;
}

export type ThemeSlug =
  | "principes"
  | "institutions"
  | "droits"
  | "histoire"
  | "societe";

export interface ThemeMeta {
  slug: ThemeSlug;
  label: string;
  short: string;
  emoji: string;
  /** Tailwind classes for accent color */
  accent: string;
  ring: string;
  chip: string;
}

export const THEMES: ThemeMeta[] = [
  {
    slug: "principes",
    label: "Principes et valeurs de la République",
    short: "Principes & valeurs",
    emoji: "🇫🇷",
    accent: "from-blue-500 to-blue-700",
    ring: "ring-blue-500",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    slug: "institutions",
    label: "Système institutionnel et politique",
    short: "Institutions",
    emoji: "🏛️",
    accent: "from-indigo-500 to-indigo-700",
    ring: "ring-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    slug: "droits",
    label: "Droits et devoirs",
    short: "Droits & devoirs",
    emoji: "⚖️",
    accent: "from-emerald-500 to-emerald-700",
    ring: "ring-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    slug: "histoire",
    label: "Histoire, géographie et culture",
    short: "Histoire & culture",
    emoji: "📜",
    accent: "from-amber-500 to-amber-700",
    ring: "ring-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    slug: "societe",
    label: "Vivre dans la société française",
    short: "Vie en société",
    emoji: "🤝",
    accent: "from-rose-500 to-rose-700",
    ring: "ring-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export const THEME_BY_SLUG: Record<ThemeSlug, ThemeMeta> = Object.fromEntries(
  THEMES.map((t) => [t.slug, t]),
) as Record<ThemeSlug, ThemeMeta>;

export const QUESTIONS: Question[] = rawQuestions as Question[];

export function countByTheme(): Record<ThemeSlug, number> {
  const counts = {} as Record<ThemeSlug, number>;
  for (const t of THEMES) counts[t.slug] = 0;
  for (const q of QUESTIONS) counts[q.themeSlug]++;
  return counts;
}

/** Deterministic-free shuffle (client only). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
