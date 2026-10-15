export type Movie = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  rating: number;
  releaseDate: string;
};

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
};

type TmdbResponse = {
  results: TmdbMovie[];
};

type Authentication = {
  headers: Record<string, string>;
  query: string;
};

const TMDB_API_URL = "https://api.themoviedb.org/3";

function getAuthentication(): Authentication {
  const accessToken = process.env.TMDB_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (accessToken) {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      query: "",
    };
  }

  if (apiKey) {
    return {
      headers: {},
      query: `&api_key=${encodeURIComponent(apiKey)}`,
    };
  }

  throw new Error(
    "Configureer TMDB_ACCESS_TOKEN (Read Access Token) of TMDB_API_KEY (v3 API Key).",
  );
}

async function tmdbFetch(path: string) {
  const authentication = getAuthentication();
  const response = await fetch(`${TMDB_API_URL}${path}${authentication.query}`, {
    headers: {
      accept: "application/json",
      ...authentication.headers,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "TMDB heeft de sleutel geweigerd. Controleer of je een geldige Read Access Token of v3 API Key gebruikt.",
      );
    }

    throw new Error(`TMDB reageerde met status ${response.status}.`);
  }

  return response.json();
}

function toMovie(movie: TmdbMovie): Movie {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    rating: movie.vote_average,
    releaseDate: movie.release_date,
  };
}

export async function getMovies(query?: string): Promise<Movie[]> {
  const path = query
    ? `/search/movie?query=${encodeURIComponent(query)}&language=nl-NL&include_adult=false`
    : "/movie/now_playing?language=nl-NL&region=NL";
  const data = (await tmdbFetch(path)) as TmdbResponse;

  return data.results.slice(0, 16).map(toMovie);
}

export async function getTrailerKey(movieId: number): Promise<string | null> {
  const data = (await tmdbFetch(
    `/movie/${movieId}/videos?language=nl-NL`,
  )) as {
    results: { key: string; site: string; type: string; official: boolean }[];
  };
  const videos = data.results;
  const trailer =
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official,
    ) ??
    videos.find(
      (video) => video.site === "YouTube" && video.type === "Trailer",
    );

  return trailer?.key ?? null;
}
