/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/*//.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0369A1',
        secondary: '#BAE6FD',
        accent: '#F5F8FA',
        buttonHover: '#025A89'
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
