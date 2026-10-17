"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Movie } from "@/lib/tmdb";

type MoviesResponse = {
  movies?: Movie[];
  error?: string;
};

const imageUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w500${path}` : null;

const WATCHLIST_KEY = "filmfinder:watchlist";

function isMovie(value: unknown): value is Movie {
  if (!value || typeof value !== "object") {
    return false;
  }

  const movie = value as Record<string, unknown>;

  return (
    typeof movie.id === "number" &&
    typeof movie.title === "string" &&
    typeof movie.overview === "string" &&
    (typeof movie.posterPath === "string" || movie.posterPath === null) &&
    typeof movie.rating === "number" &&
    typeof movie.releaseDate === "string"
  );
}

function MovieCard({
  movie,
  onOpenDetails,
  onOpenTrailer,
  onToggleWatchlist,
  trailerLoading,
  watchlisted,
}: {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
  trailerLoading: boolean;
  watchlisted: boolean;
}) {
  const posterUrl = imageUrl(movie.posterPath);

  return (
    <article className="movie-card">
      <button
        aria-label={`Meer informatie over ${movie.title}`}
        className="movie-details-button"
        onClick={() => onOpenDetails(movie)}
        type="button"
      >
        <span className="poster">
          {posterUrl ? (
            <Image
              alt={`Poster van ${movie.title}`}
              fill
              sizes="(max-width: 620px) 50vw, (max-width: 900px) 33vw, 25vw"
              src={posterUrl}
            />
          ) : (
            <span className="no-poster">Geen poster beschikbaar</span>
          )}
          <span className="rating">★ {movie.rating.toFixed(1)}</span>
        </span>
        <span className="card-body">
          <span aria-level={3} className="card-title" role="heading">
            {movie.title}
          </span>
          <span className="overview">
            {movie.overview || "Er is nog geen beschrijving beschikbaar."}
          </span>
        </span>
      </button>
      <div className="card-actions">
        <button
          className="trailer-button"
          disabled={trailerLoading}
          onClick={() => onOpenTrailer(movie)}
        >
          {trailerLoading ? "Laden..." : "▶ Trailer"}
        </button>
        <button
          aria-label={
            watchlisted
              ? `${movie.title} uit watchlist verwijderen`
              : `${movie.title} aan watchlist toevoegen`
          }
          className={`watchlist-button${watchlisted ? " is-saved" : ""}`}
          onClick={() => onToggleWatchlist(movie)}
        >
          {watchlisted ? "✓ Op lijst" : "+ Bewaar"}
        </button>
      </div>
    </article>
  );
}

export default function MovieExplorer() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState("Nu in de bioscoop");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailerError, setTrailerError] = useState<string | null>(null);
  const [trailer, setTrailer] = useState<{ key: string; title: string } | null>(
    null,
  );
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trailerLoadingId, setTrailerLoadingId] = useState<number | null>(null);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [showingWatchlist, setShowingWatchlist] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const watchlistRef = useRef<Movie[]>([]);
  const selectedPosterUrl = selectedMovie
    ? imageUrl(selectedMovie.posterPath)
    : null;

  async function loadMovies(query = "") {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/movies${query ? `?query=${encodeURIComponent(query)}` : ""}`,
      );
      const data = (await response.json()) as MoviesResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Films konden niet worden geladen.");
      }

      setMovies(data.movies ?? []);
      setHeading(query ? `Zoekresultaten voor "${query}"` : "Nu in de bioscoop");
    } catch (loadError) {
      setMovies([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Films konden niet worden geladen.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadMovies());
  }, []);

  useEffect(() => {
    if (!selectedMovie && !trailer) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedMovie(null);
        setTrailer(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedMovie, trailer]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const saved = window.localStorage.getItem(WATCHLIST_KEY);
        const storedMovies = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(storedMovies) || !storedMovies.every(isMovie)) {
          throw new Error("De opgeslagen watchlist heeft een ongeldig formaat.");
        }

        watchlistRef.current = storedMovies;
        setWatchlist(storedMovies);
      } catch (storageError) {
        setWatchlistError(
          storageError instanceof Error
            ? storageError.message
            : "De opgeslagen watchlist kon niet worden gelezen.",
        );
      }
    });
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadMovies(search.trim());
  }

  async function openTrailer(movie: Movie) {
    setTrailerLoadingId(movie.id);
    setTrailerError(null);

    try {
      const response = await fetch(`/api/movies/${movie.id}/trailer`);
      const data = (await response.json()) as {
        trailerKey?: string | null;
        error?: string;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Trailer kon niet worden geladen.");
      }
      if (!data.trailerKey) {
        throw new Error(`Er is geen trailer beschikbaar voor ${movie.title}.`);
      }

      setTrailer({ key: data.trailerKey, title: movie.title });
    } catch (trailerError) {
      setTrailerError(
        trailerError instanceof Error
          ? trailerError.message
          : "Trailer kon niet worden geladen.",
      );
    } finally {
      setTrailerLoadingId(null);
    }
  }

  function toggleWatchlist(movie: Movie) {
    const currentWatchlist = watchlistRef.current;
    const isSaved = currentWatchlist.some((savedMovie) => savedMovie.id === movie.id);
    const nextWatchlist = isSaved
      ? currentWatchlist.filter((savedMovie) => savedMovie.id !== movie.id)
      : [...currentWatchlist, movie];

    try {
      window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(nextWatchlist));
      watchlistRef.current = nextWatchlist;
      setWatchlist(nextWatchlist);
      setWatchlistError(null);
    } catch {
      setWatchlistError(
        "De watchlist kon niet worden opgeslagen. Controleer de browserinstellingen.",
      );
    }
  }

  function isWatchlisted(movieId: number) {
    return watchlist.some((movie) => movie.id === movieId);
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">▶</span>
          FilmFinder
        </div>
        <div className="header-actions">
          <span className="tagline">Jouw gids voor de nieuwste films</span>
          <button
            aria-pressed={showingWatchlist}
            className="header-watchlist"
            onClick={() => setShowingWatchlist(true)}
          >
            ★ Watchlist <span>{watchlist.length}</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">
          <span className="pulse" /> Altijd actueel
        </p>
        <h1>Vind je volgende favoriete film.</h1>
        <p className="hero-copy">
          Bekijk wat er nu draait, lees de beschrijving, vergelijk ratings en
          speel direct de trailer af.
        </p>
        <form className="search" onSubmit={handleSearch}>
          <input
            aria-label="Zoek een film"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek op filmtitel..."
          />
          <button type="submit">Zoeken</button>
        </form>
      </section>

      <section className="catalogue" aria-live="polite">
        <div className="catalogue-heading">
          <h2>{showingWatchlist ? "Mijn watchlist" : heading}</h2>
          {showingWatchlist ? (
            <button
              className="close-watchlist"
              onClick={() => setShowingWatchlist(false)}
            >
              Terug naar films
            </button>
          ) : (
            !loading &&
            !error && <span className="result-count">{movies.length} films</span>
          )}
        </div>

        {trailerError && (
          <div className="notice trailer-notice">{trailerError}</div>
        )}
        {showingWatchlist && watchlistError && (
          <div className="notice trailer-notice">{watchlistError}</div>
        )}
        {showingWatchlist ? (
          watchlist.length === 0 ? (
            <div className="notice">
              <strong>Je watchlist is nog leeg.</strong>
              Bewaar een film om hem hier terug te vinden.
            </div>
          ) : (
            <div className="movie-grid">
              {watchlist.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onOpenDetails={setSelectedMovie}
                  onOpenTrailer={(selectedMovie) => void openTrailer(selectedMovie)}
                  onToggleWatchlist={toggleWatchlist}
                  trailerLoading={trailerLoadingId === movie.id}
                  watchlisted
                />
              ))}
            </div>
          )
        ) : loading ? (
          <div className="notice">Films worden geladen...</div>
        ) : error ? (
          <div className="notice">
            <strong>Films zijn tijdelijk niet beschikbaar.</strong>
            {error}
          </div>
        ) : movies.length === 0 ? (
          <div className="notice">
            <strong>Geen films gevonden.</strong>
            Probeer een andere titel.
          </div>
        ) : (
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenDetails={setSelectedMovie}
                onOpenTrailer={(selectedMovie) => void openTrailer(selectedMovie)}
                onToggleWatchlist={toggleWatchlist}
                trailerLoading={trailerLoadingId === movie.id}
                watchlisted={isWatchlisted(movie.id)}
              />
            ))}
          </div>
        )}
      </section>

      {selectedMovie && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMovie(null);
            }
          }}
        >
          <section
            aria-labelledby="movie-details-title"
            aria-modal="true"
            className="movie-details-modal"
            role="dialog"
          >
            <button
              aria-label="Sluit filmdetails"
              className="close-button movie-details-close"
              onClick={() => setSelectedMovie(null)}
              type="button"
            >
              ×
            </button>
            <div className="details-poster">
              {selectedPosterUrl ? (
                <Image
                  alt={`Poster van ${selectedMovie.title}`}
                  fill
                  sizes="(max-width: 620px) 40vw, 300px"
                  src={selectedPosterUrl}
                />
              ) : (
                <span className="no-poster">Geen poster beschikbaar</span>
              )}
            </div>
            <div className="details-content">
              <p className="eyebrow">Filmdetails</p>
              <h2 id="movie-details-title">{selectedMovie.title}</h2>
              <p className="details-rating">
                ★ {selectedMovie.rating.toFixed(1)} <span>/ 10</span>
              </p>
              <p className="details-overview">
                {selectedMovie.overview ||
                  "Er is nog geen beschrijving beschikbaar."}
              </p>
            </div>
          </section>
        </div>
      )}

      {trailer && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setTrailer(null)}
        >
          <section
            aria-label={`Trailer van ${trailer.title}`}
            aria-modal="true"
            className="trailer-modal"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <span>{trailer.title} — trailer</span>
              <button
                aria-label="Sluit trailer"
                className="close-button"
                onClick={() => setTrailer(null)}
              >
                ×
              </button>
            </header>
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="video-frame"
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
              title={`Trailer van ${trailer.title}`}
            />
          </section>
        </div>
      )}
    </main>
  );
}
