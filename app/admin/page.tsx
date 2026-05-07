import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import AdminPanel from '@/components/AdminPanel';

export const metadata: Metadata = {
  title: 'Admin',
};

async function verifySession(): Promise<boolean> {
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

interface Props {
  searchParams: Promise<{ key?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const { key } = await searchParams;

  const keyOk = key && process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
  const sessionOk = await verifySession();

  if (!keyOk && !sessionOk) redirect('/admin/login');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AdminPanel adminKey={keyOk ? key : undefined} />
    </div>
  );
}
