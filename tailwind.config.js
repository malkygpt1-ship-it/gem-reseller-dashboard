/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090b0f',
        panel: '#11151b',
        lime: '#b9f227',
        mint: '#58e3b5'
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] }
    }
  },
  plugins: []
}
