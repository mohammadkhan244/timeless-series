import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabase } from '@/lib/supabase';

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
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
    return NextResponse.json({ error: error?.message || 'Not found' }, { status: 500 });
  }
  return NextResponse.json(data);
}
