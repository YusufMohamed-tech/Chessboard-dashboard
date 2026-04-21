/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cairo', 'sans-serif'],
        body: ['Tajawal', 'sans-serif'],
      },
      colors: {
        'cb-lime': {
          DEFAULT: '#a8c93a',
          dark: '#8fb02e',
          light: '#e8f5c8',
          50: '#f5fae6',
          100: '#e8f5c8',
          200: '#d4eb9e',
          300: '#bfdf6e',
          400: '#a8c93a',
          500: '#8fb02e',
          600: '#739022',
          700: '#576d1a',
          800: '#3c4b12',
          900: '#212a0a',
        },
        'cb-gray': {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#808080',
          600: '#636363',
          700: '#4a4a4a',
          800: '#2d2d2d',
          900: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}
