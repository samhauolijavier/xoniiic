import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mirrors the CSS variables in globals.css — see the note there on why
        // the names still say purple and pink while holding greens.
        brand: {
          bg: '#fbf9f8',
          card: '#ffffff',
          border: '#e6e0e2',
          purple: '#a21caf',
          pink: '#e879f9',
          orange: '#f97316',
          text: '#1a1418',
          muted: '#837b80',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #a21caf, #e879f9)',
        'gradient-brand-h': 'linear-gradient(to right, #f472b6, #f97316, #facc15)',
        'gradient-card': 'linear-gradient(135deg, #ffffff, #fbf9f8)',
      },
      // Glow belonged to the dark ground. On paper it reads as blur rather
      // than light, so these become the quiet lifts a light UI actually uses.
      boxShadow: {
        'glow-purple': '0 2px 10px rgba(162, 28, 175, 0.16)',
        'glow-pink': '0 2px 10px rgba(232, 121, 249, 0.20)',
        'glow-orange': '0 2px 10px rgba(249, 115, 22, 0.18)',
        'card': '0 1px 2px rgba(26, 20, 24, 0.04), 0 4px 14px rgba(26, 20, 24, 0.05)',
      },
      animation: {
        'gradient-shift': 'gradientShift 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 2px 10px rgba(162, 28, 175, 0.12)' },
          '50%': { boxShadow: '0 4px 18px rgba(162, 28, 175, 0.24)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
