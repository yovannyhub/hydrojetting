/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./areas-we-service.html",
    "./privacy-policy.html",
    "./terms-of-service.html"
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        tonyRed: '#ef4444',
        tonyBlue: '#2563eb',
        tonyOrange: '#f97316',
        tonyDark: '#0f172a'
      }
    }
  },
  plugins: [],
}
