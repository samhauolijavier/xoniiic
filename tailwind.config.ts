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
        brand: {
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
          purple: '#8b2fc9',
          pink: '#c026d3',
          orange: '#f97316',
          text: '#f1f5f9',
          muted: '#94a3b8',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #8b2fc9, #c026d3, #f97316)',
        'gradient-brand-h': 'linear-gradient(to right, #8b2fc9, #f97316)',
        'gradient-card': 'linear-gradient(135deg, #12121a, #1a1a2e)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(139, 47, 201, 0.3)',
        'glow-pink': '0 0 20px rgba(192, 38, 211, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 47, 201, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(192, 38, 211, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
