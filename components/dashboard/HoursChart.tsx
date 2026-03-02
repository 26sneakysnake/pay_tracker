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
import { formatDateShort, formatCurrency } from '@/lib/utils'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletins: Bulletin[]
}

export function HoursChart({ bulletins }: Props) {
  const withHours = bulletins.filter((b) => b.heuresTravaillees !== null)

  if (withHours.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center h-48"
        style={{
          background: 'rgba(18, 18, 26, 0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-sm text-white/30">Données d&apos;heures non disponibles</p>
      </div>
    )
  }

  const data = withHours.map((b) => {
    const hours = b.heuresTravaillees!
    const tauxNet = b.netApayer / hours
    return {
      label: formatDateShort(new Date(b.periodStart)),
      heures: hours,
      'Taux net (€/h)': parseFloat(tauxNet.toFixed(2)),
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
      <h3 className="text-sm font-semibold text-white/70">Heures travaillées & taux horaire net</h3>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
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
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(12, 12, 22, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#F1F5F9',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              name === 'heures' ? `${value}h` : formatCurrency(value),
              name === 'heures' ? 'Heures' : 'Taux net',
            ]}
          />
          <Bar dataKey="heures" fill="#3B82F6" opacity={0.8} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Average hourly rate */}
      {data.length > 0 && (
        <div className="pt-2 border-t border-white/[0.04]">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/30">Taux horaire net moyen</span>
            <span className="text-sm font-mono font-semibold text-blue-400">
              {formatCurrency(data.reduce((s, d) => s + d['Taux net (€/h)'], 0) / data.length)}/h
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
