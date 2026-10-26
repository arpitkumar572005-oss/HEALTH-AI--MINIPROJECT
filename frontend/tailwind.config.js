/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E', // Strict primary
          800: '#115E59',
          900: '#134E4A',
          DEFAULT: '#0F766E',
          dark: '#115E59',
          light: '#F0FDFA',
        },
        navy: {
          DEFAULT: '#142B3B', // Strict secondary
          light: '#1F3F56',
          dark: '#0C1C27',
        },
        primary: {
          DEFAULT: '#0F766E',
          dark: '#115E59',
          light: '#F0FDFA',
          secondary: '#142B3B',
        },
        health: {
          green: '#0F766E',
          light: '#F0FDFA',
          border: '#CCFBF1',
          text: '#115E59'
        },
        warning: {
          amber: '#D97706',
          light: '#FFFBEB',
          border: '#FDE68A',
          text: '#92400E'
        },
        risk: {
          red: '#DC2626',
          light: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B'
        },
        slate: {
          background: '#F7F9FA', // Strict page background
          card: '#FFFFFF', // Strict card background
          primary: '#172B3A', // Strict primary text
          secondary: '#64748B', // Strict secondary text
          border: '#E2E8F0', // Strict neutral border
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '8px',
        'input': '6px',
        'btn': '6px',
      },
      boxShadow: {
        'clinical': '0 1px 3px 0 rgba(20, 43, 59, 0.05), 0 1px 2px -1px rgba(20, 43, 59, 0.03)',
        'clinical-md': '0 4px 6px -1px rgba(20, 43, 59, 0.06), 0 2px 4px -2px rgba(20, 43, 59, 0.04)',
      }
    },
  },
  plugins: [],
}
