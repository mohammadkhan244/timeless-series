'use client';

import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'gallery-filters';

interface Props {
  name: string;
  moment: string;
  index: number;
}

export default function CategoryCard({ name, moment, index }: Props) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ categories: [name], search: '', medium: '', sort: 'newest' })
      );
    } catch {}
    router.push('/gallery');
  }

  const num = String(index + 1).padStart(2, '0');

  return (
    <a
      href="/gallery"
      onClick={handleClick}
      className="group block bg-bg p-6 sm:p-8 hover:bg-surface transition-colors cursor-pointer"
    >
      <span className="font-mono text-[10px] text-text-muted tracking-widest">{num}</span>
      <h3 className="text-copper text-sm sm:text-base font-medium mt-2 mb-3 group-hover:text-copper-light transition-colors leading-snug">
        {name}
      </h3>
      <p className="text-text-muted text-xs sm:text-sm leading-relaxed italic">{moment}</p>
    </a>
  );
}
