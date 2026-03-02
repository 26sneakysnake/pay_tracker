import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')

  const where = year
    ? {
        periodStart: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      }
    : {}

  const bulletins = await prisma.bulletin.findMany({
    where,
    orderBy: { periodStart: 'asc' },
  })

  const headers = [
    'Période',
    'Employeur',
    'SIRET',
    'Brut de base',
    'Cotisations salariales',
    'Net avant impôt',
    'Taux PAS (%)',
    'Montant PAS',
    'Net à payer',
    'Montant net social',
    'Nb titres-restaurant',
    'Valeur titre (€)',
    'Montant TR',
    'Heures travaillées',
    'Taux horaire',
    'Coût employeur',
    'Cotisations patronales',
    'Cotisation maladie',
    'Cotisation retraite',
    'CSG déductible',
    'CSG/CRDS non déductible',
    'Net imposable',
    'Jours télétravail',
    'Fichier',
    'Date import',
  ]

  function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '""'
    const s = String(value).replace(/"/g, '""')
    return `"${s}"`
  }

  const rows = bulletins.map((b) => [
    escapeCSV(new Date(b.periodStart).toISOString().slice(0, 7)),
    escapeCSV(b.employerName),
    escapeCSV(b.employerSiret),
    escapeCSV(b.brutBase.toFixed(2)),
    escapeCSV(b.cotisationsSalariales.toFixed(2)),
    escapeCSV(b.netAvantImpot.toFixed(2)),
    escapeCSV(((b.tauxPrelevementSource ?? 0) * 100).toFixed(2)),
    escapeCSV((b.montantPrelevementSource ?? 0).toFixed(2)),
    escapeCSV(b.netApayer.toFixed(2)),
    escapeCSV(b.montantNetSocial?.toFixed(2)),
    escapeCSV(b.nombreTitresRestaurant),
    escapeCSV(b.valeurTitreRestaurant?.toFixed(2)),
    escapeCSV(b.montantTitresRestaurant?.toFixed(2)),
    escapeCSV(b.heuresTravaillees?.toFixed(2)),
    escapeCSV(b.tauxHoraire?.toFixed(4)),
    escapeCSV(b.coutEmployeurTotal?.toFixed(2)),
    escapeCSV(b.cotisationsPatronales?.toFixed(2)),
    escapeCSV(b.cotisationMaladie?.toFixed(2)),
    escapeCSV(b.cotisationRetraite?.toFixed(2)),
    escapeCSV(b.csgDeductible?.toFixed(2)),
    escapeCSV(b.csgNonDeductible?.toFixed(2)),
    escapeCSV(b.netImposable?.toFixed(2)),
    escapeCSV(b.joursTeletravail),
    escapeCSV(b.fileName),
    escapeCSV(new Date(b.createdAt).toLocaleDateString('fr-FR')),
  ])

  const csv =
    '\uFEFF' + // BOM for Excel compatibility
    [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n')

  const filename = year ? `paytrack-${year}.csv` : 'paytrack-export.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
