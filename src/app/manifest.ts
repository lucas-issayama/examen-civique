import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Examen Civique — Réviser & Quiz",
    short_name: "Examen Civique",
    description:
      "Préparez l'examen civique français : révision par thématique et quiz interactif. Questions des listes officielles (CSP et CR).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    lang: "fr",
    dir: "ltr",
    categories: ["education", "reference"],
    icons: [
      // Favicon vectoriel (toutes tailles)
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      // Icônes Android / installation PWA
      { src: "/icon-192", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icon-512", type: "image/png", sizes: "512x512", purpose: "any" },
      // Icône adaptative (forme masquée par le système)
      {
        src: "/icon-maskable",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
