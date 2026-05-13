import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';

const MIN_WORDS = 200;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
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
    contributor_name,
    article_link,
  } = body;

  if (!title?.trim() || !author?.trim() || !medium || !category || !timelessness_note?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['book', 'film', 'tv show'].includes(medium)) {
    return NextResponse.json({ error: 'Invalid medium' }, { status: 400 });
  }

  const categoryArray: string[] = Array.isArray(category) ? category : [category];
  if (categoryArray.length === 0) {
    return NextResponse.json({ error: 'Select at least one category' }, { status: 400 });
  }
  if (!categoryArray.every((c) => (CATEGORIES as readonly string[]).includes(c))) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  if (countWords(timelessness_note) < MIN_WORDS) {
    return NextResponse.json(
      { error: `Note must be at least ${MIN_WORDS} words` },
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
      category: categoryArray,
      cover_image: cover_image?.trim() || null,
      timelessness_note: timelessness_note.trim(),
      human_moment: '',
      contributor_name: contributor_name?.trim() || 'Anonymous',
      article_link: article_link?.trim() || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
