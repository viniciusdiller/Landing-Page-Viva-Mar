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
        body: ['Satoshi', 'Inter', 'sans-serif'],
      },
      colors: {
        // Pousada Viva Mar — ocean-inspired palette
        // Deep teal primary (sea depth), warm sand neutrals
        'vm-teal': {
          50:  '#eef9f9',
          100: '#d4f0f0',
          200: '#ade2e3',
          300: '#76cdd0',
          400: '#3bafc0',
          500: '#0d8fa3',
          600: '#0a7289',
          700: '#0d5c6e',
          800: '#104b5a',
          900: '#124050',
          DEFAULT: '#0a7289',
        },
        'vm-sand': {
          50:  '#faf8f4',
          100: '#f3eeE4',
          200: '#e8dfc9',
          300: '#d9c9a8',
          400: '#c6ae83',
          500: '#b69568',
          600: '#a37e53',
          700: '#886644',
          800: '#6e533b',
          900: '#5a4532',
          DEFAULT: '#c6ae83',
        },
        'vm-bg':      '#f7f5f0',
        'vm-surface': '#faf9f6',
        'vm-border':  'oklch(0.35 0.01 80 / 0.12)',
        'vm-text':    '#1e1c18',
        'vm-muted':   '#6b6860',
        'vm-faint':   '#b0aea8',
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
    },
  },
  plugins: [],
};

export default config;
