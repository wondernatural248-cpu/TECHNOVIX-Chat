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
        technovix: {
          void: '#050609',
          bg: '#090b12',
          panel: '#0e121e',
          surface: '#151b2c',
          card: '#1c243a',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-active': 'rgba(0, 240, 255, 0.35)',
        },
        neon: {
          cyan: '#00f0ff',
          'cyan-muted': '#06b6d4',
          violet: '#8b5cf6',
          'violet-light': '#a855f7',
          'violet-glow': '#c084fc',
          magenta: '#e879f9',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.45)',
        'glow-cyan-sm': '0 0 10px -2px rgba(0, 240, 255, 0.35)',
        'glow-violet': '0 0 20px -3px rgba(139, 92, 246, 0.45)',
        'glow-violet-sm': '0 0 10px -2px rgba(139, 92, 246, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'glow-spin': 'glowSpin 12s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
