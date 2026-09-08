/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B2420',
          soft: '#1A3A34',
          muted: '#3D5A53',
        },
        mist: {
          DEFAULT: '#E7EFEC',
          soft: '#F3F7F5',
          deep: '#D5E3DE',
        },
        brass: {
          DEFAULT: '#A67C52',
          soft: '#C4A07A',
          deep: '#8A6540',
        },
        teal: {
          DEFAULT: '#1F6B5C',
          soft: '#2A8A76',
          deep: '#164F44',
        },
        surface: {
          DEFAULT: '#FBFCFA',
          raised: '#FFFFFF',
        },
        primary: {
          50: '#E7EFEC',
          500: '#1F6B5C',
          600: '#164F44',
          700: '#0B2420',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px -16px rgba(11, 36, 32, 0.18)',
        panel: '0 8px 28px -12px rgba(11, 36, 32, 0.14)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, -1.5%) scale(1.04)' },
        },
        'rule-draw': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.6s ease-out both',
        drift: 'drift 18s ease-in-out infinite',
        'rule-draw': 'rule-draw 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
