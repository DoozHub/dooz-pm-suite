import { cn } from '../lib/utils'

const stateConfig = {
  research: { label: 'Research', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  planning: { label: 'Planning', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  execution: { label: 'Execution', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  archived: { label: 'Archived', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
}

interface StateBadgeProps {
  state: string
  size?: 'sm' | 'md'
}

export default function StateBadge({ state, size = 'sm' }: StateBadgeProps) {
  const config = stateConfig[state as keyof typeof stateConfig] || {
    label: state,
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  )
}
