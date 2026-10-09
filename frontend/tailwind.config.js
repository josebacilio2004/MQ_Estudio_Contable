/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      keyframes: {
        'remote-glow': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: 'none' },
          '50%': { transform: 'scale(1.01)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }
        }
      },
      animation: {
        'remote-glow': 'remote-glow 1.2s ease-in-out'
      }
    },
  },
  plugins: [],
}
