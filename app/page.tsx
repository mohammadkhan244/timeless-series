import { supabase } from '@/lib/supabase';
import Gallery from '@/components/Gallery';
import type { Entry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  const entries = (data as Entry[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="mb-8 sm:mb-14 max-w-xl">
        <h1 className="font-serif text-3xl sm:text-5xl text-text leading-tight mb-3">
          The Timeless Series
        </h1>
        <p className="text-text-muted leading-relaxed">
          A curated gallery of books, films, and TV shows — organized not by genre, but by the
          human experiences they illuminate.
        </p>
      </div>

      <Gallery entries={entries} />
    </div>
  );
}
