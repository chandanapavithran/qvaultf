/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'qv-primary': '#7c7bed', /* Purple from design */
        'qv-secondary': '#6463d6', /* Darker purple for hover/active */
        'qv-bg-light': '#f8f9fd', /* Very light gray/blue background */
        'qv-text-dark': '#333333',
        'qv-text-muted': '#a0a0a0',
        'qv-input-border': '#e0e0e0',
        'qv-input-bg': '#ffffff',
        'qv-purple-soft': '#e8e8ff', /* Light purple background for illustration side */
      },
      backgroundImage: {
        'qv-gradient-btn': 'linear-gradient(90deg, #7c7bed 0%, #6463d6 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
