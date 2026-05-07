import type { Metadata } from 'next';
import SubmitForm from '@/components/SubmitForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Submit an Entry',
};

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="mb-8 sm:mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-text leading-tight mb-3">Submit an Entry</h1>
        <p className="text-text-muted leading-relaxed">
          Share a book, film, or TV show that has helped you navigate a fundamental human
          experience. All entries are reviewed before appearing in the gallery.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}
