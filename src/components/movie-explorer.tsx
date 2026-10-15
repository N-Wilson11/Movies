"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import type { Movie } from "@/lib/tmdb";

type MoviesResponse = {
  movies?: Movie[];
  error?: string;
};

const imageUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w500${path}` : null;

export default function MovieExplorer() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState("Nu in de bioscoop");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailer, setTrailer] = useState<{ key: string; title: string } | null>(
    null,
  );
  const [trailerLoadingId, setTrailerLoadingId] = useState<number | null>(null);

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

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadMovies(search.trim());
  }

  async function openTrailer(movie: Movie) {
    setTrailerLoadingId(movie.id);

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
      setError(
        trailerError instanceof Error
          ? trailerError.message
          : "Trailer kon niet worden geladen.",
      );
    } finally {
      setTrailerLoadingId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">▶</span>
          FilmFinder
        </div>
        <span className="tagline">Jouw gids voor de nieuwste films</span>
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
          <h2>{heading}</h2>
          {!loading && !error && (
            <span className="result-count">{movies.length} films</span>
          )}
        </div>

        {loading ? (
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
            {movies.map((movie) => {
              const posterUrl = imageUrl(movie.posterPath);

              return (
                <article className="movie-card" key={movie.id}>
                  <div className="poster">
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
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{movie.title}</h3>
                    <p className="overview">
                      {movie.overview || "Er is nog geen beschrijving beschikbaar."}
                    </p>
                    <button
                      className="trailer-button"
                      disabled={trailerLoadingId === movie.id}
                      onClick={() => void openTrailer(movie)}
                    >
                      {trailerLoadingId === movie.id
                        ? "Trailer laden..."
                        : "▶ Trailer bekijken"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

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
