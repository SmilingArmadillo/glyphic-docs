'use client'

import { useTheme, type Theme } from '@/lib/theme'

const THEMES: { key: Theme; label: string; swatch: string }[] = [
  { key: 'warm',      label: 'Warm',       swatch: '#C8B88A' },
  { key: 'dark-tech', label: 'Dark',       swatch: '#3ECF8E' },
  { key: 'indigo',    label: 'Indigo',     swatch: '#6366F1' },
]

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="px-3 py-3 border-t border-[hsl(var(--border))]">
      <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
        Theme
      </p>
      <div className="flex gap-2">
        {THEMES.map(({ key, label, swatch }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={label}
            className="flex flex-col items-center gap-1 group"
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
        ))}
      </div>
    </div>
  )
}
