
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
      },
    },
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          primary: 'hsl(var(--primary))',
          'primary-foreground': 'hsl(var(--primary-foreground))',
          accent: 'hsl(var(--accent))',
          'accent-foreground': 'hsl(var(--accent-foreground))',
          border: 'hsl(var(--border))',
          ring: 'hsl(var(--ring))',
        },
        // --- NEW ENHANCED CARD BACKGROUNDS ---
        // Light Mode Card Backgrounds
        'card-thinker-light': '#B6244F', // Amaranth purple
        'card-brainiac-light': '#D4CCF9', // Richer Lavender
        'card-strategist-light': '#CCEBF9', // Soft Teal/Aqua
        'card-innovator-light': '#F9E0CC', // Warm Coral/Peach

        // Dark Mode Card Backgrounds (Subtle Tints)
        'card-thinker-dark': '#2F2E3A', // Purplish Dark Grey for Thinker
        'card-brainiac-dark': '#322E3A', // Purplish Dark Grey for Brainiac
        'card-strategist-dark': '#2D354A', // Bluish Dark Grey
        'card-innovator-dark': '#352E2B', // Dark brownish-grey (matches Coral)

        // --- ICON FILL COLORS ---
        'icon-thinker-light': '#FFFFFF', // White for the new dark bg
        'icon-brainiac-light': '#C287E8', // Lavender (floral)
        'icon-strategist-light': '#0471A6', // Honolulu Blue
        'icon-innovator-light': '#FF8552', // Coral

        'icon-thinker-dark': '#B6244F', // Amaranth purple
        'icon-brainiac-dark': '#C287E8', // Lavender (floral)
        'icon-strategist-dark': '#0471A6',
        'icon-innovator-dark': '#FF8552',

        // --- TEXT COLORS ---
        'text-dark-primary': '#FFFFFF',
        'text-dark-secondary': '#C0C0C0',
        'text-light-primary': '#333333',
        'text-light-secondary': '#666666',
        'event-item-dark': '#E0E0E0',
        'event-item-light': '#444444',
        'event-link-hover-dark': '#6ECFF6',
        'event-link-hover-light': '#0471A6',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
      },
      boxShadow: {
        soft: '0 4px 15px -1px hsl(var(--primary) / 0.1), 0 2px 8px -1px hsl(var(--primary) / 0.08)',
        'md-soft': '0 10px 25px -3px hsl(var(--primary) / 0.1), 0 4px 10px -2px hsl(var(--primary) / 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
