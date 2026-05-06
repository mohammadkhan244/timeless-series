import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
