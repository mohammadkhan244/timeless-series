import type { Metadata } from 'next';
import AdminPanel from '@/components/AdminPanel';

export const metadata: Metadata = {
  title: 'Admin',
};

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AdminPanel />
    </div>
  );
}
