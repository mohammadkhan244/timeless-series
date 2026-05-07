const path = require('path');

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    path.join(__dirname, './app/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, './components/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        bg:             '#0a0a0a',
        surface:        '#111111',
        'surface-2':    '#181818',
        input:          '#1a1a1a',
        border:         '#222222',
        text:           '#f0ece4',
        'text-muted':   '#6b6560',
        copper:         '#b87333',
        'copper-light': '#cc8c4a',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

module.exports = config;
