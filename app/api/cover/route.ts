import { NextResponse } from 'next/server';

export interface CoverResult {
  url: string | null;
  canonicalTitle: string | null;
  canonicalAuthor: string | null;
  suggestions: Array<{ title: string; author?: string }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const medium = searchParams.get('medium');

  const empty: CoverResult = { url: null, canonicalTitle: null, canonicalAuthor: null, suggestions: [] };

  if (!title || !medium) return NextResponse.json(empty);

  try {
    if (medium === 'book') {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5&fields=title,author_name,cover_i`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return NextResponse.json(empty);
      const data = await res.json();
      const docs: Array<{ title?: string; author_name?: string[]; cover_i?: number }> =
        data.docs ?? [];

      const first = docs[0];
      const url = first?.cover_i
        ? `https://covers.openlibrary.org/b/id/${first.cover_i}-L.jpg`
        : null;

      return NextResponse.json<CoverResult>({
        url,
        canonicalTitle: first?.title ?? null,
        canonicalAuthor: first?.author_name?.[0] ?? null,
        suggestions: docs
          .slice(1)
          .filter((d) => d.title)
          .slice(0, 3)
          .map((d) => ({ title: d.title!, author: d.author_name?.[0] })),
      });
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
    const results: Array<{ title?: string; name?: string; poster_path?: string }> =
      data.results ?? [];

    const first = results[0];
    const firstTitle = first?.title ?? first?.name ?? null;
    const url = first?.poster_path
      ? `https://image.tmdb.org/t/p/w500${first.poster_path}`
      : null;

    return NextResponse.json<CoverResult>({
      url,
      canonicalTitle: firstTitle,
      canonicalAuthor: null,
      suggestions: results
        .slice(1)
        .filter((r) => r.title || r.name)
        .slice(0, 3)
        .map((r) => ({ title: (r.title ?? r.name)! })),
    });
  } catch {
    return NextResponse.json(empty);
  }
}
