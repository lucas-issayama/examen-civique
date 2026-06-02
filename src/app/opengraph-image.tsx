import { ImageResponse } from "next/og";

export const alt =
  "Examen Civique — Préparez l'examen civique français avec les questions officielles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Vignette de partage (réseaux sociaux, aperçu de lien).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f172a",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: "#0b56d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: "#e4002b",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", color: "#e2e8f0", fontSize: 40, fontWeight: 700 }}>
            Examen Civique
          </div>
        </div>

        {/* Titre */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Préparez l&apos;examen civique français
          </div>
          <div style={{ display: "flex", color: "#94a3b8", fontSize: 34 }}>
            366 questions officielles · révision par thématique · quiz interactif
          </div>
        </div>

        {/* Pied */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", color: "#64748b", fontSize: 26 }}>
            Listes officielles CSP &amp; CR — ministère de l&apos;Intérieur
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: 36, height: 18, background: "#0b56d0" }} />
            <div style={{ width: 36, height: 18, background: "#ffffff" }} />
            <div style={{ width: 36, height: 18, background: "#e4002b" }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
