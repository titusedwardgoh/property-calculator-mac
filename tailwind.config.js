/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      "light",
      "dark", 
      {
        flyingwizard: {
          "primary": "#E29578",
          "secondary": "#453F3C",
          "accent": "#439775",
          "neutral": "#f3d2c1",
          "base-100": "#f2FFE5",
          "base-200": "#ffffff",
          "base-300": "#fef6e4",
          "base-content": "#453F3C",
          "info": "oklch(62% 0.214 259.815)",
          "success": "oklch(70% 0.14 182.503)",
          "warning": "oklch(76% 0.188 70.08)",
          "error": "#b83a25",
        },
      }
    ],
  },
}

