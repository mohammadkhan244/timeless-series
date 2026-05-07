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
  categories: string[];
  onCategoriesChange: (v: string[]) => void;
  medium: string;
  onMediumChange: (v: string) => void;
  sort: 'newest' | 'oldest';
  onSortChange: (v: 'newest' | 'oldest') => void;
  resultCount: number;
}

export default function FilterBar({
  search,
  onSearchChange,
  categories,
  onCategoriesChange,
  medium,
  onMediumChange,
  sort,
  onSortChange,
  resultCount,
}: Props) {
  function toggleCategory(cat: string) {
    onCategoriesChange(
      categories.includes(cat) ? categories.filter((c) => c !== cat) : [...categories, cat]
    );
  }

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

      {/* Medium pills */}
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

      {/* Category pills — wrapping multi-select */}
      <div className="flex flex-wrap gap-1.5">
        {categories.length > 0 && (
          <button
            onClick={() => onCategoriesChange([])}
            className="text-[11px] px-3 py-2 border border-border text-text-muted hover:border-copper/40 hover:text-text transition-colors"
          >
            Clear
          </button>
        )}
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`text-[11px] px-3 py-2 border transition-colors ${
              categories.includes(cat)
                ? 'border-copper text-copper bg-copper/10'
                : 'border-border text-text-muted hover:border-copper/40 hover:text-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort + Count */}
      <div className="flex items-center gap-3">
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
