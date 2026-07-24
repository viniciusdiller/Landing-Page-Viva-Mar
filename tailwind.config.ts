import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Jost', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Pousada Viva Mar — resort natural: verde oliva + dourado areia
        'vm-teal': {
          50:  '#f4f5f0',
          100: '#e6e8dc',
          200: '#ccd0bc',
          300: '#adb495',
          400: '#8a9070',
          500: '#6f7557',
          600: '#5c6152',
          700: '#494d40',
          800: '#3a3d33',
          900: '#2f3129',
          DEFAULT: '#5c6152',
        },
        'vm-sand': {
          50:  '#faf7ef',
          100: '#f1e6cf',
          200: '#e4d1a5',
          300: '#d4b877',
          400: '#c7a670',
          500: '#bd9a5f',
          600: '#a8843f',
          700: '#8f6f34',
          800: '#725a2c',
          900: '#5c4924',
          DEFAULT: '#bd9a5f',
        },
        'vm-bg':      '#f3efe6',
        'vm-surface': '#faf8f2',
        'vm-border':  'oklch(0.4 0.02 95 / 0.14)',
        'vm-text':    '#292a24',
        'vm-muted':   '#6c6a5c',
        'vm-faint':   '#a9a596',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 2px oklch(0.2 0.01 80 / 0.06), 0 4px 16px oklch(0.2 0.01 80 / 0.04)',
        'card-hover': '0 2px 4px oklch(0.2 0.01 80 / 0.08), 0 12px 32px oklch(0.2 0.01 80 / 0.07)',
        'modal': '0 8px 32px oklch(0.2 0.01 80 / 0.18)',
        'header': '0 1px 0 oklch(0.35 0.01 80 / 0.08)',
      },
      keyframes: {
        'chat-pop': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.85)' },
          '60%': { opacity: '1', transform: 'translateY(-4px) scale(1.03)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'chat-pop': 'chat-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
