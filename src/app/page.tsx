import Link from "next/link";
import { THEMES, QUESTIONS, countByTheme } from "@/lib/questions";
import HomeProfileCard from "@/components/HomeProfileCard";

export default function Home() {
  const counts = countByTheme();

  return (
    <div className="space-y-14">
      <HomeProfileCard />
      {/* Hero */}
      <section className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600">
          <span>📘</span> {QUESTIONS.length} questions des listes officielles
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Préparez l&apos;examen civique français
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-slate-600">
          Révisez les questions de connaissance par thématique, puis testez-vous
          avec un quiz interactif. Les énoncés sont tirés des listes officielles
          (CSP et CR) du ministère de l&apos;Intérieur.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/quiz"
            className="touch-manipulation rounded-xl bg-slate-900 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98] active:bg-slate-800"
          >
            🎯 Lancer un quiz
          </Link>
          <Link
            href="/reviser"
            className="touch-manipulation rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-800 transition hover:bg-slate-100 active:scale-[0.98] active:bg-slate-100"
          >
            📚 Réviser les questions
          </Link>
        </div>
      </section>

      {/* Themes grid */}
      <section>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">
          Les 5 thématiques
        </h2>
        <p className="mb-6 text-slate-600">
          Explorez les questions par thème ou lancez un quiz ciblé.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <Link
              key={t.slug}
              href={`/reviser?theme=${t.slug}`}
              className="group relative touch-manipulation overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.accent}`}
              />
              <div className="text-3xl">{t.emoji}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{t.label}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {counts[t.slug]} questions
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-slate-700 group-hover:underline">
                Explorer →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-2xl">📚</div>
          <h3 className="mt-3 text-lg font-bold">Mode révision</h3>
          <p className="mt-2 text-sm text-slate-600">
            Parcourez toutes les questions, filtrez par thématique ou par liste
            (CSP / CR), recherchez un mot-clé et révélez la bonne réponse avec son
            explication.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-2xl">🎯</div>
          <h3 className="mt-3 text-lg font-bold">Mode quiz</h3>
          <p className="mt-2 text-sm text-slate-600">
            Un quiz façon trivia : une question, quatre réponses, un retour
            immédiat, une barre de progression et votre score détaillé à la fin.
          </p>
        </div>
      </section>
    </div>
  );
}
