'use client';

import { useState, useEffect } from 'react';
import type { Contribution } from '@/lib/types';

const FIELD =
  'w-full bg-input border border-[rgba(240,236,228,0.15)] text-text placeholder:text-text-muted px-4 py-3 text-sm focus:outline-none focus:border-copper/60 transition-colors';
const LABEL = 'block text-[11px] uppercase tracking-widest text-text-muted mb-2';
const ERR = 'mt-1.5 text-xs text-red-400';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ContributionSection({ entryId }: { entryId: string }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/${entryId}/notes`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setContributions(data);
      })
      .catch(() => {});
  }, [entryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) { setError('Note is required'); return; }
    if (!accessCode.trim()) { setError('Access code is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/entries/${entryId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note,
          contributor_name: name,
          access_code: accessCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed');
      } else {
        setContributions((prev) => [...prev, data]);
        setNote(''); setName(''); setAccessCode('');
        setSuccess(true);
        setShowForm(false);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-t border-border" />

      {/* Existing contributions */}
      {contributions.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-[10px] uppercase tracking-widest text-copper">
            More Perspectives
          </h2>
          {contributions.map((c) => (
            <div key={c.id} className="space-y-1.5">
              <p className="text-text leading-relaxed text-sm">{c.note}</p>
              <p className="text-[11px] text-text-muted">
                {c.contributor_name} · {formatDate(c.created_at)}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Success message */}
      {success && (
        <p className="text-sm text-copper">Your perspective has been added.</p>
      )}

      {/* Toggle form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-text-muted hover:text-copper transition-colors border border-border hover:border-copper/30 px-4 py-2"
        >
          + Add your perspective
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-widest text-copper">
            Add Your Perspective
          </h2>

          {error && <p className={ERR}>{error}</p>}

          <div>
            <label className={LABEL}>Why this belongs here</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Share your perspective…"
              rows={4}
              className={`${FIELD} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                Your name{' '}
                <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                className={FIELD}
              />
            </div>
            <div>
              <label className={LABEL}>Access Code</label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className={FIELD}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-copper text-bg text-xs uppercase tracking-widest hover:bg-copper-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="text-xs text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
