/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')
const { SPACING_SCALE, FONT_SIZE_SCALE } = require('./design-tokens.cjs')

// Design system Tailwind config: colors reference CSS custom properties (defined in theme.css)
// colors reference CSS custom properties defined in theme.css.
const config = {
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        xs: '420px',
        'xs-sm': '500px',
        'md-xl': '875px',
        '2xl-3xl': '1700px',
      },
      lineHeight: {
        '3.75': '15px',
        '15': '60px',
        '78': '78px',
        '60': '60px',
        '48': '48px',
        '44': '44px',
        '29': '29px',
        '26': '26px',
        '24': '24px',
        '21': '21px',
        '20': '20px',
        '18': '18px',
        '16': '16px',
        '13': '13px',
      },
      margin: {
        '0.25': '1px',
        '0.75': '3px',
        '1.25': '5px',
      },
      gridTemplateRows: {
        '16': 'repeat(16, minmax(0, 1fr))',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '10000': '10000ms',
      },
      spacing: {
        ...SPACING_SCALE,
      },
      padding: {
        '4.5': '18px',
        '15': '60px',
        '17': '68px',
        '18': '72px',
        '36.25': '145px',
      },
      inset: {
        '12.5': '50px',
        '26': '104px',
        '36.25': '145px',
        '1/5': '20%',
        '2/5': '40%',
      },
      zIndex: {
        '1': '1',
      },
      height: {
        '4.5': '18px',
        '7.5': '30px',
        '8.5': '34px',
        '10.5': '42px',
        '12.5': '50px',
        '13': '52px',
        '15': '60px',
        '17.5': '70px',
        '17.75': '71px',
        '18': '72px',
        '23': '92px',
        '75': '300px',
        '100': '400px',
      },
      width: {
        '4.5': '18px',
        '7.5': '30px',
        '13': '52px',
        '17': '68px',
        '18': '72px',
        '19': '76px',
        '20': '80px',
        '22': '88px',
        '26': '104px',
        '27': '108px',
        '30': '120px',
        '31': '124px',
        '34.5': '138px',
        '38': '152px',
        '55': '220px',
        '70': '280px',
        '73.75': '295px',
        '85.75': '343px',
        '8xl': '96rem',
        '137': '148px',
        '160': '640px',
        'calc-134': 'calc( 100vw - 134px )',
        'calc-34': 'calc( 100vw - 34px )',
      },
      maxWidth: {
        '17': '68px',
        '30': '120px',
        '54.75': '219px',
        '56.5': '226px',
        '68.25': '273px',
        '70': '280px',
        '76': '304px',
        '85': '340px',
        '90': '360px',
        '92.25': '369px',
        '93.75': '375px',
        '95': '380px',
        '103.5': '414px',
        '116.25': '465px',
        '120': '480px',
        '120.5': '482px',
        '163.75': '655px',
        '168': '672px',
        '8xl': '96rem',
      },
      minWidth: {
        '50': '200px',
        '59.25': '237px',
        '60.75': '243px',
        '70': '280px',
        '99': '396px',
      },
      gap: {
        '4.5': '18px',
        '7.5': '30px',
        '17': '68px',
        '18': '72px',
        '19': '76px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in-out': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0)' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        appear: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in-fast': 'fade-in 0.1s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-slow': 'fade-in 0.5s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'spin-once': 'spin 4s linear forwards',
        'scale-in-out-once': 'scale-in-out 1.5s forwards',
        'slide-in-up': 'slide-in-up 300ms ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        appear: 'appear 1s ease-in',
      },
      boxShadow: {
        'chart-tooltip': '0px 10px 30px 0px rgba(20, 21, 24, 0.84)',
        'menu-dropdown':
          '0px 2px 2px -1px rgba(10, 13, 18, 0.04), 0px 4px 6px -2px rgba(10, 13, 18, 0.03), 0px 12px 16px -4px rgba(10, 13, 18, 0.08)',
        'btn-primary':
          'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.39), inset 0px -2px 0px 0px rgba(0, 0, 0, 0.22)',
        'btn-secondary':
          '0px 24px 24px -12px rgba(129, 129, 129, 0.04), 0px 3px 3px -1.5px rgba(1, 34, 54, 0.06), 0px 1px 1px -0.5px rgba(1, 34, 54, 0.04)',
      },
      backgroundImage: {
        'glow-conic-taostats':
          'conic-gradient(from 220deg at 50% 50%, #ff8f2d 31deg, #00ffb29e 259deg, #daef15c9 321deg)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'bottom-gradient': 'url(/assets/images/background/footer.png)',
        'subnet-gradient-2xl':
          'radial-gradient(ellipse at top center, #333333, #3333337a, transparent 800px);',
        'subnet-gradient-xl':
          'radial-gradient(ellipse at top center, #333333, #3333337a, transparent 600px);',
        'subnet-gradient-lg':
          'radial-gradient(ellipse at top center, #333333, #3333337a, transparent 500px);',
        'subnet-gradient-md':
          'radial-gradient(ellipse at top center, #333333, #3333337a, transparent 400px);',
        'subnet-gradient-sm':
          'radial-gradient(ellipse at top center, #333333, #3333337a, transparent 300px);',
        'subnet-gradient-xs':
          'radial-gradient(ellipse at top center, #333333, #3333337a, transparent 150px);',
      },
      gridTemplateColumns: {
        keyvalue: 'auto 1fr',
        '13': 'repeat(13, minmax(0, 1fr))',
        '26': 'repeat(26, minmax(0, 1fr))',
      },
      gridColumn: {
        'span-13': 'span 13 / span 13',
        'span-26': 'span 26 / span 26',
      },
      fontSize: {
        // --- Tailwind default overrides ---
        // xs: default line-height is 1rem (16px); overridden to 1.125rem (18px)
        xs: ['0.75rem', { lineHeight: '1.125rem' }], // 12px/18px
        // xl: default line-height is 1.75rem (28px); overridden to 1.875rem (30px)
        xl: ['1.25rem', { lineHeight: '1.875rem' }], // 20px/30px
        // sm (14px/20px) and lg (18px/28px) already match Tailwind defaults — no override needed.
        // base already matches text-md (1rem/1.5rem = 16px/24px) — no override needed.
        ...FONT_SIZE_SCALE,
      },
      borderRadius: {
        DEFAULT: '0.5rem', // 8px (= md)
        none: '0rem', // 0px
        xxs: '0.125rem', // 2px
        xs: '0.25rem', // 4px
        sm: '0.375rem', // 6px
        md: '0.5rem', // 8px
        lg: '0.625rem', // 10px
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
        '3xl': '1.25rem', // 20px
        '4xl': '1.5rem', // 24px
        full: '9999px',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
        /* Figma Border / BORDER PRIMARY — not the same as colors.border.DEFAULT */
        primary: 'var(--border-primary)',
        /* Figma alpha 1 in both modes → opacity modifiers OK */
        brand: 'rgb(var(--border-brand) / <alpha-value>)',
        secondary: 'var(--border-secondary)',
        /* Same value as bg-brand-secondary — used for subtle teal borders on selected state */
        'brand-secondary': 'var(--bg-brand-secondary)',
      },
      backgroundColor: {
        /*
         * Figma Background / BG PRIMARY. `bg-primary` uses this, not `colors.primary`
         * (`--primary`) — keep both names distinct on purpose.
         */
        /* Figma BG PRIMARY — alpha 1 in both modes → opacity modifiers OK */
        primary: 'rgb(var(--bg-primary) / <alpha-value>)',
        'primary-alt': 'rgb(var(--bg-primary-alt) / <alpha-value>)',
        secondary: 'var(--bg-secondary)',
        'secondary-solid': 'rgb(var(--bg-secondary-solid) / <alpha-value>)',
        tertiary: 'var(--bg-tertiary)',
        quaternarry: 'var(--bg-quaternarry)',
        'brand-secondary': 'var(--bg-brand-secondary)',
        disabled: 'var(--bg-disabled)',
        'error-secondary': 'var(--bg-error-secondary)',
        'tab-bg': 'var(--bg-tab-bg)',
        tabs: 'var(--bg-tabs)',
        'yellow-secondary': 'var(--bg-yellow-secondary)',
        'orange-secondary': 'var(--bg-orange-secondary)',
        'blue-secondary': 'var(--bg-blue-secondary)',
        'dark-blue-secondary': 'var(--bg-dark-blue-secondary)',
        'lime-secondary': 'var(--bg-lime-secondary)',
        'tooltip-bg': 'var(--bg-tooltip-bg)',
        'chart-tooltip-bg': 'var(--bg-chart-tooltip-bg)',
        'menu-bg': 'var(--bg-menu-bg)',
        'secondary-btn-bg': 'var(--bg-secondary-btn-bg)',
        'secondary-btn-bg-hover': 'var(--bg-secondary-btn-bg-hover)',
        card: 'rgb(var(--bg-card) / <alpha-value>)',
        'hero-primary': 'rgb(var(--bg-hero-primary) / <alpha-value>)',
        'input-primary': 'rgb(var(--bg-input-primary) / <alpha-value>)',
      },
      colors: {
        /* Figma FG — alpha 1 in both modes → use rgb + <alpha-value> */
        'fg-primary': 'rgb(var(--fg-primary) / <alpha-value>)',
        'fg-secondary': 'var(--fg-secondary)',
        'fg-tertiary': 'var(--fg-tertiary)',
        'fg-disabled': 'var(--fg-disabled)',
        'fg-brand': 'rgb(var(--fg-brand) / <alpha-value>)',
        'fg-success': 'rgb(var(--fg-success) / <alpha-value>)',
        'fg-error': 'rgb(var(--fg-error) / <alpha-value>)',
        'fg-primary-alt': 'rgb(var(--fg-primary-alt) / <alpha-value>)',
        'fg-contrast': 'rgb(var(--fg-contrast) / <alpha-value>)',
        'fg-yellow': 'rgb(var(--fg-yellow) / <alpha-value>)',
        'fg-orange': 'rgb(var(--fg-orange) / <alpha-value>)',
        'fg-blue': 'rgb(var(--fg-blue) / <alpha-value>)',
        'fg-dark-blue': 'rgb(var(--fg-dark-blue) / <alpha-value>)',
        'fg-lime': 'rgb(var(--fg-lime) / <alpha-value>)',
        'app-bg': 'rgb(var(--app-bg) / <alpha-value>)',
        fire: 'rgb(var(--fire) / <alpha-value>)',
        'navitem-selected': 'rgb(var(--navitem-selected) / <alpha-value>)',
        'gray-highlight': 'rgb(var(--gray-highlight) / <alpha-value>)',
        'accent-1': 'rgb(var(--accent-1) / <alpha-value>)',
        'accent-2': 'rgb(var(--accent-2) / <alpha-value>)',
        'accent-3': 'rgb(var(--accent-3) / <alpha-value>)',
        cta1: 'rgb(var(--cta1) / <alpha-value>)',
        /* not to be confused with the figma tokens with a similar name e.g. border.primary: var(--border-primary) */
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover) / <alpha-value>)',
        'primary-foreground':
          'rgb(var(--primary-foreground) / <alpha-value>)',
        'primary-button-border':
          'rgb(var(--primary-button-border) / <alpha-value>)',
        'input-border-primary':
          'rgb(var(--input-border-primary) / <alpha-value>)',
        'label-primary': 'rgb(var(--label-primary) / <alpha-value>)',
        'label-secondary': 'rgb(var(--label-secondary) / <alpha-value>)',
        ocean: 'rgb(var(--ocean) / <alpha-value>)',
        'positive-trend': 'rgb(var(--positive-trend) / <alpha-value>)',
        'negative-trend': 'rgb(var(--negative-trend) / <alpha-value>)',
        grayish: 'rgb(var(--grayish) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
        },
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        green: 'rgb(var(--green) / <alpha-value>)',
        wind: 'rgb(var(--wind) / <alpha-value>)',
        'dark-gray': 'rgb(var(--dark-gray) / <alpha-value>)',
        'lime-green': 'rgb(var(--lime-green) / <alpha-value>)',
        charcoal: 'rgb(var(--charcoal) / <alpha-value>)',
        jet: 'rgb(var(--jet) / <alpha-value>)',
        'table-header': 'rgb(var(--table-header) / <alpha-value>)',
        'table-cell': 'rgb(var(--table-cell) / <alpha-value>)',
        darkgrey: 'rgb(var(--darkgrey) / <alpha-value>)',
      },
      textColor: {
        'slippage-warning': 'rgb(var(--slippage-warning) / <alpha-value>)',
        /*
         * Figma Text — not colors.primary. Tokens with alpha 1 in both modes use
         * rgb + <alpha-value>; baked Figma alpha uses var(...) (no /opacity).
         */
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        brand: 'rgb(var(--text-brand) / <alpha-value>)',
        placeholder: 'var(--text-placeholder)',
        disabled: 'var(--text-disabled)',
        success: 'rgb(var(--text-success) / <alpha-value>)',
        error: 'rgb(var(--text-error) / <alpha-value>)',
        'primary-alt': 'rgb(var(--text-primary-alt) / <alpha-value>)',
        contrast: 'rgb(var(--text-contrast) / <alpha-value>)',
        yellow: 'rgb(var(--text-yellow) / <alpha-value>)',
        orange: 'rgb(var(--text-orange) / <alpha-value>)',
        blue: 'rgb(var(--text-blue) / <alpha-value>)',
        'dark-blue': 'rgb(var(--text-dark-blue) / <alpha-value>)',
        lime: 'rgb(var(--text-lime) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Everett', ...fontFamily.sans],
        everett: ['var(--font-everett)', ...fontFamily.sans],
        // legacy style replaced by mono - clean up usages
        fira: ['var(--font-ibm-plex-mono)', ...fontFamily.mono],
        // Numeric-focused mono font (IBM Plex Mono)
        'mono-num': ['var(--font-ibm-plex-mono)', ...fontFamily.mono],
        // mono-num to be deleted once all usages cleaned up
        mono: ['var(--font-ibm-plex-mono)', ...fontFamily.mono],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
    require('tailwindcss-animate'),
    require('tailwind-scrollbar')({
      preferredStrategy: 'pseudoelements',
      nocompatible: true,
    }),
    require('@tailwindcss/container-queries'),
  ],
};


module.exports = {
  content: ['./src/**/*.{html,ts,tsx,svg}'],
  ...config,
}
