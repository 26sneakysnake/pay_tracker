'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatDateShort, formatPercent } from '@/lib/utils'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletins: Bulletin[]
}

export function EfficiencyChart({ bulletins }: Props) {
  const data = bulletins.map((b) => {
    const ratio = (b.netApayer / b.brutBase) * 100
    return {
      label: formatDateShort(new Date(b.periodStart)),
      ratio: parseFloat(ratio.toFixed(1)),
    }
  })

  const avg = data.reduce((s, d) => s + d.ratio, 0) / data.length

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Ratio Net / Brut</h3>
        <span className="text-xs font-mono text-white/40">
          Moy. {formatPercent(avg)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            domain={[70, 100]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(12, 12, 22, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#F1F5F9',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`, 'Ratio net/brut']}
          />
          <ReferenceLine
            y={avg}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 2"
            label={{ value: `Moy.`, fill: 'rgba(255,255,255,0.2)', fontSize: 10, position: 'right' }}
          />
          <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.ratio >= avg ? '#10B981' : '#F59E0B'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
