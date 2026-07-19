/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design tokens — see DESIGN.md for rationale
        void: {
          DEFAULT: '#0B0E14',
          soft: '#12151E',
          raised: '#181C28',
        },
        aurora: {
          violet: '#7C6CF6',
          teal: '#4FD1C5',
          rose: '#F6789C', // rare third accent — only for celebratory/achievement moments
        },
        ink: {
          primary: '#F5F3FF',
          muted: '#9CA3B8',
          faint: '#5B6178',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #7C6CF6 0%, #4FD1C5 100%)',
        'aurora-radial': 'radial-gradient(circle at 30% 20%, rgba(124,108,246,0.35), transparent 55%), radial-gradient(circle at 75% 65%, rgba(79,209,197,0.28), transparent 50%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)',
        glow: '0 0 40px rgba(124,108,246,0.25)',
      },
      backdropBlur: {
        glass: '20px',
      },
      borderRadius: {
        xl2: '1.75rem',
      },
    },
  },
  plugins: [],
};
