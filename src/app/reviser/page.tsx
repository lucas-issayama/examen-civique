import { Suspense } from "react";
import ReviserClient from "@/components/ReviserClient";

export const metadata = {
  title: "Réviser — Examen Civique",
};

export default function ReviserPage() {
  return (
    <Suspense
      fallback={<p className="text-slate-500">Chargement des questions…</p>}
    >
      <ReviserClient />
    </Suspense>
  );
}
