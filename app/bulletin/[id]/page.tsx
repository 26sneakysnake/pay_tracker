import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { BulletinEditForm } from '@/components/bulletin/BulletinEditForm'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, Euro } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function BulletinPage({ params }: Props) {
  // New bulletin — empty form
  if (params.id === 'new') {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.08] text-white/40 hover:text-white transition-all"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Nouveau bulletin</h1>
            <p className="text-sm text-white/30 mt-0.5">Saisie manuelle de vos données</p>
          </div>
        </div>
        <BulletinEditForm bulletin={null} />
      </div>
    )
  }

  const bulletin = await prisma.bulletin.findUnique({
    where: { id: params.id },
  })

  if (!bulletin) notFound()

  const tauxCotisation = (bulletin.cotisationsSalariales / bulletin.brutBase) * 100
  const ratioNetBrut = (bulletin.netApayer / bulletin.brutBase) * 100
  const tauxHoraireNet = bulletin.heuresTravaillees
    ? bulletin.netApayer / bulletin.heuresTravaillees
    : null

  const summaryCards = [
    { label: 'Brut de base', value: formatCurrency(bulletin.brutBase), color: 'text-blue-400', icon: Euro },
    { label: 'Net à payer', value: formatCurrency(bulletin.netApayer), color: 'text-emerald-400', icon: Euro },
    {
      label: 'Cotisations',
      value: formatCurrency(bulletin.cotisationsSalariales),
      subtitle: formatPercent(tauxCotisation) + ' du brut',
      color: 'text-amber-400',
      icon: Euro,
    },
    {
      label: 'Ratio net/brut',
      value: formatPercent(ratioNetBrut),
      color: ratioNetBrut >= 85 ? 'text-emerald-400' : 'text-white/60',
      icon: Euro,
    },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.08] text-white/40 hover:text-white transition-all"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              Bulletin de {formatDate(bulletin.periodStart)}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {bulletin.employerName && (
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Building2 size={11} />
                  {bulletin.employerName}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-white/30">
                <Calendar size={11} />
                {new Date(bulletin.periodStart).toLocaleDateString('fr-FR')} –{' '}
                {new Date(bulletin.periodEnd).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, subtitle, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: 'rgba(18, 18, 26, 0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            {subtitle && <p className="text-[10px] text-white/20">{subtitle}</p>}
          </div>
        ))}
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Taux PAS',
            value: bulletin.tauxPrelevementSource === 0
              ? 'Non imposable'
              : formatPercent(bulletin.tauxPrelevementSource ?? 0),
            color: bulletin.tauxPrelevementSource === 0 ? 'text-emerald-400' : 'text-white/60',
          },
          {
            label: 'Heures travaillées',
            value: bulletin.heuresTravaillees ? `${bulletin.heuresTravaillees}h` : '—',
            color: 'text-white/60',
          },
          {
            label: 'Taux horaire net',
            value: tauxHoraireNet ? `${formatCurrency(tauxHoraireNet)}/h` : '—',
            color: 'text-white/60',
          },
          {
            label: 'Télétravail',
            value:
              (bulletin.joursTeletravail ?? 0) > 0
                ? `${bulletin.joursTeletravail} jour${(bulletin.joursTeletravail ?? 0) > 1 ? 's' : ''}`
                : '—',
            color: 'text-white/60',
          },
          {
            label: 'Titres-restaurant',
            value:
              (bulletin.nombreTitresRestaurant ?? 0) > 0
                ? `${bulletin.nombreTitresRestaurant} × ${formatCurrency(bulletin.valeurTitreRestaurant ?? 0)}`
                : '—',
            color: 'text-white/60',
          },
          {
            label: 'Net imposable',
            value: bulletin.netImposable ? formatCurrency(bulletin.netImposable) : '—',
            color: 'text-white/60',
          },
          {
            label: 'Montant net social',
            value: bulletin.montantNetSocial ? formatCurrency(bulletin.montantNetSocial) : '—',
            color: 'text-white/60',
          },
          {
            label: 'Coût employeur',
            value: bulletin.coutEmployeurTotal ? formatCurrency(bulletin.coutEmployeurTotal) : '—',
            color: 'text-white/60',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <p className="text-[10px] text-white/25">{label}</p>
            <p className={`text-sm font-mono mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Cotisations breakdown */}
      {(bulletin.cotisationMaladie || bulletin.cotisationRetraite || bulletin.csgDeductible || bulletin.csgNonDeductible) && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: 'rgba(18, 18, 26, 0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h3 className="text-sm font-semibold text-white/50">Détail des cotisations salariales</h3>
          <div className="space-y-2">
            {[
              { label: 'Assurance maladie', value: bulletin.cotisationMaladie, color: '#8B5CF6' },
              { label: 'Retraite (AGIRC-ARRCO)', value: bulletin.cotisationRetraite, color: '#3B82F6' },
              { label: 'CSG déductible', value: bulletin.csgDeductible, color: '#F59E0B' },
              { label: 'CSG/CRDS non déductible', value: bulletin.csgNonDeductible, color: '#EF4444' },
            ]
              .filter(({ value }) => value !== null && value !== undefined && value > 0)
              .map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm text-white/40">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-white/60">
                      {formatCurrency(value!)}
                    </span>
                    <span className="text-[10px] text-white/20 ml-2">
                      {formatPercent((value! / bulletin.brutBase) * 100)}
                    </span>
                  </div>
                </div>
              ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <span className="text-sm font-medium text-white/50">Total cotisations</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {formatCurrency(bulletin.cotisationsSalariales)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      <BulletinEditForm bulletin={bulletin} />
    </div>
  )
}
