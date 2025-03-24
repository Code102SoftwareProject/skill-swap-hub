/** @type {import('tailwindcss').Config} */
module.exports = {
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
		  textcolor: "var(--textcolor)", // Added border color definition
		},
		fontFamily: {
		  heading: ["Manrope", "sans-serif"],
		  body: ["Roboto", "sans-serif"],
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  };
  