"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { levelInfo, loadProfile, type Profile } from "@/lib/gamification";

export default function HomeProfileCard() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // N'affiche rien tant qu'on n'a pas chargé, ou si l'utilisateur n'a jamais joué
  if (!profile || profile.quizzesPlayed === 0) return null;

  const li = levelInfo(profile.totalXp);

  return (
    <Link
      href="/progression"
      className="block touch-manipulation rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-xl font-extrabold text-white">
          {li.level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900">Niveau {li.level}</p>
            <span className="text-sm text-slate-500">
              {profile.dailyStreak > 0 && `🔥 ${profile.dailyStreak} j · `}
              {profile.badges.length} 🏅
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${li.pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {li.current} / {li.needed} XP · voir ma progression →
          </p>
        </div>
      </div>
    </Link>
  );
}
