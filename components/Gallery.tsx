'use client';

import { useState, useMemo } from 'react';
import type { Entry } from '@/lib/types';
import EntryCard from './EntryCard';
import FilterBar from './FilterBar';

export default function Gallery({ entries }: { entries: Entry[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [medium, setMedium] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (category && !e.category.includes(category as import('@/lib/types').Category)) return false;
        if (medium && e.medium !== medium) return false;
        if (search.trim()) {
          const s = search.toLowerCase();
          return (
            e.title.toLowerCase().includes(s) ||
            e.author.toLowerCase().includes(s) ||
            e.category.some((cat) => cat.toLowerCase().includes(s)) ||
            e.contributor_name.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const diff =
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sort === 'newest' ? diff : -diff;
      });
  }, [entries, search, category, medium, sort]);

  const hasFilters = !!(search || category || medium);

  return (
    <div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        medium={medium}
        onMediumChange={setMedium}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-text-muted">
          <p className="font-serif text-xl">
            {entries.length === 0 ? 'No entries yet.' : 'No entries match your filters.'}
          </p>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setMedium('');
              }}
              className="mt-5 text-sm text-copper hover:text-copper-light transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
