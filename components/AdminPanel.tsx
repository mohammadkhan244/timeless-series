'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Entry } from '@/lib/types';

const MEDIUM_LABELS: Record<string, string> = {
  book: 'Book',
  film: 'Film',
  'tv show': 'TV Show',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminPanel() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/entries');
      if (!res.ok) throw new Error('Unauthorized or server error');
      const data = await res.json();
      setEntries(data);
    } catch {
      setFetchError('Failed to load entries. Check your session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function updateStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } catch {
      alert('Failed to update entry. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const pending = entries.filter((e) => e.status === 'pending');
  const approved = entries.filter((e) => e.status === 'approved');
  const rejected = entries.filter((e) => e.status === 'rejected');
  const displayed = tab === 'pending' ? pending : entries;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        Loading entries…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-24">
        <p className="text-red-400 text-sm">{fetchError}</p>
        <button
          onClick={fetchEntries}
          className="mt-4 text-sm text-copper hover:text-copper-light transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-2xl text-text">Admin Panel</h1>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-yellow-400">{pending.length} pending</span>
            <span className="text-border">·</span>
            <span className="text-green-400">{approved.length} approved</span>
            <span className="text-border">·</span>
            <span className="text-red-400/70">{rejected.length} rejected</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-text-muted hover:text-text transition-colors uppercase tracking-widest"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-copper text-copper'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {t === 'pending' ? `Pending (${pending.length})` : `All Entries (${entries.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-sm">
          {tab === 'pending' ? 'No pending entries.' : 'No entries yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((entry) => (
            <div
              key={entry.id}
              className="bg-surface border border-border p-4 transition-colors hover:border-border"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-10 h-14 bg-surface-2 border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {entry.cover_image ? (
                    <img
                      src={entry.cover_image}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-copper/30 font-serif text-base">{entry.title[0]}</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-serif text-text text-sm leading-tight truncate">
                        {entry.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{entry.author}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-widest text-copper/70 border border-copper/20 px-1.5 py-0.5">
                          {MEDIUM_LABELS[entry.medium]}
                        </span>
                        <span className="text-[11px] text-text-muted">{entry.category}</span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        By {entry.contributor_name} · {formatDate(entry.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      {entry.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(entry.id, 'approved')}
                            disabled={updating === entry.id}
                            className="text-[11px] px-3 py-1.5 bg-copper text-bg hover:bg-copper-light transition-colors disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(entry.id, 'rejected')}
                            disabled={updating === entry.id}
                            className="text-[11px] px-3 py-1.5 bg-transparent text-red-400 border border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {entry.status === 'approved' && (
                        <>
                          <span className="text-[11px] text-copper">Approved</span>
                          <button
                            onClick={() => updateStatus(entry.id, 'rejected')}
                            disabled={updating === entry.id}
                            className="text-[11px] text-text-muted hover:text-red-400 transition-colors disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {entry.status === 'rejected' && (
                        <>
                          <span className="text-[11px] text-red-400/70">Rejected</span>
                          <button
                            onClick={() => updateStatus(entry.id, 'approved')}
                            disabled={updating === entry.id}
                            className="text-[11px] text-text-muted hover:text-copper transition-colors disabled:opacity-40"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === entry.id ? null : entry.id)
                        }
                        className="text-[11px] text-text-muted hover:text-copper transition-colors"
                      >
                        {expandedId === entry.id ? 'Close' : 'Preview'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable preview */}
              {expandedId === entry.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4 ml-14">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-copper/60 mb-1.5">
                      Why It&apos;s Timeless
                    </p>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {entry.timelessness_note}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-copper/60 mb-1.5">
                      The Human Moment
                    </p>
                    <p className="text-sm text-text-muted leading-relaxed">{entry.human_moment}</p>
                  </div>
                  {entry.article_link && (
                    <a
                      href={entry.article_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-copper hover:text-copper-light transition-colors"
                    >
                      Article link →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
