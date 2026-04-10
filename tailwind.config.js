/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f0',
          100: '#ffd7d2',
          200: '#ffa49a',
          300: '#ff6f5c',
          400: '#f84938',
          500: '#d72b1f',
          600: '#a4221c',
          700: '#7d1b18',
          800: '#5c1310',
          900: '#3f0b0a'
        }
      }
    }
  },
  plugins: []
};
