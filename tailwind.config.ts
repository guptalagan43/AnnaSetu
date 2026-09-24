import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-black':  '#0A0A0A',
        'brand-white':  '#F5F0E8',
        'brand-cream':  '#EDE8DC',
        'brand-red':    '#D42B2B',
        'brand-red-dk': '#A01E1E',
        'ers-safe':     '#2D8A3E',
        'ers-caution':  '#C8961A',
        'ers-warning':  '#D4620A',
        'ers-critical': '#C4201F',
        'ers-emergency':'#1A0A0A',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'Arial Black', 'sans-serif'],
        body:    ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['96px',  { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-xl':  ['72px',  { lineHeight: '1',    letterSpacing: '-0.015em' }],
        'display-lg':  ['56px',  { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'display-md':  ['42px',  { lineHeight: '1.1',  letterSpacing: '-0.01em' }],
        'display-sm':  ['32px',  { lineHeight: '1.15', letterSpacing: '-0.005em' }],
      },
      boxShadow: {
        'brutal':      '4px 4px 0px 0px #0A0A0A',
        'brutal-red':  '4px 4px 0px 0px #D42B2B',
        'brutal-sm':   '2px 2px 0px 0px #0A0A0A',
        'brutal-lg':   '8px 8px 0px 0px #0A0A0A',
        'brutal-hover':'6px 6px 0px 0px #0A0A0A',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      animation: {
        'ers-pulse': 'ers-pulse 1.2s ease-in-out infinite',
        'ticker':    'ticker 30s linear infinite',
        'counter':   'counter 1.5s ease-out forwards',
      },
      keyframes: {
        'ers-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.85', transform: 'scale(1.03)' },
        },
        'ticker': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config