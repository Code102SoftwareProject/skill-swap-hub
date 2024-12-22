/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0369A1',
        secondary: '#BAE6FD',
        accent: '#F5F8FA',
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Roboto', 'sans-serif']
      },
      spacing: {
        128: '32rem',
        144: '36rem',
      },
    },
  },
  plugins: [],
};
