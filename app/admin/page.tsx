import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import AdminPanel from '@/components/AdminPanel';

export const metadata: Metadata = {
  title: 'Admin',
};

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_PASSWORD);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect('/admin/login');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AdminPanel />
    </div>
  );
}
