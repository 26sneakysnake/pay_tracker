'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletin: Bulletin
}

const SLICES = [
  { key: 'netApayer', label: 'Net à payer', color: '#10B981' },
  { key: 'cotisationRetraite', label: 'Retraite', color: '#3B82F6' },
  { key: 'csgDeductible', label: 'CSG déductible', color: '#F59E0B' },
  { key: 'csgNonDeductible', label: 'CSG/CRDS', color: '#EF4444' },
  { key: 'cotisationMaladie', label: 'Maladie', color: '#8B5CF6' },
  { key: 'montantPrelevementSource', label: 'Prélèvement source', color: '#EC4899' },
]

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null
  const { name, value, payload: p } = payload[0]

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm space-y-1 shadow-2xl"
      style={{
        background: 'rgba(12, 12, 22, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: p?.fill }} />
        <span className="text-white/60 text-xs">{name}</span>
      </div>
      <p className="text-white font-mono font-bold">{formatCurrency(value as number)}</p>
      <p className="text-white/30 text-xs">{formatPercent(p?.pct ?? 0)}</p>
    </div>
  )
}

export function CotisationsDonut({ bulletin }: Props) {
  const brut = bulletin.brutBase
  const entries = SLICES
    .map((s) => ({
      name: s.label,
      value: (bulletin[s.key as keyof Bulletin] as number | null) ?? 0,
      color: s.color,
    }))
    .filter((e) => e.value > 0)
    .map((e) => ({ ...e, pct: (e.value / brut) * 100 }))

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-sm font-semibold text-white/70">Répartition du brut</h3>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
          >
            {entries.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-xs text-white/40 flex-1">{entry.name}</span>
            <span className="text-xs font-mono text-white/60">
              {formatCurrency(entry.value)}
            </span>
            <span className="text-xs text-white/25 w-10 text-right">
              {formatPercent(entry.pct, 1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
