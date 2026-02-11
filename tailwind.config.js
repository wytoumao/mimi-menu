/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF8C00',
        'primary-light': '#FFA940',
        'primary-dark': '#E07800',
        'bg-warm': '#FFF8F0',
      }
    },
  },
  plugins: [],
}
