/**
 * PayTrack — Financial Calculations
 * Pure functions for all financial computations
 */

import { Bulletin } from '@prisma/client'

// 2026 reference values
export const SMIC_HORAIRE_BRUT_2026 = 11.88 // €/h gross
export const MINIMUM_STAGE_HORAIRE_2026 = 3.90 // €/h (legal minimum for interns)
export const MINIMUM_STAGE_MENSUEL_2026 = 591.0 // ~35h/week × 3.90 × (52*35/12)
export const SMIC_NET_MENSUEL_2026 = 1426.0 // approximate net SMIC 2026
export const HEURES_MENSUEL_REFERENCE = 151.67 // 35h/week average

export interface MonthlyStats {
  id: string
  month: string // "YYYY-MM"
  label: string // "Feb 2026"
  periodStart: Date
  periodEnd: Date
  brut: number
  net: number
  cotisations: number
  coutEmployeur: number | null
  heures: number | null
  tauxHoraire: number | null
}

export interface AggregatedStats {
  totalBrut: number
  totalNet: number
  totalCotisations: number
  totalCoutEmployeur: number | null
  totalHeures: number | null
  totalTitresRestaurant: number | null
  averageBrut: number
  averageNet: number
  tauxCotisationEffectif: number
  ratioNetBrut: number
  tauxHoraireNetEffectif: number | null
  projectionAnnuelle: number
  monthsWithData: number
}

export function calculateEffectiveTaxRate(cotisations: number, brut: number): number {
  if (brut === 0) return 0
  return (cotisations / brut) * 100
}

export function calculateNetBrutRatio(net: number, brut: number): number {
  if (brut === 0) return 0
  return (net / brut) * 100
}

export function calculateEffectiveHourlyRate(net: number, hours: number): number | null {
  if (!hours || hours === 0) return null
  return net / hours
}

export function calculateAnnualProjection(monthlyAverage: number, totalMonths = 12): number {
  return monthlyAverage * totalMonths
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function computeMonthlyStats(bulletins: Bulletin[]): MonthlyStats[] {
  return bulletins
    .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
    .map((b) => {
      const start = new Date(b.periodStart)
      return {
        id: b.id,
        month: getMonthKey(start),
        label: getMonthLabel(start),
        periodStart: start,
        periodEnd: new Date(b.periodEnd),
        brut: b.brutBase,
        net: b.netApayer,
        cotisations: b.cotisationsSalariales,
        coutEmployeur: b.coutEmployeurTotal ?? null,
        heures: b.heuresTravaillees ?? null,
        tauxHoraire: b.tauxHoraire ?? null,
      }
    })
}

export function computeAggregatedStats(bulletins: Bulletin[]): AggregatedStats {
  const n = bulletins.length
  if (n === 0) {
    return {
      totalBrut: 0, totalNet: 0, totalCotisations: 0, totalCoutEmployeur: null,
      totalHeures: null, totalTitresRestaurant: null, averageBrut: 0, averageNet: 0,
      tauxCotisationEffectif: 0, ratioNetBrut: 0, tauxHoraireNetEffectif: null,
      projectionAnnuelle: 0, monthsWithData: 0,
    }
  }

  const totalBrut = bulletins.reduce((s, b) => s + b.brutBase, 0)
  const totalNet = bulletins.reduce((s, b) => s + b.netApayer, 0)
  const totalCotisations = bulletins.reduce((s, b) => s + b.cotisationsSalariales, 0)

  const coutEmployeurValues = bulletins.filter(b => b.coutEmployeurTotal !== null)
  const totalCoutEmployeur = coutEmployeurValues.length > 0
    ? coutEmployeurValues.reduce((s, b) => s + (b.coutEmployeurTotal ?? 0), 0)
    : null

  const heuresValues = bulletins.filter(b => b.heuresTravaillees !== null)
  const totalHeures = heuresValues.length > 0
    ? heuresValues.reduce((s, b) => s + (b.heuresTravaillees ?? 0), 0)
    : null

  const trValues = bulletins.filter(b => b.montantTitresRestaurant !== null)
  const totalTitresRestaurant = trValues.length > 0
    ? trValues.reduce((s, b) => s + (b.montantTitresRestaurant ?? 0), 0)
    : null

  const averageBrut = totalBrut / n
  const averageNet = totalNet / n
  const tauxCotisationEffectif = calculateEffectiveTaxRate(totalCotisations, totalBrut)
  const ratioNetBrut = calculateNetBrutRatio(totalNet, totalBrut)
  const tauxHoraireNetEffectif = totalHeures ? calculateEffectiveHourlyRate(totalNet, totalHeures) : null
  const projectionAnnuelle = calculateAnnualProjection(averageNet)

  return {
    totalBrut, totalNet, totalCotisations, totalCoutEmployeur,
    totalHeures, totalTitresRestaurant, averageBrut, averageNet,
    tauxCotisationEffectif, ratioNetBrut, tauxHoraireNetEffectif,
    projectionAnnuelle, monthsWithData: n,
  }
}

export interface BenchmarkData {
  netApayer: number
  heuresTravaillees: number | null
  tauxHoraireNet: number | null
  tauxHoraireNetEffectif: number | null
  // Comparisons
  percentAboveMinStage: number
  percentAboveMinStageMonthly: number
  percentOfSmicNet: number
  isAboveMinStage: boolean
  // Reference values
  minimumStageHoraire: number
  minimumStageMensuel: number
  smicNetMensuel: number
}

export function computeBenchmarks(bulletin: Bulletin): BenchmarkData {
  const heures = bulletin.heuresTravaillees
  const tauxHoraireNet = heures ? calculateEffectiveHourlyRate(bulletin.netApayer, heures) : null
  const tauxHoraireNetEffectif = tauxHoraireNet

  // Compare with minimum internship rate
  const minimumMensuel = heures
    ? heures * MINIMUM_STAGE_HORAIRE_2026
    : MINIMUM_STAGE_MENSUEL_2026

  const percentAboveMinStage = heures && bulletin.tauxHoraire
    ? ((bulletin.tauxHoraire - MINIMUM_STAGE_HORAIRE_2026) / MINIMUM_STAGE_HORAIRE_2026) * 100
    : ((bulletin.brutBase - minimumMensuel) / minimumMensuel) * 100

  const percentAboveMinStageMonthly = ((bulletin.netApayer - MINIMUM_STAGE_MENSUEL_2026) / MINIMUM_STAGE_MENSUEL_2026) * 100
  const percentOfSmicNet = (bulletin.netApayer / SMIC_NET_MENSUEL_2026) * 100
  const isAboveMinStage = bulletin.brutBase >= minimumMensuel

  return {
    netApayer: bulletin.netApayer,
    heuresTravaillees: heures,
    tauxHoraireNet,
    tauxHoraireNetEffectif,
    percentAboveMinStage,
    percentAboveMinStageMonthly,
    percentOfSmicNet,
    isAboveMinStage,
    minimumStageHoraire: MINIMUM_STAGE_HORAIRE_2026,
    minimumStageMensuel: MINIMUM_STAGE_MENSUEL_2026,
    smicNetMensuel: SMIC_NET_MENSUEL_2026,
  }
}

export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function computeCumulativeNet(bulletins: Bulletin[]): { month: string; cumul: number; net: number }[] {
  const sorted = [...bulletins].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  )
  let cumul = 0
  return sorted.map(b => {
    cumul += b.netApayer
    return {
      month: getMonthLabel(new Date(b.periodStart)),
      cumul,
      net: b.netApayer,
    }
  })
}

export function getContractProgress(firstBulletinDate: Date, contractDurationMonths = 6): {
  startDate: Date
  estimatedEndDate: Date
  todayDate: Date
  progressPercent: number
  monthsElapsed: number
  monthsRemaining: number
} {
  const today = new Date()
  const estimatedEndDate = new Date(firstBulletinDate)
  estimatedEndDate.setMonth(estimatedEndDate.getMonth() + contractDurationMonths)

  const totalMs = estimatedEndDate.getTime() - firstBulletinDate.getTime()
  const elapsedMs = today.getTime() - firstBulletinDate.getTime()
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))

  const monthsElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24 * 30.44))
  const monthsRemaining = Math.max(0, contractDurationMonths - monthsElapsed)

  return {
    startDate: firstBulletinDate,
    estimatedEndDate,
    todayDate: today,
    progressPercent,
    monthsElapsed,
    monthsRemaining,
  }
}
