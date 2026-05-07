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

export default function SubmitForm() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [medium, setMedium] = useState<Medium | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [timelessnessNote, setTimelessnessNote] = useState('');
  const [humanMoment, setHumanMoment] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [articleLink, setArticleLink] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [coverUrl, setCoverUrl] = useState('');
  const [coverOverride, setCoverOverride] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

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
      try {
        const params = new URLSearchParams({ title, medium });
        const res = await fetch(`/api/cover?${params}`);
        const data = await res.json();
        if (data.url) {
          setCoverUrl(data.url);
        } else {
          setCoverFailed(true);
        }
      } catch {
        setCoverFailed(true);
      } finally {
        setCoverLoading(false);
      }
    }, 800);
    return () => clearTimeout(debounce.current);
  }, [title, medium, coverOverride]);

  const displayCover = coverOverride || coverUrl;
  const tnCount = countSentences(timelessnessNote);
  const hmCount = countSentences(humanMoment);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Required';
    if (!author.trim()) e.author = 'Required';
    if (!medium) e.medium = 'Select a medium';
    if (!category) e.category = 'Select a category';
    if (!timelessnessNote.trim()) {
      e.timelessnessNote = 'Required';
    } else if (tnCount < 3) {
      e.timelessnessNote = `Minimum 3 sentences — ${tnCount} counted`;
    }
    if (!humanMoment.trim()) {
      e.humanMoment = 'Required';
    } else if (hmCount < 2) {
      e.humanMoment = `Minimum 2 sentences — ${hmCount} counted`;
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
          category,
          cover_image: coverOverride.trim() || coverUrl || null,
          timelessness_note: timelessnessNote.trim(),
          human_moment: humanMoment.trim(),
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
    setTitle(''); setAuthor(''); setMedium(''); setCategory('');
    setTimelessnessNote(''); setHumanMoment('');
    setContributorName(''); setArticleLink(''); setAccessCode('');
    setCoverUrl(''); setCoverOverride(''); setCoverFailed(false);
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

      {/* Medium + Category */}
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
        <div>
          <label className={LABEL}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={`${FIELD} cursor-pointer`}
          >
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <p className={ERR}>{errors.category}</p>}
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
          <div className="flex-1 space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">
              Cover is auto-fetched from Open Library (books) or TMDB (film/TV) when you enter a
              title and medium.
            </p>
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

      {/* Timelessness Note */}
      <div>
        <div className="flex items-end justify-between mb-2">
          <label className={`${LABEL} mb-0`}>Why It&apos;s Timeless</label>
          <span
            className={`text-xs transition-colors ${
              tnCount >= 3 ? 'text-copper' : 'text-text-muted'
            }`}
          >
            {tnCount} / 3 sentences
          </span>
        </div>
        <textarea
          value={timelessnessNote}
          onChange={(e) => setTimelessnessNote(e.target.value)}
          placeholder="Why does this work endure? What makes it timeless? Minimum 3 sentences."
          rows={5}
          className={`${FIELD} resize-y`}
        />
        {errors.timelessnessNote && <p className={ERR}>{errors.timelessnessNote}</p>}
      </div>

      {/* Human Moment */}
      <div>
        <div className="flex items-end justify-between mb-2">
          <label className={`${LABEL} mb-0`}>The Human Moment</label>
          <span
            className={`text-xs transition-colors ${
              hmCount >= 2 ? 'text-copper' : 'text-text-muted'
            }`}
          >
            {hmCount} / 2 sentences
          </span>
        </div>
        <p className="text-xs text-text-muted mb-2">
          Which category does this belong to, and what specific human moment does it prepare someone
          for?
        </p>
        <textarea
          value={humanMoment}
          onChange={(e) => setHumanMoment(e.target.value)}
          placeholder="Minimum 2 sentences."
          rows={4}
          className={`${FIELD} resize-y`}
        />
        {errors.humanMoment && <p className={ERR}>{errors.humanMoment}</p>}
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
