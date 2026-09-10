/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 3px)',
  			sm: 'calc(var(--radius) - 6px)',
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
  				surface: '#F8FAFC',
  				card: '#FFFFFF',
  				border: '#E2E8F0',
  				ink: '#0F172A',
  				muted: '#64748B',
  				accent: '#4F46E5',
  				'accent-soft': '#EEF2FF',
  				warn: '#D97706',
  				'warn-soft': '#FEF3C7'
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
  			'2xs': ['clamp(0.69rem, 0.67rem + 0.08vw, 0.76rem)', { lineHeight: '1rem' }],
  			xs: ['clamp(0.76rem, 0.74rem + 0.1vw, 0.84rem)', { lineHeight: '1.1rem' }],
  			sm: ['clamp(0.84rem, 0.81rem + 0.13vw, 0.94rem)', { lineHeight: '1.35rem' }],
  			base: ['clamp(0.94rem, 0.9rem + 0.18vw, 1.06rem)', { lineHeight: '1.55rem' }],
  			lg: ['clamp(1.06rem, 1rem + 0.25vw, 1.25rem)', { lineHeight: '1.65rem' }],
  			xl: ['clamp(1.22rem, 1.13rem + 0.4vw, 1.6rem)', { lineHeight: '1.95rem' }],
  			'2xl': ['clamp(1.5rem, 1.3rem + 0.85vw, 2.15rem)', { lineHeight: '2.2rem' }],
  			'3xl': ['clamp(1.85rem, 1.5rem + 1.6vw, 2.95rem)', { lineHeight: '2.95rem' }],
  			'4xl': ['clamp(2.3rem, 1.7rem + 2.8vw, 4rem)', { lineHeight: '1.04' }],
  			'title': ['1.5rem', { lineHeight: '2rem' }],
  			'section': ['1.125rem', { lineHeight: '1.65rem' }],
  			'body': ['0.875rem', { lineHeight: '1.35rem' }],
  			'micro': ['0.75rem', { lineHeight: '1.05rem' }]
  		},
  		boxShadow: {
  			soft: '0 1px 2px rgba(0,0,0,0.4), 0 6px 18px -8px rgba(0,0,0,0.4)',
  			elev: '0 10px 32px -12px rgba(0,0,0,0.6)',
  			pop: '0 18px 48px -16px rgba(0,0,0,0.7)',
  			glow: '0 0 0 1px rgba(194,0,0,0.35), 0 10px 36px -12px rgba(194,0,0,0.4)'
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
