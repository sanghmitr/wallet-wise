/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        surface: '#f8f9fa',
        primary: '#5f5e5e',
        'primary-dim': '#535252',
        'primary-container': '#e5e2e1',
        'on-primary': '#faf7f6',
        'on-primary-container': '#525151',
        secondary: '#585f6d',
        'secondary-container': '#dce2f3',
        tertiary: '#5f5c78',
        error: '#9f403d',
        outline: '#737c7f',
        'outline-variant': '#abb3b7',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f4f6',
        'surface-container': '#eaeff1',
        'surface-container-high': '#e2e9ec',
        'surface-container-highest': '#dbe4e7',
        'surface-dim': '#d1dce0',
        'on-background': '#2b3437',
        'on-surface': '#2b3437',
        'on-surface-variant': '#586064',
        'on-secondary-container': '#4b525f',
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
      },
      boxShadow: {
        ambient: '0 12px 32px rgba(43, 52, 55, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float-in': 'floatIn 320ms ease-out',
      },
    },
  },
  plugins: [],
};
