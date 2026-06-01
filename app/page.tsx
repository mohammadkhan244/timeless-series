import Link from 'next/link';
import CategoryCard from '@/components/CategoryCard';

const STAR_PATH =
  'M 256 76 L 290 222 L 436 256 L 290 290 L 256 436 L 222 290 L 76 256 L 222 222 Z';

const CATEGORIES = [
  {
    name: 'How to Think',
    moment:
      "When your mind is clouded, deceived, or overwhelmed and clarity feels impossible",
  },
  {
    name: 'How to Survive',
    moment:
      "When the world breaks you open and you need proof that others endured worse and rebuilt",
  },
  {
    name: 'How to Thrive & Build',
    moment:
      "When you're ready to make something and need models of people who built from nothing",
  },
  {
    name: 'How to Love & Be Loved',
    moment:
      "When love is new, failing, lost, or misunderstood and you need to understand it more deeply",
  },
  {
    name: 'How to Grieve & Face Loss',
    moment: "When someone or something is gone and you don't know how to carry it",
  },
  {
    name: 'How to Know Yourself',
    moment:
      "When you don't know who you are, where you belong, or what you actually believe",
  },
  {
    name: 'How to Be Human & Kind',
    moment:
      "When you've forgotten that other people are as complex and fragile as you are",
  },
  {
    name: 'How to Lead & Serve',
    moment:
      "When others are depending on you and you don't know how to hold that weight",
  },
  {
    name: 'How to Stay Alive Inside',
    moment:
      "When life feels flat, meaningless, or unlively and you've forgotten how to wonder",
  },
  {
    name: 'How to Face Power & Injustice',
    moment:
      "When systems are stacked against you and you need to know how to move, survive, or dismantle them",
  },
] as const;

function StarMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" fill="none">
      <path d={STAR_PATH} fill="#b87333" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* ── 1. HERO ── */}
      <section className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center text-center px-6">
        <StarMark size={88} />

        <h1
          className="font-serif text-5xl sm:text-7xl text-copper mt-10 mb-6"
          style={{ letterSpacing: '0.22em' }}
        >
          TIMELESS
        </h1>

        <p className="font-mono text-text text-base sm:text-lg tracking-wide mb-12">
          Not what&apos;s good. What lasts.
        </p>

        <Link
          href="/gallery"
          className="bg-copper text-bg text-[11px] uppercase tracking-widest px-8 py-3.5 hover:bg-copper-light transition-colors"
        >
          Enter the gallery
        </Link>
      </section>

      {/* ── 2. WHAT IT IS ── */}
      <section id="about" className="max-w-2xl mx-auto px-6 py-24 sm:py-32 text-center">
        <p className="text-text text-base sm:text-lg leading-relaxed mb-6">
          A human-curated database of books, films, and TV shows — organized not by genre,
          but by the human moment they prepare you for.
        </p>
        <p className="text-text-muted text-sm sm:text-base leading-relaxed">
          Every other platform asks: did you enjoy it? Timeless asks: will this help
          someone be human in 100 years?
        </p>
      </section>

      {/* ── 3. THE TEN CATEGORIES ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        <p className="text-[11px] uppercase tracking-widest text-text-muted text-center mb-10">
          The Ten Categories
        </p>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-[1px]"
          style={{ backgroundColor: 'rgba(240,236,228,0.08)' }}
        >
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.name} name={cat.name} moment={cat.moment} index={i} />
          ))}
        </div>
      </section>

      {/* ── 4. THE LOOP ── */}
      <section className="py-20 sm:py-24 px-6 text-center">
        <p className="text-text-muted text-sm tracking-wide max-w-xl mx-auto leading-loose">
          Find the category that names your moment&ensp;&rarr;&ensp;read why a real
          person says this work lasts&ensp;&rarr;&ensp;return less alone.
        </p>
      </section>

      {/* ── 5. FOOTER ── */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <StarMark size={18} />
            <span
              className="font-serif text-copper text-sm"
              style={{ letterSpacing: '0.2em' }}
            >
              TIMELESS
            </span>
          </div>
          <div className="flex items-center gap-8 text-[11px] uppercase tracking-widest">
            <Link
              href="/submit"
              className="text-text-muted hover:text-copper transition-colors"
            >
              Submit a work
            </Link>
            <a href="#about" className="text-text-muted hover:text-copper transition-colors">
              About
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
