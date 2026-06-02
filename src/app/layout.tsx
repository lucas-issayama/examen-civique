import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Examen Civique — Réviser les questions de connaissance",
  description:
    "Préparez l'examen civique français : révisez par thématique et entraînez-vous avec un quiz. Questions issues des listes officielles (CSP et CR) du ministère de l'Intérieur.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${geist.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="text-xl">🇫🇷</span>
              <span>Examen Civique</span>
            </Link>
            <div className="flex items-center gap-1 text-sm font-medium">
              <Link
                href="/reviser"
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Réviser
              </Link>
              <Link
                href="/quiz"
                className="rounded-lg bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-700"
              >
                Lancer un quiz
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-slate-500">
          <p>
            Outil d&apos;entraînement non officiel. Les énoncés proviennent des listes
            officielles publiées sur{" "}
            <a
              href="https://formation-civique.interieur.gouv.fr/"
              className="underline hover:text-slate-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              formation-civique.interieur.gouv.fr
            </a>
            . Les propositions de réponses sont générées à titre pédagogique.
          </p>
        </footer>
      </body>
    </html>
  );
}
