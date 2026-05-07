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
    <div className="space-y-3 mb-10">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by title, author, or category…"
        className="w-full bg-input border border-[rgba(240,236,228,0.15)] text-text placeholder:text-text-muted px-4 py-3 text-sm focus:outline-none focus:border-copper/50 transition-colors"
      />

      {/* Medium pills — always a single scrollable row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => onMediumChange('')}
          className={`text-[11px] px-3 py-2 uppercase tracking-widest border transition-colors whitespace-nowrap flex-shrink-0 ${
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
            className={`text-[11px] px-3 py-2 uppercase tracking-widest border transition-colors whitespace-nowrap flex-shrink-0 ${
              medium === m
                ? 'border-copper text-copper bg-copper/10'
                : 'border-border text-text-muted hover:border-copper/40 hover:text-text'
            }`}
          >
            {MEDIUM_DISPLAY[m]}
          </button>
        ))}
      </div>

      {/* Category + Sort + Count — wraps on mobile */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="flex-1 min-w-0 bg-input border border-[rgba(240,236,228,0.15)] text-sm text-text px-3 py-2 focus:outline-none focus:border-copper/50 cursor-pointer transition-colors"
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
          className="bg-input border border-[rgba(240,236,228,0.15)] text-sm text-text px-3 py-2 focus:outline-none focus:border-copper/50 cursor-pointer transition-colors"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>

        <span className="text-xs text-text-muted ml-auto whitespace-nowrap">
          {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    </div>
  );
}
