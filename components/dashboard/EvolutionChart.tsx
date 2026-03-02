'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletins: Bulletin[]
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm space-y-1.5 shadow-2xl"
      style={{
        background: 'rgba(12, 12, 22, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <p className="text-white/60 text-xs font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-3">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-white/50 text-xs">{entry.name}</span>
          <span className="text-white font-mono font-medium ml-auto">
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function EvolutionChart({ bulletins }: Props) {
  const data = bulletins.map((b) => ({
    label: formatDateShort(new Date(b.periodStart)),
    'Net à payer': Math.round(b.netApayer * 100) / 100,
    Brut: Math.round(b.brutBase * 100) / 100,
    Cotisations: Math.round(b.cotisationsSalariales * 100) / 100,
    ...(b.coutEmployeurTotal ? { 'Coût employeur': Math.round(b.coutEmployeurTotal * 100) / 100 } : {}),
  }))

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-sm font-semibold text-white/70">Évolution mensuelle</h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, paddingTop: '8px' }}
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="Net à payer"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Brut"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 3, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Cotisations"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Coût employeur"
            stroke="#8B5CF6"
            strokeWidth={1.5}
            strokeDasharray="3 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
