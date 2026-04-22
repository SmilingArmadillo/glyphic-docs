'use client'

import { useTheme, VALID_THEMES, type Theme } from '@/lib/theme'

const THEME_META: Record<Theme, { label: string; swatch: string }> = {
  'warm':      { label: 'Warm',   swatch: '#C8B88A' },
  'dark-tech': { label: 'Dark',   swatch: '#3ECF8E' },
  'indigo':    { label: 'Indigo', swatch: '#6366F1' },
}

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="px-3 py-3 border-t border-[hsl(var(--border))]">
      <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
        Theme
      </p>
      <div className="flex gap-2">
        {VALID_THEMES.map((key) => {
          const { label, swatch } = THEME_META[key]
          return (
            <button
              type="button"
              key={key}
              onClick={() => setTheme(key)}
              aria-label={label}
              aria-pressed={theme === key}
              className="flex flex-col items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded"
            >
              <span
                className="block w-5 h-5 rounded-full transition-shadow duration-150"
                style={{
                  background: swatch,
                  boxShadow:
                    theme === key
                      ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${swatch}`
                      : '0 0 0 1px rgba(0,0,0,0.1)',
                }}
              />
              <span className="text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
