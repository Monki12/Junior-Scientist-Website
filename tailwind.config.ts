
import type { Config } from 'tailwindcss';

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
        'card-strategist-light': '#D0E0FF', // Soft light blue
        'card-brainiac-light': '#E9DFFF', // Soft light lavender
        'card-thinker-light': '#FDDDE8', // Soft light pink for new color
        'card-innovator-light': '#FFE8D9', // Soft light coral

        // Dark Mode Card Backgrounds (Subtle Tints)
        'card-strategist-dark': '#2E354A', // Dark blue-grey
        'card-brainiac-dark': '#322E3A', // Dark purplish-grey
        'card-thinker-dark': '#3A2E33', // Dark pinkish-grey
        'card-innovator-dark': '#352E2B', // Dark brownish-grey

        // --- ICON FILL COLORS (Unified) ---
        'icon-strategist': '#0471A6', // Honolulu Blue
        'icon-brainiac': '#C287E8', // Lavender (floral)
        'icon-thinker': '#dd557e', // New Pink
        'icon-innovator': '#FF8552', // Coral

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
        'md-soft':
          '0 10px 25px -3px hsl(var(--primary) / 0.1), 0 4px 10px -2px hsl(var(--primary) / 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
