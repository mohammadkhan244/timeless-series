import { NextResponse } from 'next/server';

export interface CoverMatch {
  title: string;
  author?: string;
  year?: string;
  coverUrl: string | null;
}

export interface CoverResult {
  matches: CoverMatch[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const medium = searchParams.get('medium');

  const empty: CoverResult = { matches: [] };

  if (!title || !medium) return NextResponse.json(empty);

  try {
    if (medium === 'book') {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=15&fields=title,author_name,cover_i,first_publish_year`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return NextResponse.json(empty);
      const data = await res.json();
      const docs: Array<{
        title?: string;
        author_name?: string[];
        cover_i?: number;
        first_publish_year?: number;
      }> = data.docs ?? [];

      const matches: CoverMatch[] = docs
        .filter((d) => d.cover_i && d.title)
        .slice(0, 8)
        .map((d) => ({
          title: d.title!,
          author: d.author_name?.[0],
          year: d.first_publish_year?.toString(),
          coverUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
        }));

      return NextResponse.json<CoverResult>({ matches });
    }

    // film or tv show → TMDB
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return NextResponse.json(empty);

    const searchType = medium === 'tv show' ? 'tv' : 'movie';
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${searchType}?query=${encodeURIComponent(title)}&api_key=${apiKey}&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json(empty);
    const data = await res.json();
    const results: Array<{
      id?: number;
      title?: string;
      name?: string;
      poster_path?: string;
      release_date?: string;
      first_air_date?: string;
    }> = data.results ?? [];

    const candidates = results
      .filter((r) => r.poster_path && (r.title || r.name))
      .slice(0, 8);

    // Fetch director/creator for each result in parallel
    const creatorNames = await Promise.allSettled(
      candidates.map(async (r) => {
        if (!r.id) return null;
        if (searchType === 'movie') {
          const credRes = await fetch(
            `https://api.themoviedb.org/3/movie/${r.id}/credits?api_key=${apiKey}`,
            { next: { revalidate: 3600 } }
          );
          const cred = await credRes.json();
          return (
            cred.crew?.find((c: { job: string }) => c.job === 'Director')?.name ?? null
          );
        } else {
          const detRes = await fetch(
            `https://api.themoviedb.org/3/tv/${r.id}?api_key=${apiKey}`,
            { next: { revalidate: 3600 } }
          );
          const det = await detRes.json();
          const creators: Array<{ name: string }> = det.created_by ?? [];
          return creators.length > 0 ? creators.map((c) => c.name).join(', ') : null;
        }
      })
    );

    const matches: CoverMatch[] = candidates.map((r, i) => ({
      title: (r.title ?? r.name)!,
      year: (r.release_date ?? r.first_air_date)?.slice(0, 4),
      coverUrl: `https://image.tmdb.org/t/p/w500${r.poster_path}`,
      author:
        creatorNames[i].status === 'fulfilled'
          ? (creatorNames[i].value ?? undefined)
          : undefined,
    }));

    return NextResponse.json<CoverResult>({ matches });
  } catch {
    return NextResponse.json(empty);
  }
}
