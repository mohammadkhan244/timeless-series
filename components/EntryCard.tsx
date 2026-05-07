'use client';

import Link from 'next/link';
import type { Entry } from '@/lib/types';

const MEDIUM_LABELS: Record<string, string> = {
  book: 'Book',
  film: 'Film',
  'tv show': 'TV Show',
};

export default function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Link href={`/entry/${entry.id}`} className="group block">
      <div className="bg-surface border border-border overflow-hidden transition-all duration-300 hover:border-copper/50 hover:shadow-xl hover:shadow-copper/5 hover:-translate-y-0.5 h-full flex flex-col">
        {/* Cover */}
        <div className="relative aspect-[2/3] overflow-hidden bg-surface-2 flex-shrink-0">
          {entry.cover_image ? (
            <img
              src={entry.cover_image}
              alt={entry.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl font-serif text-copper/20 select-none">
                {entry.title[0]}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] tracking-widest uppercase px-2 py-1 bg-bg/85 text-copper backdrop-blur-sm">
              {MEDIUM_LABELS[entry.medium]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-serif text-base text-text leading-snug group-hover:text-copper transition-colors line-clamp-2">
            {entry.title}
          </h3>
          <p className="text-xs text-text-muted leading-snug">{entry.author}</p>
          <p className="text-[11px] text-copper/70 uppercase tracking-wide leading-tight">
            {entry.category[0]}
            {entry.category.length > 1 && (
              <span className="text-text-muted"> +{entry.category.length - 1}</span>
            )}
          </p>
          <div className="mt-auto pt-3 border-t border-border">
            <p className="text-[11px] text-text-muted">
              {entry.contributor_name === 'Anonymous'
                ? 'Anonymous'
                : `By ${entry.contributor_name}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
