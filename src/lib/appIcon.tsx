import { ImageResponse } from "next/og";

/**
 * Génère l'icône de l'application (cocarde tricolore sur fond ardoise) en PNG.
 *
 * @param size   côté de l'icône en pixels (carré)
 * @param maskable  si vrai, fond plein bord à bord et cocarde réduite dans la
 *   « zone de sécurité » (~62 %) pour les icônes adaptatives Android.
 */
export function renderAppIcon(size: number, maskable = false): ImageResponse {
  const ring = Math.round(size * (maskable ? 0.62 : 0.82));
  const white = Math.round(ring * 0.66);
  const red = Math.round(ring * 0.33);
  const radius = maskable ? 0 : Math.round(size * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          borderRadius: radius,
        }}
      >
        <div
          style={{
            width: ring,
            height: ring,
            borderRadius: 9999,
            background: "#0b56d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: white,
              height: white,
              borderRadius: 9999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: red,
                height: red,
                borderRadius: 9999,
                background: "#e4002b",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
