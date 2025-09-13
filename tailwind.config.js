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
          "primary": "#f582ae",
          "secondary": "#172c66",
          "accent": "#8bd3dd",
          "neutral": "#f3d2c1",
          "base-100": "#fef6e4",
          "base-200": "#fef6e4",
          "base-300": "#fef6e4",
          "base-content": "#001858",
          "info": "oklch(62% 0.214 259.815)",
          "success": "oklch(70% 0.14 182.503)",
          "warning": "oklch(76% 0.188 70.08)",
          "error": "oklch(65% 0.241 354.308)",
        },
      }
    ],
  },
}

