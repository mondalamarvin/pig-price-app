const c = (name) => `hsl(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        border: c('border'), input: c('input'), ring: c('ring'),
        background: c('background'), foreground: c('foreground'),
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        success: c('success'),
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
  plugins: [],
}
