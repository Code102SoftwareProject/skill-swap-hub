/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/*//.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        grayfill: "var(--grayfill)",
        textcolor: "var(--textcolor)",
        bgcolor: "var(--bgcolor)"
      },
      fontFamily: {
        heading: ["Manrope", "sans-serif"],
        body: ["Roboto", "sans-serif"],
      },
      animation: {
        bounce: 'bounce 1.4s infinite',
      },
      keyframes: {
        bounce: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        }
      },
      transitionDelay: {
        '75': '0.2s',
        '150': '0.4s',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
