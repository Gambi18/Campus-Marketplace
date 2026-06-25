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
        logo: ['var(--font-jakarta)', 'sans-serif'],
      },
    
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          tertiary: 'var(--brand-tertiary)',
          neutral: 'var(--brand-neutral)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
      },
    },
  },
  plugins: [],
}