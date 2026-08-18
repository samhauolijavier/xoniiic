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
          bg: '#fbfaf8',
          card: '#ffffff',
          border: '#e3e0d9',
          purple: '#0f6b45',
          pink: '#0d5c3b',
          orange: '#a86a12',
          text: '#16150f',
          muted: '#85817a',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0f6b45, #0d5c3b)',
        'gradient-brand-h': 'linear-gradient(to right, #0f6b45, #0d5c3b)',
        'gradient-card': 'linear-gradient(135deg, #ffffff, #fbfaf8)',
      },
      // Glow belonged to the dark ground. On paper it reads as blur rather
      // than light, so these become the quiet lifts a light UI actually uses.
      boxShadow: {
        'glow-purple': '0 2px 10px rgba(15, 107, 69, 0.14)',
        'glow-pink': '0 2px 10px rgba(13, 92, 59, 0.14)',
        'glow-orange': '0 2px 10px rgba(168, 106, 18, 0.14)',
        'card': '0 1px 2px rgba(22, 21, 15, 0.04), 0 4px 14px rgba(22, 21, 15, 0.05)',
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
          '0%, 100%': { boxShadow: '0 2px 10px rgba(15, 107, 69, 0.12)' },
          '50%': { boxShadow: '0 4px 18px rgba(15, 107, 69, 0.24)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
