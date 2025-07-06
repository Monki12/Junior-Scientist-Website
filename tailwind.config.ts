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
        // --- NEW ENHANCED CARD BACKGROUNDS based on your new mapping ---
        // Light Mode Card Backgrounds (Derived from image_430ea4.png for light version)
        'card-strategist-light': '#D0E0FF', // Soft light blue (Honolulu Blue adapted)
        'card-brainiac-light': '#E9DFFF',   // Soft light lavender (Lavender floral adapted)
        'card-thinker-light': '#E0C8F5',    // Softer light purple (Amaranth purple adapted)
        'card-innovator-light': '#FFE8D9',  // Soft light coral (Coral adapted)

        // Dark Mode Card Backgrounds (Subtle Tints aligning with primary colors for depth)
        // These are designed to be distinct but not overpowering against your dark theme.
        'card-strategist-dark': '#2E354A', // Dark blue-grey (matches Honolulu Blue)
        'card-brainiac-dark': '#322E3A',   // Dark purplish-grey (matches Lavender floral)
        'card-thinker-dark': '#342C3F',    // Darker purple-grey (matches Amaranth purple)
        'card-innovator-dark': '#352E2B',  // Dark brownish-grey (matches Coral)

        // --- ICON FILL COLORS (Maintained for vibrancy and glow) ---
        // These are referenced via CSS variables in globals.css now
        
        // --- TEXT COLORS (Keep these as they are or adjust for new contrast) ---
        'text-dark-primary': '#FFFFFF',
        'text-dark-secondary': '#C0C0C0',
        'text-light-primary': '#333333',
        'text-light-secondary': '#666666',
        'event-item-dark': '#E0E0E0',
        'event-item-light': '#444444',
        'event-link-hover-dark': '#6ECFF6', // Lighter blue for dark mode hover
        'event-link-hover-light': '#0471A6', // Darker blue for light mode hover
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
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
