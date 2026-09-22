/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#09090b',
          900: '#121215',
          800: '#1c1c21',
          700: '#2a2a32',
        },
        brand: {
          purple: '#a855f7',
          amber: '#f59e0b',
        }
      },
    },
  },
  plugins: [],
}
