import { getTrailerKey } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: "Ongeldige film." }, { status: 400 });
  }

  try {
    const trailerKey = await getTrailerKey(movieId);
    return NextResponse.json({ trailerKey });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Trailer kon niet worden geladen.";
    const status = message.includes("TMDB_ACCESS_TOKEN") ? 503 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
