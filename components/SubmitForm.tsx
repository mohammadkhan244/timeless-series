'use client';

import { useState, useEffect, useRef } from 'react';
import { CATEGORIES, MEDIUMS } from '@/lib/categories';
import type { Category, Medium } from '@/lib/types';

function countSentences(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 2).length;
}

const FIELD =
  'w-full bg-input border border-[rgba(240,236,228,0.15)] text-text placeholder:text-text-muted px-4 py-3 text-sm focus:outline-none focus:border-copper/60 transition-colors';
const LABEL = 'block text-[11px] uppercase tracking-widest text-text-muted mb-2';
const ERR = 'mt-1.5 text-xs text-red-400';

interface Suggestion {
  title: string;
  author?: string;
}

export default function SubmitForm() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [medium, setMedium] = useState<Medium | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [note, setNote] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [articleLink, setArticleLink] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [coverUrl, setCoverUrl] = useState('');
  const [coverOverride, setCoverOverride] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [canonicalTitle, setCanonicalTitle] = useState<string | null>(null);
  const [canonicalAuthor, setCanonicalAuthor] = useState<string | null>(null);
  const [coverSuggestions, setCoverSuggestions] = useState<Suggestion[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!title || !medium || coverOverride) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setCoverLoading(true);
      setCoverFailed(false);
      setCoverUrl('');
      setCanonicalTitle(null);
      setCanonicalAuthor(null);
      setCoverSuggestions([]);
      try {
        const params = new URLSearchParams({ title, medium });
        const res = await fetch(`/api/cover?${params}`);
        const data = await res.json();
        if (data.url) {
          setCoverUrl(data.url);
        } else {
          setCoverFailed(true);
        }
        setCanonicalTitle(data.canonicalTitle ?? null);
        setCanonicalAuthor(data.canonicalAuthor ?? null);
        setCoverSuggestions(data.suggestions ?? []);
      } catch {
        setCoverFailed(true);
      } finally {
        setCoverLoading(false);
      }
    }, 800);
    return () => clearTimeout(debounce.current);
  }, [title, medium, coverOverride]);

  function applySuggestion(s: Suggestion) {
    setTitle(s.title);
    if (s.author) setAuthor(s.author);
    setCoverOverride('');
    setCanonicalTitle(null);
    setCanonicalAuthor(null);
    setCoverSuggestions([]);
  }

  function toggleCategory(cat: Category) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const displayCover = coverOverride || coverUrl;
  const noteCount = countSentences(note);

  const titleDiffers =
    !coverLoading &&
    canonicalTitle &&
    title.trim() &&
    canonicalTitle.toLowerCase() !== title.toLowerCase().trim();

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Required';
    if (!author.trim()) e.author = 'Required';
    if (!medium) e.medium = 'Select a medium';
    if (categories.length === 0) e.category = 'Select at least one category';
    if (!note.trim()) {
      e.note = 'Required';
    } else if (noteCount < 2) {
      e.note = `Minimum 2 sentences — ${noteCount} counted`;
    }
    if (!accessCode.trim()) e.accessCode = 'Required';
    if (articleLink && !/^https?:\/\/.+/.test(articleLink)) {
      e.articleLink = 'Must be a valid URL starting with http(s)://';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          medium,
          category: categories,
          cover_image: coverOverride.trim() || coverUrl || null,
          timelessness_note: note.trim(),
          contributor_name: contributorName.trim() || 'Anonymous',
          article_link: articleLink.trim() || null,
          access_code: accessCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.error || 'Submission failed. Please try again.' });
      } else {
        setSuccess(true);
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle(''); setAuthor(''); setMedium(''); setCategories([]);
    setNote(''); setContributorName(''); setArticleLink(''); setAccessCode('');
    setCoverUrl(''); setCoverOverride(''); setCoverFailed(false);
    setCanonicalTitle(null); setCanonicalAuthor(null); setCoverSuggestions([]);
    setErrors({}); setSuccess(false);
  }

  if (success) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-2xl text-copper mb-3">Submitted for review.</p>
        <p className="text-text-muted">Your entry will appear in the gallery once approved.</p>
        <button
          onClick={resetForm}
          className="mt-8 text-sm text-copper border border-copper/30 px-6 py-2.5 hover:bg-copper/10 transition-colors"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.form && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errors.form}
        </div>
      )}

      {/* Title + Author */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={LABEL}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title…"
            className={FIELD}
          />
          {errors.title && <p className={ERR}>{errors.title}</p>}
        </div>
        <div>
          <label className={LABEL}>Author / Director / Creator</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter name…"
            className={FIELD}
          />
          {errors.author && <p className={ERR}>{errors.author}</p>}
        </div>
      </div>

      {/* Medium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={LABEL}>Medium</label>
          <select
            value={medium}
            onChange={(e) => setMedium(e.target.value as Medium)}
            className={`${FIELD} cursor-pointer`}
          >
            <option value="">Select medium…</option>
            {MEDIUMS.map((m) => (
              <option key={m} value={m}>
                {m === 'tv show' ? 'TV Show' : m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
          {errors.medium && <p className={ERR}>{errors.medium}</p>}
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className={LABEL}>Cover Image</label>
        <div className="flex gap-5">
          <div className="w-20 h-28 bg-input border border-[rgba(240,236,228,0.15)] flex-shrink-0 flex items-center justify-center overflow-hidden">
            {coverLoading ? (
              <span className="text-[10px] text-text-muted text-center px-1">Fetching…</span>
            ) : displayCover ? (
              <img src={displayCover} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-text-muted text-center px-1 leading-tight">
                {coverFailed ? 'Not found' : 'Auto-fetched'}
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-text-muted leading-relaxed">
              Cover is auto-fetched from Open Library (books) or TMDB (film/TV) when you enter a
              title and medium.
            </p>

            {/* Did you mean — title differs from canonical */}
            {titleDiffers && (
              <p className="text-xs text-text-muted">
                Did you mean{' '}
                <button
                  type="button"
                  onClick={() =>
                    applySuggestion({
                      title: canonicalTitle!,
                      author: canonicalAuthor ?? undefined,
                    })
                  }
                  className="text-copper hover:underline"
                >
                  &ldquo;{canonicalTitle}&rdquo;
                </button>
                {canonicalAuthor && ` by ${canonicalAuthor}`}?
              </p>
            )}

            {/* Did you mean — cover not found, show alternatives */}
            {!coverLoading && coverFailed && coverSuggestions.length > 0 && (
              <div className="text-xs text-text-muted space-y-0.5">
                <p>Did you mean:</p>
                {coverSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="block text-copper hover:underline text-left"
                  >
                    &ldquo;{s.title}&rdquo;{s.author && ` by ${s.author}`}
                  </button>
                ))}
              </div>
            )}

            {(coverFailed || displayCover) && (
              <div>
                <input
                  type="url"
                  value={coverOverride}
                  onChange={(e) => setCoverOverride(e.target.value)}
                  placeholder="Override with a custom image URL…"
                  className={`${FIELD} text-xs`}
                />
                {coverOverride && (
                  <button
                    type="button"
                    onClick={() => setCoverOverride('')}
                    className="mt-1.5 text-[11px] text-text-muted hover:text-copper transition-colors"
                  >
                    Clear override
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories — multi-select toggle pills */}
      <div>
        <label className={LABEL}>
          Category{' '}
          <span className="text-text-muted normal-case tracking-normal">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`text-[11px] px-3 py-1.5 border transition-colors ${
                  selected
                    ? 'border-copper text-copper bg-copper/10'
                    : 'border-[rgba(240,236,228,0.15)] text-text-muted hover:border-copper/40 hover:text-text'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
        {errors.category && <p className={ERR}>{errors.category}</p>}
      </div>

      {/* Combined note */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-text leading-snug">Why does this belong here?</p>
            <p className="text-sm text-text-muted leading-snug">
              What human moment does it prepare someone for?
            </p>
          </div>
          <span
            className={`text-xs shrink-0 ml-4 mt-0.5 transition-colors ${
              noteCount >= 2 ? 'text-copper' : 'text-text-muted'
            }`}
          >
            {noteCount} / 2 sentences
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Minimum 2 sentences."
          rows={5}
          className={`${FIELD} resize-y`}
        />
        {errors.note && <p className={ERR}>{errors.note}</p>}
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={LABEL}>
            Your Name{' '}
            <span className="text-text-muted normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            placeholder="Leave blank to stay anonymous"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL}>
            Article Link{' '}
            <span className="text-text-muted normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={articleLink}
            onChange={(e) => setArticleLink(e.target.value)}
            placeholder="https://…"
            className={FIELD}
          />
          {errors.articleLink && <p className={ERR}>{errors.articleLink}</p>}
        </div>
      </div>

      {/* Access Code */}
      <div>
        <label className={LABEL}>Access Code</label>
        <input
          type="password"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Enter access code to submit"
          className={FIELD}
          autoComplete="off"
        />
        {errors.accessCode && <p className={ERR}>{errors.accessCode}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-copper text-bg text-sm uppercase tracking-widest font-medium hover:bg-copper-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit for Review'}
      </button>
    </form>
  );
}
