'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  format?: 'currency' | 'percent' | 'number' | 'hours' | 'days'
  icon: LucideIcon
  delta?: number
  deltaPercent?: number
  subtitle?: string
  accentColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  className?: string
  animationDelay?: number
}

const colorMap = {
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400' },
  green:  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  yellow: { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: 'text-amber-400' },
  red:    { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: 'text-red-400' },
  purple: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400' },
  gray:   { text: 'text-slate-300',  bg: 'bg-white/[0.04]',  border: 'border-white/10',      icon: 'text-slate-400' },
}

function useCountUp(target: number, duration = 1000, delay = 0): number {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTimeRef.current = undefined

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setCurrent(target * eased)
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return current
}

function formatValue(value: number, format: KPICardProps['format']): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'hours':
      return `${value.toFixed(0)}h`
    case 'days':
      return `${value.toFixed(0)}j`
    default:
      return value.toFixed(2)
  }
}

export function KPICard({
  title,
  value,
  format = 'currency',
  icon: Icon,
  delta,
  deltaPercent,
  subtitle,
  accentColor = 'blue',
  className,
  animationDelay = 0,
}: KPICardProps) {
  const animatedValue = useCountUp(value, 900, animationDelay)
  const colors = colorMap[accentColor]

  return (
    <div
      className={cn(
        'glass rounded-2xl p-5 space-y-4',
        'hover:border-white/[0.12] transition-all duration-200',
        'animate-slide-up',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider leading-tight">
          {title}
        </p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon size={15} className={colors.icon} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p className={cn('text-2xl font-bold tracking-tight font-mono', colors.text)}>
          {formatValue(animatedValue, format)}
        </p>
        {subtitle && (
          <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Delta */}
      {(delta !== undefined || deltaPercent !== undefined) && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
          {delta !== undefined && (
            <span
              className={cn(
                'text-xs font-mono font-medium',
                delta >= 0 ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {delta >= 0 ? '+' : ''}
              {format === 'currency'
                ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(delta)
                : delta.toFixed(1)}
            </span>
          )}
          {deltaPercent !== undefined && (
            <span
              className={cn(
                'text-xs',
                deltaPercent >= 0 ? 'text-emerald-400/60' : 'text-red-400/60',
              )}
            >
              ({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
            </span>
          )}
          <span className="text-xs text-white/20 ml-auto">vs mois préc.</span>
        </div>
      )}
    </div>
  )
}
