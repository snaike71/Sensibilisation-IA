/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:     '#0511f3',
          navy:     '#182573',
          black:    '#0d0d0d',
          cyan:     '#c4eef2',
          offwhite: '#f8f8f6',
          gray:     '#e8e8e4',
        },
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        mono:  ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
