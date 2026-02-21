/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic theme colors using CSS variables
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary)',
          light: 'var(--color-primary)',
          50: 'color-mix(in srgb, var(--color-primary) 5%, white)',
          100: 'color-mix(in srgb, var(--color-primary) 10%, white)',
          200: 'color-mix(in srgb, var(--color-primary) 25%, white)',
          300: 'color-mix(in srgb, var(--color-primary) 40%, white)',
          400: 'color-mix(in srgb, var(--color-primary) 60%, white)',
          500: 'var(--color-primary)',
          600: 'color-mix(in srgb, var(--color-primary) 80%, black)',
          700: 'color-mix(in srgb, var(--color-primary) 70%, black)',
          800: 'color-mix(in srgb, var(--color-primary) 60%, black)',
          900: 'color-mix(in srgb, var(--color-primary) 50%, black)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          dark: 'var(--color-secondary)',
          light: 'var(--color-secondary)',
          50: 'color-mix(in srgb, var(--color-secondary) 5%, white)',
          100: 'color-mix(in srgb, var(--color-secondary) 10%, white)',
          200: 'color-mix(in srgb, var(--color-secondary) 25%, white)',
          300: 'color-mix(in srgb, var(--color-secondary) 40%, white)',
          400: 'color-mix(in srgb, var(--color-secondary) 60%, white)',
          500: 'var(--color-secondary)',
          600: 'color-mix(in srgb, var(--color-secondary) 80%, black)',
          700: 'color-mix(in srgb, var(--color-secondary) 70%, black)',
          800: 'color-mix(in srgb, var(--color-secondary) 60%, black)',
          900: 'color-mix(in srgb, var(--color-secondary) 50%, black)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          dark: 'var(--color-accent)',
          light: 'var(--color-accent)',
          50: 'color-mix(in srgb, var(--color-accent) 5%, white)',
          100: 'color-mix(in srgb, var(--color-accent) 10%, white)',
          200: 'color-mix(in srgb, var(--color-accent) 25%, white)',
          300: 'color-mix(in srgb, var(--color-accent) 40%, white)',
          400: 'color-mix(in srgb, var(--color-accent) 60%, white)',
          500: 'var(--color-accent)',
          600: 'color-mix(in srgb, var(--color-accent) 80%, black)',
          700: 'color-mix(in srgb, var(--color-accent) 70%, black)',
          800: 'color-mix(in srgb, var(--color-accent) 60%, black)',
          900: 'color-mix(in srgb, var(--color-accent) 50%, black)',
        },
      },
    },
  },
  plugins: [],
}
         