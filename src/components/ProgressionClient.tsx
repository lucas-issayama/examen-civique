"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { THEMES } from "@/lib/questions";
import {
  BADGES,
  emptyProfile,
  levelInfo,
  loadProfile,
  resetProfile,
  type Profile,
} from "@/lib/gamification";

export default function ProgressionClient() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setMounted(true);
  }, []);

  if (!mounted) {
    return <p className="text-slate-500">Chargement de votre progression…</p>;
  }

  const li = levelInfo(profile.totalXp);
  const accuracy =
    profile.totalAnswered > 0
      ? Math.round((profile.totalCorrect / profile.totalAnswered) * 100)
      : 0;
  const earned = new Set(profile.badges);
  const fresh = profile.quizzesPlayed === 0;

  function reset() {
    if (
      window.confirm(
        "Réinitialiser toute votre progression (XP, badges, statistiques) ? Cette action est irréversible.",
      )
    ) {
      setProfile(resetProfile());
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Ma progression</h1>
        <p className="mt-1 text-slate-600">
          Votre progression est enregistrée sur cet appareil (aucun compte requis).
        </p>
      </div>

      {fresh && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-4xl">🚀</div>
          <p className="mt-3 font-semibold text-slate-900">
            Vous n&apos;avez pas encore joué !
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Lancez un premier quiz pour gagner de l&apos;XP et débloquer des badges.
          </p>
          <Link
            href="/quiz"
            className="mt-4 inline-block touch-manipulation rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
          >
            🎯 Lancer un quiz
          </Link>
        </div>
      )}

      {/* Niveau */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-2xl font-extrabold text-white">
            {li.level}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">Niveau</p>
            <p className="text-xl font-bold text-slate-900">
              {profile.totalXp} XP au total
            </p>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${li.pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Encore {li.toNext} XP avant le niveau {li.level + 1}
            </p>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Quiz joués" value={`${profile.quizzesPlayed}`} icon="🎯" />
        <Card label="Précision" value={`${accuracy} %`} icon="🎯" />
        <Card label="Meilleure série" value={`${profile.bestStreak}`} icon="🔥" />
        <Card label="Jours d'affilée" value={`${profile.dailyStreak}`} icon="📅" />
      </section>

      {/* Maîtrise par thématique */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Maîtrise par thématique</h2>
        <div className="space-y-3">
          {THEMES.map((t) => {
            const st = profile.perTheme[t.slug];
            const pct =
              st.answered > 0 ? Math.round((st.correct / st.answered) * 100) : 0;
            return (
              <div
                key={t.slug}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-900">
                    {t.emoji} {t.short}
                  </span>
                  <span className="text-slate-500">
                    {st.answered > 0
                      ? `${pct} % · ${st.correct}/${st.answered}`
                      : "Pas encore joué"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${t.accent} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Badges */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Badges</h2>
          <span className="text-sm text-slate-500">
            {earned.size} / {BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-4 text-center transition ${
                  has
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className={`text-3xl ${has ? "" : "opacity-30 grayscale"}`}>
                  {has ? b.emoji : "🔒"}
                </div>
                <p
                  className={`mt-2 text-sm font-semibold ${has ? "text-amber-900" : "text-slate-400"}`}
                >
                  {b.label}
                </p>
                <p
                  className={`mt-0.5 text-xs ${has ? "text-amber-700" : "text-slate-400"}`}
                >
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {!fresh && (
        <div className="pt-2 text-center">
          <button
            onClick={reset}
            className="touch-manipulation text-sm font-medium text-slate-400 underline transition hover:text-rose-600 active:text-rose-700"
          >
            Réinitialiser ma progression
          </button>
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}
