import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center text-center px-4">
      <div>
        <p className="font-serif text-7xl text-copper/20 mb-6 select-none">404</p>
        <h1 className="font-serif text-2xl text-text mb-3">Entry not found</h1>
        <p className="text-text-muted text-sm mb-10">
          This entry doesn&apos;t exist or hasn&apos;t been approved yet.
        </p>
        <Link
          href="/"
          className="text-sm text-copper hover:text-copper-light transition-colors"
        >
          Return to gallery →
        </Link>
      </div>
    </div>
  );
}
