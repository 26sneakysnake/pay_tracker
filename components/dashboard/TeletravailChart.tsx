'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDateShort } from '@/lib/utils'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletins: Bulletin[]
}

export function TeletravailChart({ bulletins }: Props) {
  const withTLT = bulletins.filter((b) => (b.joursTeletravail ?? 0) > 0)

  if (withTLT.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col items-center justify-center h-40 gap-2"
        style={{
          background: 'rgba(18, 18, 26, 0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-2xl">🏠</span>
        <p className="text-sm text-white/30">Aucune donnée télétravail détectée</p>
      </div>
    )
  }

  const data = bulletins.map((b) => ({
    label: formatDateShort(new Date(b.periodStart)),
    jours: b.joursTeletravail ?? 0,
  }))

  const total = data.reduce((s, d) => s + d.jours, 0)
  const avg = total / bulletins.length

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">🏠 Télétravail</h3>
        <div className="text-right">
          <p className="text-xs text-white/30">{total}j total · {avg.toFixed(1)}j/mois</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(12, 12, 22, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#F1F5F9',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} jours`, 'Télétravail']}
          />
          <Bar dataKey="jours" fill="#8B5CF6" opacity={0.8} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
