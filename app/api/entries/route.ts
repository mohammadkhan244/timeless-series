import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';

function countSentences(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 2).length;
}

export async function GET() {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    title,
    author,
    medium,
    category,
    cover_image,
    timelessness_note,
    human_moment,
    contributor_name,
    article_link,
    access_code,
  } = body;

  if (!process.env.ACCESS_CODE) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  if (access_code !== process.env.ACCESS_CODE) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }

  if (!title?.trim() || !author?.trim() || !medium || !category || !timelessness_note?.trim() || !human_moment?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['book', 'film', 'tv show'].includes(medium)) {
    return NextResponse.json({ error: 'Invalid medium' }, { status: 400 });
  }

  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  if (countSentences(timelessness_note) < 3) {
    return NextResponse.json(
      { error: 'Timelessness note must contain at least 3 sentences' },
      { status: 400 }
    );
  }

  if (countSentences(human_moment) < 2) {
    return NextResponse.json(
      { error: 'Human moment must contain at least 2 sentences' },
      { status: 400 }
    );
  }

  if (article_link && !/^https?:\/\/.+/.test(article_link)) {
    return NextResponse.json({ error: 'Article link must be a valid URL' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('entries')
    .insert({
      title: title.trim(),
      author: author.trim(),
      medium,
      category,
      cover_image: cover_image?.trim() || null,
      timelessness_note: timelessness_note.trim(),
      human_moment: human_moment.trim(),
      contributor_name: contributor_name?.trim() || 'Anonymous',
      article_link: article_link?.trim() || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
