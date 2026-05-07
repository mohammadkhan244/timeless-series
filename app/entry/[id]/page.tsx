import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Entry } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MEDIUM_LABELS: Record<string, string> = {
  book: 'Book',
  film: 'Film',
  'tv show': 'TV Show',
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from('entries')
    .select('title, author')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (!data) return { title: 'Not Found' };
  return { title: `${data.title} by ${data.author}` };
}

export default async function EntryPage({ params }: Props) {
  const { id } = await params;
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  const entry = data as Entry | null;
  if (!entry) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="text-xs uppercase tracking-widest text-text-muted hover:text-copper transition-colors"
      >
        ← Gallery
      </Link>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-[260px,1fr] gap-12">
        {/* Left: cover + meta */}
        <div className="flex flex-col gap-5">
          <div className="w-full max-w-[260px] aspect-[2/3] bg-surface-2 border border-border overflow-hidden">
            {entry.cover_image ? (
              <img
                src={entry.cover_image}
                alt={entry.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl font-serif text-copper/20 select-none">
                  {entry.title[0]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] tracking-widest uppercase text-copper border border-copper/30 px-2 py-1">
                {MEDIUM_LABELS[entry.medium]}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entry.category.map((cat) => (
                <span key={cat} className="text-[11px] uppercase tracking-wide text-text-muted">
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              Contributed by{' '}
              <span className="text-text">{entry.contributor_name}</span>
            </p>
            <p className="text-xs text-text-muted">
              {new Date(entry.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {entry.article_link && (
              <a
                href={entry.article_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-copper hover:text-copper-light transition-colors"
              >
                Read the article →
              </a>
            )}
          </div>
        </div>

        {/* Right: main content */}
        <div className="space-y-10">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl text-text leading-tight">
              {entry.title}
            </h1>
            <p className="mt-3 text-lg text-text-muted">{entry.author}</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-widest text-copper">
              Why It Belongs Here
            </h2>
            <p className="text-text leading-relaxed text-base">{entry.timelessness_note}</p>
          </section>

          {entry.human_moment && (
            <>
              <div className="border-t border-border" />
              <section className="space-y-3">
                <h2 className="text-[10px] uppercase tracking-widest text-copper">
                  The Human Moment
                </h2>
                <p className="text-text leading-relaxed text-base">{entry.human_moment}</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
