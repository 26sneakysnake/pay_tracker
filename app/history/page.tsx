import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { DeleteBulletinButton } from '@/components/history/DeleteBulletinButton'
import { Download, Plus, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const bulletins = await prisma.bulletin.findMany({
    orderBy: { periodStart: 'desc' },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      employerName: true,
      brutBase: true,
      netApayer: true,
      cotisationsSalariales: true,
      heuresTravaillees: true,
      joursTeletravail: true,
      nombreTitresRestaurant: true,
      fileName: true,
      createdAt: true,
    },
  })

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique</h1>
          <p className="text-sm text-white/30 mt-1">
            {bulletins.length} bulletin{bulletins.length !== 1 ? 's' : ''} enregistré{bulletins.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all"
          >
            <Download size={13} />
            Exporter CSV
          </a>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white transition-all"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <Plus size={13} />
            Ajouter
          </Link>
        </div>
      </div>

      {bulletins.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center"
          style={{
            background: 'rgba(18, 18, 26, 0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-white/30">Aucun bulletin enregistré</p>
          <Link
            href="/upload"
            className="px-4 py-2 rounded-xl text-sm text-white transition-all"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            Importer un bulletin
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(18, 18, 26, 0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  'Période',
                  'Employeur',
                  'Brut',
                  'Net à payer',
                  'Cotisations',
                  'Heures',
                  'TLT',
                  'TR',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b, idx) => (
                <tr
                  key={b.id}
                  className="group transition-colors"
                  style={{
                    borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white/70 capitalize">
                      {formatDate(b.periodStart)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white/40">{b.employerName ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono text-blue-400">{formatCurrency(b.brutBase)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono font-semibold text-emerald-400">
                      {formatCurrency(b.netApayer)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono text-amber-400">
                      {formatCurrency(b.cotisationsSalariales)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white/30">
                      {b.heuresTravaillees ? `${b.heuresTravaillees}h` : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white/30">
                      {(b.joursTeletravail ?? 0) > 0 ? `${b.joursTeletravail}j` : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white/30">
                      {(b.nombreTitresRestaurant ?? 0) > 0 ? `×${b.nombreTitresRestaurant}` : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/bulletin/${b.id}`}
                        className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink size={11} />
                        Voir
                      </Link>
                      <DeleteBulletinButton id={b.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {bulletins.length > 1 && (
        <div
          className="rounded-2xl p-4 grid grid-cols-3 gap-4"
          style={{
            background: 'rgba(18, 18, 26, 0.5)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {[
            {
              label: 'Total brut',
              value: formatCurrency(bulletins.reduce((s, b) => s + b.brutBase, 0)),
              color: 'text-blue-400',
            },
            {
              label: 'Total net',
              value: formatCurrency(bulletins.reduce((s, b) => s + b.netApayer, 0)),
              color: 'text-emerald-400',
            },
            {
              label: 'Total cotisations',
              value: formatCurrency(bulletins.reduce((s, b) => s + b.cotisationsSalariales, 0)),
              color: 'text-amber-400',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-white/25">{label}</p>
              <p className={`text-sm font-mono font-semibold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
