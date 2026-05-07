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

interface Suggestion {
  title: string;
  author?: string;
}

export default function SubmitForm() {
  const [medium, setMedium] = useState<Medium | ''>('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [note, setNote] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [articleLink, setArticleLink] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [coverUrl, setCoverUrl] = useState('');
  const [coverOverride, setCoverOverride] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [coverConfirmed, setCoverConfirmed] = useState(false);
  const [canonicalTitle, setCanonicalTitle] = useState<string | null>(null);
  const [canonicalAuthor, setCanonicalAuthor] = useState<string | null>(null);
  const [coverSuggestions, setCoverSuggestions] = useState<Suggestion[]>([]);
  const [autoFilled, setAutoFilled] = useState(false);

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const justAppliedRef = useRef(false);

  // Voice-to-text
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (titleWrapRef.current && !titleWrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!title || !medium || coverOverride) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const wasJustApplied = justAppliedRef.current;
      justAppliedRef.current = false;

      setCoverLoading(true);
      setCoverFailed(false);
      setCoverUrl('');
      setCoverConfirmed(false);
      setCanonicalTitle(null);
      setCanonicalAuthor(null);
      setCoverSuggestions([]);
      setAutoFilled(false);
      try {
        const params = new URLSearchParams({ title, medium });
        const res = await fetch(`/api/cover?${params}`);
        const data = await res.json();
        if (data.url) setCoverUrl(data.url);
        else setCoverFailed(true);
        setCanonicalTitle(data.canonicalTitle ?? null);
        setCanonicalAuthor(data.canonicalAuthor ?? null);
        setCoverSuggestions(data.suggestions ?? []);
        if (!wasJustApplied && (data.canonicalTitle || data.suggestions?.length > 0)) {
          setDropdownOpen(true);
        }
      } catch {
        setCoverFailed(true);
      } finally {
        setCoverLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [title, medium, coverOverride]);

  function applySuggestion(s: Suggestion) {
    justAppliedRef.current = true;
    setTitle(s.title);
    if (s.author) setAuthor(s.author);
    setAutoFilled(true);
    setCoverOverride('');
    setCoverConfirmed(false);
    setCanonicalTitle(null);
    setCanonicalAuthor(null);
    setCoverSuggestions([]);
    setDropdownOpen(false);
  }

  function handleCoverConfirm(checked: boolean) {
    setCoverConfirmed(checked);
    if (checked && !autoFilled) {
      if (canonicalTitle && !title.trim()) setTitle(canonicalTitle);
      if (canonicalAuthor && !author.trim()) setAuthor(canonicalAuthor);
      if (canonicalTitle || canonicalAuthor) setAutoFilled(true);
    }
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

  const displayCover = coverOverride || coverUrl;
  const wordCount = countWords(note);

  // Dropdown items: canonical first, then additional suggestions (deduplicated)
  const dropdownItems: Suggestion[] = [];
  if (canonicalTitle) {
    dropdownItems.push({ title: canonicalTitle, author: canonicalAuthor ?? undefined });
  }
  for (const s of coverSuggestions) {
    if (!dropdownItems.find((d) => d.title.toLowerCase() === s.title.toLowerCase())) {
      dropdownItems.push(s);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!medium) e.medium = 'Select a medium';
    if (!title.trim()) e.title = 'Required';
    if (!author.trim()) e.author = 'Required';
    if (categories.length === 0) e.category = 'Select at least one category';
    if (displayCover && !coverConfirmed) e.cover = 'Please confirm this is the right cover';
    if (!note.trim()) {
      e.note = 'Required';
    } else if (wordCount < MIN_WORDS) {
      e.note = `Minimum ${MIN_WORDS} words — ${wordCount} written so far`;
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
    setMedium(''); setTitle(''); setAuthor(''); setCategories([]);
    setNote(''); setContributorName(''); setArticleLink(''); setAccessCode('');
    setCoverUrl(''); setCoverOverride(''); setCoverFailed(false); setCoverConfirmed(false);
    setCanonicalTitle(null); setCanonicalAuthor(null); setCoverSuggestions([]);
    setAutoFilled(false); setErrors({}); setSuccess(false); setDropdownOpen(false);
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
        {/* 2. Title — live dropdown */}
        <div ref={titleWrapRef} className="relative">
          <label className={LABEL}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setAutoFilled(false);
              if (!e.target.value.trim()) setDropdownOpen(false);
            }}
            onFocus={() => {
              if (dropdownItems.length > 0) setDropdownOpen(true);
            }}
            placeholder="Enter title…"
            className={FIELD}
            autoComplete="off"
          />
          {coverLoading && (
            <p className="mt-1.5 text-xs text-text-muted">Searching…</p>
          )}
          {dropdownOpen && dropdownItems.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-surface border border-[rgba(240,236,228,0.15)] shadow-xl overflow-hidden">
              {dropdownItems.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(item);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-copper/10 transition-colors border-b border-[rgba(240,236,228,0.08)] last:border-b-0"
                >
                  <span className="text-text">{item.title}</span>
                  {item.author && (
                    <span className="text-text-muted text-xs ml-2">by {item.author}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {errors.title && <p className={ERR}>{errors.title}</p>}
        </div>

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
                  {coverFailed ? 'Not found' : 'Auto-fetched'}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-text-muted leading-relaxed">
                Auto-fetched from Open Library (books) or TMDB (film/TV) as you type.
              </p>
              {displayCover && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={coverConfirmed}
                    onChange={(e) => handleCoverConfirm(e.target.checked)}
                    style={{ accentColor: '#b87333', width: 14, height: 14 }}
                  />
                  <span className="text-xs text-text-muted">Is this the right cover?</span>
                </label>
              )}
              {errors.cover && <p className={ERR}>{errors.cover}</p>}
              {(coverFailed || displayCover) && (
                <div>
                  <input
                    type="url"
                    value={coverOverride}
                    onChange={(e) => {
                      setCoverOverride(e.target.value);
                      setCoverConfirmed(false);
                    }}
                    placeholder="Paste a different image URL…"
                    className={`${FIELD} text-xs`}
                  />
                  {coverOverride && (
                    <button
                      type="button"
                      onClick={() => { setCoverOverride(''); setCoverConfirmed(false); }}
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

        {/* 8. Access Code */}
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
