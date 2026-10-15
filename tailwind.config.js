/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 10px)',
  			'sl': '8px'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			stage: {
				surface: '#090808',
				card: '#111010',
				border: 'rgba(255,255,255,0.08)',
				ink: '#F7F7F7',
				muted: '#9CA3AF',
        accent: '#C20000',
				'accent-soft': 'rgba(220,0,0,0.14)',
				warn: '#F59E0B',
				'warn-soft': 'rgba(245,158,11,0.12)'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)'],
  			jakarta: ['var(--font-jakarta)'],
  			inter: ['var(--font-inter)']
  		},
  		fontSize: {
          '2xs': ['0.75rem', { lineHeight: '1.125rem' }],
          xs: ['0.8125rem', { lineHeight: '1.25rem' }],
          sm: ['0.875rem', { lineHeight: '1.375rem' }],
          base: ['1rem', { lineHeight: '1.5rem' }],
          lg: ['1.125rem', { lineHeight: '1.625rem' }],
          xl: ['1.25rem', { lineHeight: '1.75rem' }],
          '2xl': ['1.75rem', { lineHeight: '2.125rem' }],
          '3xl': ['2rem', { lineHeight: '2.375rem' }],
          '4xl': ['2.5rem', { lineHeight: '2.875rem' }],
          title: ['1.5rem', { lineHeight: '2rem' }],
          section: ['1.125rem', { lineHeight: '1.625rem' }],
          body: ['0.875rem', { lineHeight: '1.375rem' }],
          micro: ['0.75rem', { lineHeight: '1.125rem' }],
  		},
  		boxShadow: {
  			soft: '0 1px 0 rgba(255,255,255,0.035), 0 14px 34px -24px rgba(0,0,0,0.95)',
  			elev: '0 1px 0 rgba(255,255,255,0.045), 0 22px 54px -28px rgba(0,0,0,0.95)',
  			pop: '0 1px 0 rgba(255,255,255,0.045), 0 24px 60px -20px rgba(0,0,0,0.85)',
  			glow: '0 0 0 1px rgba(220,0,0,0.32), 0 18px 42px -24px rgba(220,0,0,0.72)'
  		},
  		letterSpacing: {
  			tightest: '-0.04em'
  		},
  		keyframes: {
  			'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  			'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
  			'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
  			'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.2s ease-out',
  			'slide-up': 'slide-up 0.28s cubic-bezier(0.16,1,0.3,1)'
  		}
    }
  },
  plugins: [require("tailwindcss-animate")],
}
