import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { getContractProgress } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  const bulletins = await prisma.bulletin.findMany({
    orderBy: { periodStart: 'asc' },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      netApayer: true,
      brutBase: true,
      employerName: true,
    },
  })

  if (bulletins.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Timeline</h1>
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'rgba(18, 18, 26, 0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-white/30">Aucun bulletin disponible</p>
          <Link
            href="/upload"
            className="inline-block mt-4 px-4 py-2 rounded-xl text-sm text-white"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            Importer un bulletin
          </Link>
        </div>
      </div>
    )
  }

  const firstBulletin = bulletins[0]
  const firstDate = new Date(firstBulletin.periodStart)
  const progress = getContractProgress(firstDate, 6)

  const today = new Date()
  const totalNet = bulletins.reduce((s, b) => s + b.netApayer, 0)
  const avgNet = totalNet / bulletins.length
  const projectedTotal = avgNet * 6

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Timeline du contrat</h1>
        <p className="text-sm text-white/30 mt-1">
          {firstBulletin.employerName ?? 'Employeur'} · 6 mois estimés
        </p>
      </div>

      {/* Progress overview */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: 'rgba(18, 18, 26, 0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Contract progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-white/40 text-xs">Début du contrat</p>
              <p className="text-white/70 font-medium capitalize">
                {progress.startDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-blue-400">
                {progress.progressPercent.toFixed(0)}%
              </p>
              <p className="text-xs text-white/30 mt-1">avancement</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">Fin estimée</p>
              <p className="text-white/70 font-medium capitalize">
                {progress.estimatedEndDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress.progressPercent}%`,
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
              }}
            />
            {/* Today marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-400 shadow-lg"
              style={{
                left: `calc(${progress.progressPercent}% - 6px)`,
                boxShadow: '0 0 8px rgba(59,130,246,0.6)',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/20 font-mono">
            <span>Mois 1</span>
            <span className="text-white/40">
              {progress.monthsElapsed} mois écoulés · {progress.monthsRemaining} restants
            </span>
            <span>Mois 6</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.04]">
          {[
            {
              label: 'Net total perçu',
              value: formatCurrency(totalNet),
              color: 'text-emerald-400',
            },
            {
              label: 'Moyenne mensuelle',
              value: formatCurrency(avgNet),
              color: 'text-blue-400',
            },
            {
              label: 'Projection 6 mois',
              value: formatCurrency(projectedTotal),
              color: 'text-violet-400',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-white/25">{label}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">
          Bulletins par mois
        </h2>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />

          <div className="space-y-3 pl-12">
            {bulletins.map((b, idx) => {
              const date = new Date(b.periodStart)
              const isLatest = idx === bulletins.length - 1
              const isPast = date < today

              return (
                <div key={b.id} className="relative">
                  {/* Dot on timeline */}
                  <div
                    className="absolute -left-8 top-4 w-3 h-3 rounded-full border-2"
                    style={{
                      background: isLatest ? '#10B981' : isPast ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                      borderColor: isLatest ? '#10B981' : isPast ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                      boxShadow: isLatest ? '0 0 8px rgba(16,185,129,0.5)' : undefined,
                    }}
                  />

                  <Link href={`/bulletin/${b.id}`}>
                    <div
                      className="rounded-xl p-4 transition-all duration-150 cursor-pointer"
                      style={{
                        background: isLatest
                          ? 'rgba(16,185,129,0.08)'
                          : 'rgba(18, 18, 26, 0.7)',
                        border: isLatest
                          ? '1px solid rgba(16,185,129,0.2)'
                          : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white/70 capitalize">
                            {formatDate(date)}
                            {isLatest && (
                              <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Dernier
                              </span>
                            )}
                          </p>
                          {b.employerName && (
                            <p className="text-xs text-white/30 mt-0.5">{b.employerName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono text-emerald-400">
                            {formatCurrency(b.netApayer)}
                          </p>
                          <p className="text-xs text-white/25 mt-0.5">
                            Brut {formatCurrency(b.brutBase)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}

            {/* Future months placeholder */}
            {progress.monthsRemaining > 0 &&
              Array.from({ length: Math.min(progress.monthsRemaining, 3) }).map((_, i) => {
                const futureDate = new Date(
                  bulletins[bulletins.length - 1].periodEnd
                )
                futureDate.setMonth(futureDate.getMonth() + i + 1)

                return (
                  <div key={`future-${i}`} className="relative opacity-30">
                    <div
                      className="absolute -left-8 top-4 w-3 h-3 rounded-full border-2 border-dashed"
                      style={{
                        background: 'transparent',
                        borderColor: 'rgba(255,255,255,0.2)',
                      }}
                    />
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: 'rgba(18, 18, 26, 0.4)',
                        border: '1px dashed rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/30 capitalize">
                          {futureDate.toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm font-mono text-white/20">
                          ~ {formatCurrency(avgNet)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
