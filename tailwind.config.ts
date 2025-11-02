import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9ff',
          100: '#e6f2ff',
          200: '#bfdeff',
          300: '#99caff',
          400: '#4d9bff',
          500: '#006cff',
          600: '#005ee6',
          700: '#0040b3',
          800: '#002680',
          900: '#00154d'
        }
      }
    }
  },
  plugins: []
};

export default config;
