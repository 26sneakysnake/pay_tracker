import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import {
  MINIMUM_STAGE_HORAIRE_2026,
  MINIMUM_STAGE_MENSUEL_2026,
  SMIC_NET_MENSUEL_2026,
  SMIC_HORAIRE_BRUT_2026,
} from '@/lib/calculations'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletin: Bulletin
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function BenchmarkCard({ bulletin }: Props) {
  const { brutBase, netApayer, heuresTravaillees, tauxHoraire } = bulletin

  const minimumLegal = heuresTravaillees
    ? heuresTravaillees * MINIMUM_STAGE_HORAIRE_2026
    : MINIMUM_STAGE_MENSUEL_2026

  const percentAboveMin = ((netApayer - minimumLegal) / minimumLegal) * 100
  const percentOfSmicNet = (netApayer / SMIC_NET_MENSUEL_2026) * 100
  const tauxHoraireNet = heuresTravaillees ? netApayer / heuresTravaillees : null

  const benchmarks = [
    {
      label: 'vs Minimum légal de stage',
      sublabel: `${formatCurrency(MINIMUM_STAGE_HORAIRE_2026)}/h × ${heuresTravaillees ?? 151.67}h = ${formatCurrency(minimumLegal)}`,
      value: netApayer,
      reference: minimumLegal,
      pct: percentAboveMin,
      color: percentAboveMin >= 0 ? 'bg-emerald-500' : 'bg-red-500',
      positive: percentAboveMin >= 0,
    },
    {
      label: 'vs SMIC net mensuel',
      sublabel: `Référence : ${formatCurrency(SMIC_NET_MENSUEL_2026)}`,
      value: netApayer,
      reference: SMIC_NET_MENSUEL_2026,
      pct: percentOfSmicNet - 100,
      color: percentOfSmicNet >= 100 ? 'bg-emerald-500' : 'bg-amber-500',
      positive: percentOfSmicNet >= 100,
    },
  ]

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-sm font-semibold text-white/70">Benchmarks 2026</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map((b) => (
          <div key={b.label} className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-white/60">{b.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{b.sublabel}</p>
              </div>
              <span
                className={cn(
                  'text-xs font-mono font-semibold px-1.5 py-0.5 rounded',
                  b.positive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-red-400 bg-red-500/10',
                )}
              >
                {b.positive ? '+' : ''}{formatPercent(b.pct)}
              </span>
            </div>

            <ProgressBar
              value={b.value}
              max={Math.max(b.value, b.reference) * 1.1}
              color={b.color}
            />

            <div className="flex justify-between text-[10px] text-white/25 font-mono">
              <span>0€</span>
              <span>{formatCurrency(b.reference)}</span>
              <span className="text-white/50">{formatCurrency(b.value)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Taux horaire net */}
      {tauxHoraireNet !== null && (
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div>
            <p className="text-xs text-white/50">Taux horaire net effectif</p>
            <p className="text-[10px] text-white/25 mt-0.5">
              vs minimum stage {formatCurrency(MINIMUM_STAGE_HORAIRE_2026)}/h
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-emerald-400">
              {formatCurrency(tauxHoraireNet)}/h
            </p>
            <p className="text-[10px] text-emerald-400/50 mt-0.5">
              +{formatPercent(((tauxHoraireNet - MINIMUM_STAGE_HORAIRE_2026) / MINIMUM_STAGE_HORAIRE_2026) * 100)} min légal
            </p>
          </div>
        </div>
      )}

      {/* SMIC info */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.04]">
        {[
          { label: 'SMIC net/mois', value: formatCurrency(SMIC_NET_MENSUEL_2026) },
          { label: 'Min. stage/h', value: formatCurrency(MINIMUM_STAGE_HORAIRE_2026) },
          { label: 'SMIC brut/h', value: formatCurrency(SMIC_HORAIRE_BRUT_2026) },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-[10px] text-white/25">{item.label}</p>
            <p className="text-xs font-mono text-white/40 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
