/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        // Characterful display face for headings; falls back to the body face.
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
        logo: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          'primary-strong': 'var(--brand-primary-strong)',
          tertiary: 'var(--brand-tertiary)',
          neutral: 'var(--brand-neutral)',
          accent: 'var(--accent)',
          'accent-strong': 'var(--accent-strong)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          body: 'var(--text-body)',
        },
        surface: {
          page: 'var(--surface-page)',
          admin: 'var(--surface-admin)',
          card: 'var(--surface-card)',
        },
        border: {
          light: 'var(--border-light)',
        },
        bg: {
          light: 'var(--bg-light)',
        },
        // Semantic status tokens (badge-safe: dark text on a light tint).
        success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)' },
        warning: { DEFAULT: 'var(--warning)', bg: 'var(--warning-bg)' },
        danger: { DEFAULT: 'var(--danger)', bg: 'var(--danger-bg)' },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)' },
        // Reskin: the app's "blue"/"indigo" utility classes now resolve to the
        // pine-teal brand ramp, so existing usages inherit the new identity
        // without touching every component. Brand tokens above are preferred
        // for new code.
        blue: {
          50: '#edfaf7',
          100: '#d0f0eb',
          200: '#a3e0d8',
          300: '#6dcabf',
          400: '#38aea1',
          500: '#159488',
          600: '#0f766e',
          700: '#0c5c55',
          800: '#0d4a45',
          900: '#0e3d39',
          950: '#032422',
        },
        indigo: {
          50: '#edfaf7',
          100: '#d0f0eb',
          200: '#a3e0d8',
          300: '#6dcabf',
          400: '#38aea1',
          500: '#159488',
          600: '#0f766e',
          700: '#0c5c55',
          800: '#0d4a45',
          900: '#0e3d39',
          950: '#032422',
        },
      },
    },
  },
  plugins: [],
}
