import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      colors: {
        // Dynamic Page Theme Color Variables
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          'surface-hover': 'var(--theme-surface-hover)',
          border: 'var(--theme-border)',
          'border-strong': 'var(--theme-border-strong)',
          primary: 'var(--theme-primary)',
          'primary-hover': 'var(--theme-primary-hover)',
          'primary-light': 'var(--theme-primary-light)',
          secondary: 'var(--theme-secondary)',
          text: 'var(--theme-text)',
          muted: 'var(--theme-text-muted)',
          accent: 'var(--theme-accent)',
        },
        blinkit: {
          green: '#0C831F',
          'green-hover': '#096918',
          'green-light': '#E8F7ED',
          'green-border': '#16A34A',
          yellow: '#F7D046',
          'yellow-light': '#FEF9E7',
          'yellow-dark': '#EAB308',
          bg: '#F4F6F8',
          card: '#FFFFFF',
          border: '#E5E7EB',
          'border-light': '#F1F5F9',
          title: '#1E293B',
          text: '#334155',
          muted: '#64748B',
          red: '#DC2626',
        },
        // Customer Semantic Color Tokens (Mapped to CSS variables)
        c: {
          primary: 'var(--c-primary, #0C831F)',
          'primary-dark': 'var(--c-primary-dark, #096918)',
          'primary-light': 'var(--c-primary-light, #E8F7ED)',
          'primary-border': 'var(--c-primary-border, #16A34A)',
          accent: 'var(--c-accent, #F7D046)',
          'accent-hover': 'var(--c-accent-hover, #EAB308)',
          danger: 'var(--c-danger, #DC2626)',
          surface: 'var(--c-surface, #FFFFFF)',
          'surface-hover': 'var(--c-surface-hover, #F8FAFC)',
          bg: 'var(--c-bg, #F4F6F8)',
          text: 'var(--c-text, #1E293B)',
          'text-muted': 'var(--c-text-muted, #64748B)',
          border: 'var(--c-border, #E5E7EB)',
          'border-strong': 'var(--c-border-strong, #CBD5E1)',
        },
        aura: {
          obsidian: '#090A0F',
          velvet: '#10131E',
          container: '#161A28',
          card: '#1E2336',
          cyan: '#38BDF8',
          'cyan-light': '#7DD3FC',
          'cyan-dark': '#0284C7',
          'cyan-hover': '#0EA5E9',
          platinum: '#E2E8F0',
          emerald: '#10B981',
          ruby: '#F43F5E',
          ivory: '#FFFFFF',
          slate: '#94A3B8',
          border: 'rgba(56, 189, 248, 0.2)',
          'border-hover': 'rgba(56, 189, 248, 0.55)',
        },
        plaster: {
          light: 'var(--color-plaster-light, #f5f2ef)',
          mid: 'var(--color-plaster-mid, #e3ddd4)',
          shadow: 'var(--color-plaster-shadow, #c9c1b5)',
        },
        'accent-terracotta': 'var(--color-accent-terracotta, #9d785e)',
        'text-dark': 'var(--color-text-dark, #223134)',
      },
      fontFamily: {
        // Customer UI body — warm, geometric, perfect ₹ glyph (used by Flipkart, PhonePe)
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        // Staff dashboard body — compact, data-dense precision
        inter: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        // Display headings — Playfair Display: premium editorial serif (matches landing page)
        display: ['"Playfair Display"', 'Sora', 'Poppins', 'system-ui', 'sans-serif'],
        // Cursive script for elegant restaurant branding
        script: ['"Alex Brush"', '"Caveat"', 'cursive'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        // Prices on customer screens — Poppins tabular (no mono, just tnum feature)
        mono: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        // Terminal mono — POS/Kitchen only
        terminal: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(56, 189, 248, 0.35)',
        'cyan-glow-lg': '0 0 35px rgba(56, 189, 248, 0.55)',
        'card-luxury': '0 12px 32px -8px rgba(0, 0, 0, 0.85), 0 0 15px rgba(56, 189, 248, 0.1)',
        'blinkit-card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'blinkit-hover': '0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05)',
        'blinkit-green': '0 4px 14px rgba(12, 131, 31, 0.35)',
        'theme-glow': '0 0 25px var(--theme-primary-light)',
      },
    },
  },
  plugins: [],
};

export default config;
