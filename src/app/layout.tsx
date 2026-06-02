import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Examen Civique — Réviser les questions de connaissance",
  description:
    "Préparez l'examen civique français : révisez par thématique et entraînez-vous avec un quiz. Questions issues des listes officielles (CSP et CR) du ministère de l'Intérieur.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Examen Civique",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${geist.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex touch-manipulation items-center gap-2 font-bold text-slate-900 active:opacity-70"
            >
              <span className="text-xl">🇫🇷</span>
              <span>Examen Civique</span>
            </Link>
            {/* Liens visibles sur desktop ; sur mobile, voir la barre de navigation en bas */}
            <div className="hidden items-center gap-1 text-sm font-medium sm:flex">
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
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-28 pt-6 text-center text-xs text-slate-500 sm:pb-10">
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
        <BottomNav />
      </body>
    </html>
  );
}
