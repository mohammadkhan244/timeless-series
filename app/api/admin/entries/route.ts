import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabase } from '@/lib/supabase';

async function verifyAdmin(request: Request): Promise<boolean> {
  // Check X-Admin-Key header (used by URL-key flow)
  const headerKey = request.headers.get('X-Admin-Key');
  if (headerKey && process.env.ADMIN_PASSWORD && headerKey === process.env.ADMIN_PASSWORD) {
    return true;
  }

  // Fall back to cookie session
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) {
    console.error('[admin/entries] No admin_session cookie and no X-Admin-Key header');
    return false;
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[admin/entries] ADMIN_PASSWORD env var is not set');
    return false;
  }
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_PASSWORD);
    await jwtVerify(token, secret);
    return true;
  } catch (err) {
    console.error('[admin/entries] JWT verification failed:', err);
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/entries] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
