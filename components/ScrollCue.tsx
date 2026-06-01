'use client';

import { useEffect, useState } from 'react';

export default function ScrollCue({ targetId }: { targetId: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function check() {
      setVisible(window.scrollY < 80);
    }
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  function handleClick() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to next section"
      className={`absolute bottom-8 left-1/2 -translate-x-1/2 p-2 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <svg
        width="22"
        height="13"
        viewBox="0 0 22 13"
        fill="none"
        aria-hidden="true"
        className="cue-bounce"
        style={{ opacity: 0.4 }}
      >
        <path
          d="M1 1L11 11L21 1"
          stroke="#b87333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
