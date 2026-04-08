/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8eef5',
          100: '#c5d5e8',
          200: '#9eb9d9',
          300: '#779dca',
          400: '#5987bf',
          500: '#1e3a5f',
          600: '#1a3354',
          700: '#152b48',
          800: '#11233d',
          900: '#0b1829',
        },
        accent: {
          50: '#e6f6fe',
          100: '#b3e4fc',
          200: '#80d2fa',
          300: '#4dc0f8',
          400: '#2db3f7',
          500: '#0ea5e9',
          600: '#0b8ac4',
          700: '#086f9f',
          800: '#06547a',
          900: '#033955',
        },
      },
    },
  },
  plugins: [],
};
