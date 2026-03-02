'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletins: Bulletin[]
}

export function CumulativeChart({ bulletins }: Props) {
  let cumNet = 0
  let cumBrut = 0

  const data = bulletins.map((b) => {
    cumNet += b.netApayer
    cumBrut += b.brutBase
    return {
      label: formatDateShort(new Date(b.periodStart)),
      'Net cumulé': Math.round(cumNet),
      'Brut cumulé': Math.round(cumBrut),
    }
  })

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-sm font-semibold text-white/70">Cumul annuel</h3>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="brutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k€`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(12, 12, 22, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#F1F5F9',
              fontSize: 12,
            }}
            formatter={(value: number) => [formatCurrency(value), '']}
          />
          <Area
            type="monotone"
            dataKey="Brut cumulé"
            stroke="#3B82F6"
            fill="url(#brutGrad)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="Net cumulé"
            stroke="#10B981"
            fill="url(#netGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
