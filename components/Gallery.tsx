'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Entry, Category } from '@/lib/types';
import EntryCard from './EntryCard';
import FilterBar from './FilterBar';

const STORAGE_KEY = 'gallery-filters';

export default function Gallery({ entries }: { entries: Entry[] }) {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [medium, setMedium] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const f = JSON.parse(saved);
        setSearch(f.search || '');
        setCategories(f.categories || []);
        setMedium(f.medium || '');
        setSort(f.sort || 'newest');
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ search, categories, medium, sort }));
    } catch {}
  }, [search, categories, medium, sort, hydrated]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (categories.length > 0 && !categories.some((cat) => e.category.includes(cat as Category))) return false;
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
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sort === 'newest' ? diff : -diff;
      });
  }, [entries, search, categories, medium, sort]);

  const hasFilters = !!(search || categories.length > 0 || medium);

  return (
    <div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        onCategoriesChange={setCategories}
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
                setCategories([]);
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
