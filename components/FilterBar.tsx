'use client';

import { CATEGORIES, MEDIUMS } from '@/lib/categories';

const MEDIUM_DISPLAY: Record<string, string> = {
  book: 'Book',
  film: 'Film',
  'tv show': 'TV',
};

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  medium: string;
  onMediumChange: (v: string) => void;
  sort: 'newest' | 'oldest';
  onSortChange: (v: 'newest' | 'oldest') => void;
  resultCount: number;
}

export default function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  medium,
  onMediumChange,
  sort,
  onSortChange,
  resultCount,
}: Props) {
  return (
    <div className="space-y-4 mb-10">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by title, author, or category…"
        className="w-full bg-input border border-[rgba(240,236,228,0.15)] text-text placeholder:text-text-muted px-4 py-3 text-sm focus:outline-none focus:border-copper/50 transition-colors"
      />

      <div className="flex flex-wrap items-center gap-3">
        {/* Medium pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onMediumChange('')}
            className={`text-[11px] px-3 py-1.5 uppercase tracking-widest border transition-colors ${
              medium === ''
                ? 'border-copper text-copper'
                : 'border-border text-text-muted hover:border-copper/40 hover:text-text'
            }`}
          >
            All
          </button>
          {MEDIUMS.map((m) => (
            <button
              key={m}
              onClick={() => onMediumChange(medium === m ? '' : m)}
              className={`text-[11px] px-3 py-1.5 uppercase tracking-widest border transition-colors ${
                medium === m
                  ? 'border-copper text-copper bg-copper/10'
                  : 'border-border text-text-muted hover:border-copper/40 hover:text-text'
              }`}
            >
              {MEDIUM_DISPLAY[m]}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border hidden sm:block" />

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-input border border-[rgba(240,236,228,0.15)] text-sm text-text px-3 py-1.5 focus:outline-none focus:border-copper/50 cursor-pointer transition-colors"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
          className="bg-input border border-[rgba(240,236,228,0.15)] text-sm text-text px-3 py-1.5 focus:outline-none focus:border-copper/50 cursor-pointer transition-colors"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <span className="text-xs text-text-muted ml-auto">
          {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    </div>
  );
}
