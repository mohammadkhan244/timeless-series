'use client';

import { useState, useEffect, useRef } from 'react';
import { CATEGORIES, MEDIUMS } from '@/lib/categories';
import type { Category, Medium } from '@/lib/types';

const MIN_WORDS = 200;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const FIELD =
  'w-full bg-input border border-[rgba(240,236,228,0.15)] text-text placeholder:text-text-muted px-4 py-3 text-sm focus:outline-none focus:border-copper/60 transition-colors';
const LABEL = 'block text-[11px] uppercase tracking-widest text-text-muted mb-2';
const ERR = 'mt-1.5 text-xs text-red-400';

interface CoverMatch {
  title: string;
  author?: string;
  year?: string;
  coverUrl: string | null;
}

export default function SubmitForm() {
  const [medium, setMedium] = useState<Medium | ''>('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [note, setNote] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [articleLink, setArticleLink] = useState('');

  const [coverMatches, setCoverMatches] = useState<CoverMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<CoverMatch | null>(null);
  const [coverOverride, setCoverOverride] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);

  // Voice-to-text
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const justSelectedRef = useRef(false);
  const authorRef = useRef('');
  const lastAutoFilledAuthorRef = useRef('');
  useEffect(() => { authorRef.current = author; }, [author]);

  useEffect(() => {
    setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!title.trim() || !medium) {
      setCoverMatches([]);
      setCoverLoading(false);
      return;
    }
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    debounce.current = setTimeout(async () => {
      setCoverLoading(true);
      setCoverMatches([]);
      try {
        const params = new URLSearchParams({ title, medium });
        const res = await fetch(`/api/cover?${params}`);
        const data = await res.json();
        const matches: CoverMatch[] = data.matches ?? [];
        setCoverMatches(matches);
        // Auto-fill author from first result if field is still empty
        const firstAuthor = matches[0]?.author;
        // Auto-fill if author is empty or still matches what we last auto-filled
        if (firstAuthor && (!authorRef.current || authorRef.current === lastAutoFilledAuthorRef.current)) {
          setAuthor(firstAuthor);
          lastAutoFilledAuthorRef.current = firstAuthor;
        }
      } catch {
        setCoverMatches([]);
      } finally {
        setCoverLoading(false);
      }
    }, 600);
    return () => clearTimeout(debounce.current);
  }, [title, medium]);

  function selectMatch(match: CoverMatch) {
    justSelectedRef.current = true;
    setSelectedMatch(match);
    setTitle(match.title);
    if (match.author) {
      setAuthor(match.author);
      lastAutoFilledAuthorRef.current = match.author;
    }
    setCoverOverride('');
  }

  function toggleCategory(cat: Category) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r) => r[0].transcript)
        .join('');
      setNote((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }

  const displayCover = coverOverride || selectedMatch?.coverUrl || null;
  const wordCount = countWords(note);
  const noResults = !coverLoading && title.trim() !== '' && medium !== '' && coverMatches.length === 0;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!medium) e.medium = 'Select a medium';
    if (!title.trim()) e.title = 'Required';
    if (!author.trim()) e.author = 'Required';
    if (categories.length === 0) e.category = 'Select at least one category';
    if (!note.trim()) {
      e.note = 'Required';
    } else if (wordCount < MIN_WORDS) {
      e.note = `Minimum ${MIN_WORDS} words — ${wordCount} written so far`;
    }
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
          cover_image: coverOverride.trim() || selectedMatch?.coverUrl || null,
          timelessness_note: note.trim(),
          contributor_name: contributorName.trim() || 'Anonymous',
          article_link: articleLink.trim() || null,
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
    setMedium(''); setTitle(''); setAuthor(''); setCategories([]);
    setNote(''); setContributorName(''); setArticleLink('');
    setCoverMatches([]); setSelectedMatch(null); setCoverOverride(''); setCoverLoading(false);
    lastAutoFilledAuthorRef.current = '';
    setErrors({}); setSuccess(false);
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
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

      {/* 1. Medium */}
      <div>
        <label className={LABEL}>Medium</label>
        <select
          value={medium}
          onChange={(e) => setMedium(e.target.value as Medium)}
          className={`${FIELD} cursor-pointer`}
        >
          <option value="">Is it a book, film, or TV show?</option>
          {MEDIUMS.map((m) => (
            <option key={m} value={m}>
              {m === 'tv show' ? 'TV Show' : m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        {errors.medium && <p className={ERR}>{errors.medium}</p>}
      </div>

      {/* Fields 2–8: locked until medium is chosen */}
      <div
        className={`space-y-8 transition-opacity duration-300 ${
          !medium ? 'opacity-30 pointer-events-none select-none' : ''
        }`}
      >
        {/* 2. Title */}
        <div>
          <label className={LABEL}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSelectedMatch(null);
              // If author was auto-filled and not manually edited, clear it so the
              // next search result can auto-fill again
              if (authorRef.current === lastAutoFilledAuthorRef.current) {
                setAuthor('');
                lastAutoFilledAuthorRef.current = '';
              }
            }}
            placeholder="Enter title…"
            className={FIELD}
            autoComplete="off"
          />
          {coverLoading && (
            <p className="mt-1.5 text-xs text-text-muted">Searching…</p>
          )}
          {errors.title && <p className={ERR}>{errors.title}</p>}
        </div>

        {/* Cover grid — appears when matches are available */}
        {coverMatches.length > 0 && (
          <div>
            <p className={LABEL}>Select a cover</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {coverMatches.map((match, i) => {
                const isSelected =
                  selectedMatch?.coverUrl === match.coverUrl &&
                  selectedMatch?.title === match.title;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectMatch(match)}
                    className="group text-left"
                  >
                    <div
                      className={`relative aspect-[2/3] overflow-hidden bg-input border-2 transition-colors ${
                        isSelected
                          ? 'border-copper'
                          : 'border-transparent group-hover:border-copper/40'
                      }`}
                    >
                      {match.coverUrl && (
                        <img
                          src={match.coverUrl}
                          alt={match.title}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-copper/10 pointer-events-none" />
                      )}
                    </div>
                    <p className="text-[10px] text-text mt-1 leading-tight line-clamp-2">
                      {match.title}
                    </p>
                    {match.year && (
                      <p className="text-[10px] text-text-muted">{match.year}</p>
                    )}
                    {match.author && (
                      <p className="text-[10px] text-text-muted truncate">{match.author}</p>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedMatch && (
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="mt-3 text-[11px] text-text-muted hover:text-copper transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

        {/* 3. Author */}
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

        {/* 4. Cover */}
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
                  {noResults ? 'Not found' : 'Auto-fetched'}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              {selectedMatch ? (
                <div>
                  <p className="text-xs text-text leading-snug">{selectedMatch.title}</p>
                  {selectedMatch.author && (
                    <p className="text-xs text-text-muted">by {selectedMatch.author}</p>
                  )}
                  {selectedMatch.year && (
                    <p className="text-xs text-text-muted">{selectedMatch.year}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted leading-relaxed">
                  {coverMatches.length > 0
                    ? 'Select a cover from the grid above, or paste a URL.'
                    : noResults
                    ? 'No cover found automatically.'
                    : 'Auto-fetched from Open Library (books) or TMDB (film/TV) as you type.'}
                </p>
              )}
              <input
                type="url"
                value={coverOverride}
                onChange={(e) => {
                  setCoverOverride(e.target.value);
                  if (e.target.value) setSelectedMatch(null);
                }}
                placeholder="Paste a different image URL…"
                className={`${FIELD} text-xs`}
              />
              {coverOverride && (
                <button
                  type="button"
                  onClick={() => setCoverOverride('')}
                  className="text-[11px] text-text-muted hover:text-copper transition-colors"
                >
                  Clear URL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. Category */}
        <div>
          <label className={LABEL}>
            Category{' '}
            <span className="normal-case tracking-normal">(select all that apply)</span>
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

        {/* 6. Why it belongs here — 200-word min + voice-to-text */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <label className={`${LABEL} mb-0`}>Why it belongs here</label>
              <p className="text-xs text-text-muted mt-1">
                What human moment does it prepare someone for?
              </p>
            </div>
            <span
              className={`text-xs tabular-nums shrink-0 ml-4 mt-0.5 transition-colors ${
                wordCount >= MIN_WORDS ? 'text-copper' : 'text-text-muted'
              }`}
            >
              {wordCount} / {MIN_WORDS}
            </span>
          </div>
          <div className="relative">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Minimum ${MIN_WORDS} words. Why does this stay with you? What does it illuminate about being human?`}
              rows={7}
              className={`${FIELD} resize-y pb-10 ${listening ? 'border-copper/60' : ''}`}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                title={listening ? 'Stop recording' : 'Dictate your answer'}
                className={`absolute bottom-3 right-3 p-2 transition-colors ${
                  listening
                    ? 'text-copper animate-pulse'
                    : 'text-text-muted hover:text-copper'
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              </button>
            )}
          </div>
          {listening && (
            <p className="mt-1.5 text-xs text-copper">Listening — speak now</p>
          )}
          {errors.note && <p className={ERR}>{errors.note}</p>}
        </div>

        {/* 7. Optional fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={LABEL}>
              Your Name{' '}
              <span className="normal-case tracking-normal">(optional)</span>
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
              <span className="normal-case tracking-normal">(optional)</span>
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
