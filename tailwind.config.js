/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          note: '#FFEB9C',
        },
        pink: {
          note: '#FFB3D9',
        },
        blue: {
          note: '#B3D9FF',
        }
      }
    },
  },
  plugins: [],
}