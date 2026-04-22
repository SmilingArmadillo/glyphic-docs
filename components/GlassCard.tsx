import type { ReactNode } from 'react'

interface GlassCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
}

export default function GlassCard({ title, icon, children }: GlassCardProps) {
  return (
    <div
      className="rounded-xl p-4 my-4"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</span>
      </div>
      <div className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
        {children}
      </div>
    </div>
  )
}
