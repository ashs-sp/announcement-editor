/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
        serif: ['"Noto Serif TC"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#1C2B3A',
          light: '#3A4D5E',
          muted: '#6B7A86',
        },
        parchment: {
          DEFAULT: '#F7F4EE',
          dark: '#EDE8DF',
        },
        vermillion: {
          DEFAULT: '#A0291A',
          light: '#C43A29',
          bg: '#FDF0EE',
        },
        gold: {
          DEFAULT: '#B8955A',
          light: '#D4B07A',
        },
        surface: '#FFFFFF',
        border: '#DDD8CE',
      },
      boxShadow: {
        paper: '0 2px 12px rgba(28,43,58,0.08), 0 1px 3px rgba(28,43,58,0.05)',
        'paper-lg': '0 8px 40px rgba(28,43,58,0.12), 0 2px 8px rgba(28,43,58,0.06)',
        lift: '0 4px 20px rgba(28,43,58,0.1)',
      },
    },
  },
  plugins: [],
}
