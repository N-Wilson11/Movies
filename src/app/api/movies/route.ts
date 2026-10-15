import { getMovies } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim();
    const movies = await getMovies(query);

    return NextResponse.json({ movies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Films konden niet worden geladen.";
    const status = message.includes("TMDB_ACCESS_TOKEN") ? 503 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
