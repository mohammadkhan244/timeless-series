import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabase } from '@/lib/supabase';

async function verifyAdmin(request: Request): Promise<boolean> {
  const headerKey = request.headers.get('X-Admin-Key');
  if (headerKey && process.env.ADMIN_PASSWORD && headerKey === process.env.ADMIN_PASSWORD) {
    return true;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) {
    console.error('[admin/entries/[id]] No admin_session cookie and no X-Admin-Key header');
    return false;
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[admin/entries/[id]] ADMIN_PASSWORD env var is not set');
    return false;
  }
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_PASSWORD);
    await jwtVerify(token, secret);
    return true;
  } catch (err) {
    console.error('[admin/entries/[id]] JWT verification failed:', err);
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('entries')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[admin/entries/[id]] Supabase error:', error);
    return NextResponse.json({ error: error?.message || 'Not found' }, { status: 500 });
  }
  return NextResponse.json(data);
}
