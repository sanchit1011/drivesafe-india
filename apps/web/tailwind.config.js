/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // DriveSafe brand colors from reference image
        primary: {
          DEFAULT: '#00B285',
          50: '#E6F7F3',
          100: '#CCEFE7',
          200: '#99DFCF',
          300: '#66CFBB',
          400: '#33BFA7',
          500: '#00B285',
          600: '#009970',
          700: '#007A59',
          800: '#005B42',
          900: '#003D2C',
        },
        dark: {
          DEFAULT: '#1F2937',
          navy: '#102937',
          charcoal: '#1F2937',
        },
        brand: {
          teal: '#00B285',
          dark: '#102937',
          charcoal: '#1F2937',
          gray: '#647488',
          light: '#F2F5F7',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        DEFAULT: '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)',
        'soft': '0 2px 8px rgba(0,178,133,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      }
    },
  },
  plugins: [],
};
