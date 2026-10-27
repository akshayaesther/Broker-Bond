export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        charcoal: '#1F2937',
        primary: '#D85A30', // Deep Coral / Terracotta
        'primary-hover': '#C04D25',
        secondary: '#0F6E56', // Warm Teal
        'secondary-hover': '#0C5844',
        accent: '#EF9F27', // Golden Amber
        'accent-hover': '#D48719',
        
        // Semantic/Status
        success: '#10B981', // green
        progress: '#F59E0B', // amber
        pending: '#9CA3AF', // gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Body
        heading: ['Outfit', 'sans-serif'], // Headings
      }
    },
  },
  plugins: [],
}
