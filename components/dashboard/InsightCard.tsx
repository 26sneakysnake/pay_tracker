import { cn } from '@/lib/utils'
import type { Insight } from '@/lib/insights'
import { Info, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react'

const CONFIG = {
  info: {
    icon: Info,
    colors: 'border-blue-500/20 text-blue-400',
    bg: 'bg-blue-500/8',
    dot: 'bg-blue-400',
  },
  success: {
    icon: CheckCircle2,
    colors: 'border-emerald-500/20 text-emerald-400',
    bg: 'bg-emerald-500/8',
    dot: 'bg-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'border-amber-500/20 text-amber-400',
    bg: 'bg-amber-500/8',
    dot: 'bg-amber-400',
  },
  alert: {
    icon: AlertOctagon,
    colors: 'border-red-500/20 text-red-400',
    bg: 'bg-red-500/8',
    dot: 'bg-red-400',
  },
}

export function InsightCard({ insight }: { insight: Insight }) {
  const config = CONFIG[insight.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-xl p-4 border space-y-2.5 transition-all duration-200',
        config.colors,
        'hover:border-opacity-40',
      )}
      style={{ background: 'rgba(18, 18, 26, 0.6)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-white/70">{insight.title}</p>
        </div>
        {insight.value && (
          <span className="text-sm font-mono font-bold flex-shrink-0">
            {insight.value}
          </span>
        )}
      </div>

      {/* Message */}
      <p className="text-xs text-white/40 leading-relaxed">{insight.message}</p>
    </div>
  )
}
