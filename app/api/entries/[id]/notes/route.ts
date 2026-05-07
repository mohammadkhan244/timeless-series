import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('entry_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { note, contributor_name, access_code } = await request.json();

  if (!process.env.ACCESS_CODE) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  if (access_code !== process.env.ACCESS_CODE) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }
  if (!note?.trim() || note.trim().length < 10) {
    return NextResponse.json({ error: 'Note must be at least 10 characters' }, { status: 400 });
  }

  const { data: entry } = await supabase
    .from('entries')
    .select('id')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('contributions')
    .insert({
      entry_id: id,
      note: note.trim(),
      contributor_name: contributor_name?.trim() || 'Anonymous',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
