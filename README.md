# FilmFinder

Een Node.js-filmapp die actuele bioscoopfilms uit TMDB toont. Bezoekers kunnen
zoeken op titel en krijgen de naam, beschrijving, rating en YouTube-trailer te
zien. Een persoonlijke watchlist wordt lokaal in de browser opgeslagen.

## Lokaal starten

1. Maak via
   [TMDB API settings](https://www.themoviedb.org/settings/api).
   een **API Read Access Token** (v4) of een **API Key** (v3) aan.
2. Kopieer `.env.example` naar `.env.local` en vul precies één van
   `TMDB_ACCESS_TOKEN` of `TMDB_API_KEY` in.
3. Installeer en start de app:

   ```bash
   npm install
   npm run dev
   ```

Open daarna <http://localhost:3000>.

## Docker

```bash
docker build -t filmfinder .
docker run --rm -p 3000:3000 -e TMDB_ACCESS_TOKEN=je_token filmfinder
```

De container draait als een niet-rootgebruiker op poort 3000.

### Docker Compose

Zet `TMDB_ACCESS_TOKEN` of `TMDB_API_KEY` in `.env.local` en voer uit:

```bash
docker compose --env-file .env.local up --build
```

## Vercel

Importeer deze repository in Vercel. Voeg vervolgens in **Settings → Environment
Variables** de variabele `TMDB_ACCESS_TOKEN` of `TMDB_API_KEY` toe voor
Production, Preview en Development. Vercel detecteert Next.js automatisch; een extra
`vercel.json`-bestand is niet nodig.

## Technologie

- Next.js (Node.js) en React
- TMDB API voor actuele filminformatie
- YouTube no-cookie embeds voor trailers
- Installeerbare PWA met FilmFinder-tabblad- en appicoon
- Lokale watchlist via browseropslag; niet gesynchroniseerd tussen apparaten
