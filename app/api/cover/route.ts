import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const medium = searchParams.get('medium');

  if (!title || !medium) {
    return NextResponse.json({ url: null });
  }

  try {
    if (medium === 'book') {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=cover_i`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return NextResponse.json({ url: null });
      const data = await res.json();
      const coverId = data.docs?.[0]?.cover_i;
      if (coverId) {
        return NextResponse.json({ url: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` });
      }
      return NextResponse.json({ url: null });
    }

    // film or tv show → TMDB
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return NextResponse.json({ url: null });

    const searchType = medium === 'tv show' ? 'tv' : 'movie';
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${searchType}?query=${encodeURIComponent(title)}&api_key=${apiKey}&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ url: null });
    const data = await res.json();
    const posterPath = data.results?.[0]?.poster_path;
    if (posterPath) {
      return NextResponse.json({ url: `https://image.tmdb.org/t/p/w500${posterPath}` });
    }
    return NextResponse.json({ url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
