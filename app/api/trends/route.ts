import { NextRequest } from "next/server";
import { collectTrendSnapshot } from "@/lib/trends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const geo = request.nextUrl.searchParams.get("geo") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit") ?? undefined;
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const snapshot = await collectTrendSnapshot({ geo, limit });

  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, must-revalidate"
    }
  });
}
