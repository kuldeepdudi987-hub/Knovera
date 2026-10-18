/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070a10',
          900: '#0a0f1d',
          850: '#0f162b',
          800: '#141e3a',
          700: '#1e2c52',
        },
        cyan: {
          glow: '#00F2FE',
          neon: '#06b6d4',
        },
        purple: {
          electric: '#9d4edd',
          neon: '#8b5cf6',
          vibrant: '#a855f7',
        },
        gold: {
          coin: '#fbbf24',
          glow: '#f59e0b',
          border: '#d97706',
          dark: '#78350f',
        },
        silver: {
          coin: '#cbd5e1',
          glow: '#94a3b8',
          border: '#64748b',
          dark: '#334155',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 242, 254, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(157, 78, 221, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(251, 191, 36, 0.4)',
        'glow-silver': '0 0 25px -5px rgba(203, 213, 225, 0.3)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
