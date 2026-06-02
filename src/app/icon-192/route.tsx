import { renderAppIcon } from "@/lib/appIcon";

export const dynamic = "force-static";
export const contentType = "image/png";

export function GET() {
  return renderAppIcon(192);
}
