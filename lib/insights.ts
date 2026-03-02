/**
 * PayTrack — Insights Engine
 * Generates contextual, personalized insights from payslip data.
 */

import { Bulletin } from '@prisma/client'
import {
  calculateEffectiveTaxRate,
  calculateEffectiveHourlyRate,
  calculateNetBrutRatio,
  MINIMUM_STAGE_HORAIRE_2026,
  MINIMUM_STAGE_MENSUEL_2026,
  SMIC_NET_MENSUEL_2026,
  formatCurrency,
  formatPercent,
} from './calculations'

export interface Insight {
  id: string
  type: 'info' | 'warning' | 'success' | 'alert'
  icon: string
  title: string
  message: string
  value?: string
}

export function generateInsights(bulletins: Bulletin[]): Insight[] {
  if (bulletins.length === 0) return []

  const insights: Insight[] = []
  const latest = bulletins.reduce((a, b) =>
    new Date(a.periodStart) > new Date(b.periodStart) ? a : b
  )
  const n = bulletins.length

  // ─── Taux de cotisation ───
  const tauxCotisation = calculateEffectiveTaxRate(latest.cotisationsSalariales, latest.brutBase)
  insights.push({
    id: 'taux-cotisation',
    type: tauxCotisation > 22 ? 'warning' : 'info',
    icon: '📊',
    title: 'Taux de cotisation',
    message: `Ton taux de cotisation est de ${formatPercent(tauxCotisation)} — ${
      tauxCotisation < 16
        ? 'en dessous de la moyenne pour un stagiaire en France (15-20%)'
        : tauxCotisation <= 20
        ? 'dans la moyenne pour un stagiaire en France (15-20%)'
        : 'légèrement au-dessus de la moyenne (15-20%)'
    }`,
    value: formatPercent(tauxCotisation),
  })

  // ─── Taux horaire net ───
  if (latest.heuresTravaillees && latest.heuresTravaillees > 0) {
    const tauxHoraireNet = calculateEffectiveHourlyRate(latest.netApayer, latest.heuresTravaillees)
    if (tauxHoraireNet !== null) {
      insights.push({
        id: 'taux-horaire-net',
        type: 'info',
        icon: '⏱️',
        title: 'Taux horaire net effectif',
        message: `Tu as travaillé ${latest.heuresTravaillees}h ce mois. Ton taux horaire net effectif est de ${formatCurrency(tauxHoraireNet)}/h (après toutes les cotisations salariales)`,
        value: `${formatCurrency(tauxHoraireNet)}/h`,
      })
    }
  }

  // ─── Coût employeur ───
  if (latest.coutEmployeurTotal) {
    const ratio = latest.coutEmployeurTotal / latest.netApayer
    const surcharge = ((latest.coutEmployeurTotal - latest.netApayer) / latest.netApayer) * 100
    insights.push({
      id: 'cout-employeur',
      type: 'info',
      icon: '🏢',
      title: 'Coût réel pour l\'employeur',
      message: `Ton coût employeur réel est ${formatCurrency(latest.coutEmployeurTotal)}, soit ${formatPercent(surcharge)} de plus que ton net perçu. Pour chaque euro que tu touches, l'entreprise dépense ${ratio.toFixed(2)}€`,
      value: formatCurrency(latest.coutEmployeurTotal),
    })
  }

  // ─── Projection annuelle ───
  const avgNet = bulletins.reduce((s, b) => s + b.netApayer, 0) / n
  const projectSixMonths = avgNet * 6
  const projectTwelveMonths = avgNet * 12
  insights.push({
    id: 'projection',
    type: 'success',
    icon: '🎯',
    title: 'Projection de revenus',
    message: `Basé sur ${n} bulletin${n > 1 ? 's' : ''}, ta moyenne mensuelle nette est de ${formatCurrency(avgNet)}. Projection : ${formatCurrency(projectSixMonths)} sur 6 mois, ${formatCurrency(projectTwelveMonths)} sur 12 mois`,
    value: formatCurrency(projectSixMonths),
  })

  // ─── Titres-restaurant ───
  const bulletinsWithTR = bulletins.filter(b => (b.montantTitresRestaurant ?? 0) > 0)
  if (bulletinsWithTR.length > 0) {
    const avgTR = bulletinsWithTR.reduce((s, b) => s + (b.montantTitresRestaurant ?? 0), 0) / bulletinsWithTR.length
    const totalTR = avgTR * 6 // project 6 months
    insights.push({
      id: 'titres-restaurant',
      type: 'success',
      icon: '🍽️',
      title: 'Titres-restaurant',
      message: `Tes titres-restaurant représentent ${formatCurrency(avgTR)}/mois (part salarié). Sur 6 mois d'alternance, c'est un avantage estimé à ${formatCurrency(totalTR)} en plus de ton salaire net`,
      value: `${formatCurrency(avgTR)}/mois`,
    })
  }

  // ─── Benchmark minimum légal ───
  const heures = latest.heuresTravaillees
  const minimumLegal = heures ? heures * MINIMUM_STAGE_HORAIRE_2026 : MINIMUM_STAGE_MENSUEL_2026
  const aboveMin = ((latest.brutBase - minimumLegal) / minimumLegal) * 100
  if (aboveMin > 0) {
    insights.push({
      id: 'min-legal',
      type: 'success',
      icon: '✅',
      title: 'Au-dessus du minimum légal',
      message: `Tu es rémunéré à ${formatPercent(aboveMin)} au-dessus du minimum légal de stage (${formatCurrency(MINIMUM_STAGE_HORAIRE_2026)}/h). Ton brut est de ${formatCurrency(latest.brutBase)} vs ${formatCurrency(minimumLegal)} légal`,
      value: `+${formatPercent(aboveMin)}`,
    })
  } else {
    insights.push({
      id: 'min-legal-alert',
      type: 'alert',
      icon: '⚠️',
      title: 'Attention au minimum légal',
      message: `Ton brut est inférieur au minimum légal de stage (${formatCurrency(minimumLegal)} pour ${heures ?? 151.67}h). Vérifie ta convention de stage`,
      value: formatCurrency(latest.brutBase),
    })
  }

  // ─── Ratio net/brut ───
  const ratioNetBrut = calculateNetBrutRatio(latest.netApayer, latest.brutBase)
  insights.push({
    id: 'ratio-net-brut',
    type: 'info',
    icon: '💰',
    title: 'Ratio net/brut',
    message: `Tu perçois ${formatPercent(ratioNetBrut)} de ton brut en net à payer. ${
      ratioNetBrut > 85 ? 'Excellent ratio pour un stagiaire !' :
      ratioNetBrut > 80 ? 'Bon ratio, dans la norme.' :
      'Ratio correct pour ta situation.'
    }`,
    value: formatPercent(ratioNetBrut),
  })

  // ─── Prélèvement à la source ───
  if (latest.tauxPrelevementSource === 0 || latest.montantPrelevementSource === 0) {
    insights.push({
      id: 'pas-zero',
      type: 'success',
      icon: '🏛️',
      title: 'Non imposable',
      message: `Ton prélèvement à la source est à 0% — tu es en dessous du seuil d'imposition. Ton net à payer = ton net avant impôt`,
    })
  } else if (latest.tauxPrelevementSource && latest.tauxPrelevementSource > 0) {
    insights.push({
      id: 'pas-actif',
      type: 'info',
      icon: '🏛️',
      title: 'Prélèvement à la source actif',
      message: `Ton taux PAS est de ${formatPercent(latest.tauxPrelevementSource ?? 0)} — montant prélevé ce mois : ${formatCurrency(latest.montantPrelevementSource ?? 0)}`,
      value: formatPercent(latest.tauxPrelevementSource ?? 0),
    })
  }

  // ─── Changement de taux de cotisation entre mois ───
  if (bulletins.length >= 2) {
    const sorted = [...bulletins].sort(
      (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    )
    const prevTaux = calculateEffectiveTaxRate(sorted[1].cotisationsSalariales, sorted[1].brutBase)
    const currTaux = calculateEffectiveTaxRate(sorted[0].cotisationsSalariales, sorted[0].brutBase)
    const diff = Math.abs(currTaux - prevTaux)

    if (diff > 1.5) {
      insights.push({
        id: 'taux-change',
        type: 'warning',
        icon: '📈',
        title: 'Taux de cotisation modifié',
        message: `Ton taux de cotisation a changé de ${formatPercent(prevTaux)} à ${formatPercent(currTaux)} (Δ ${diff > 0 ? '+' : ''}${formatPercent(currTaux - prevTaux)}). Cela peut indiquer un changement de tranche ou de régime`,
        value: `${formatPercent(currTaux - prevTaux)}`,
      })
    }
  }

  // ─── Télétravail ───
  if (latest.joursTeletravail && latest.joursTeletravail > 0) {
    insights.push({
      id: 'teletravail',
      type: 'info',
      icon: '🏠',
      title: 'Télétravail ce mois',
      message: `Tu as effectué ${latest.joursTeletravail} jour${latest.joursTeletravail > 1 ? 's' : ''} de télétravail ce mois. ${
        latest.joursTeletravail >= 5 ? "Bonne flexibilité !" : "N'oublie pas de noter tes jours TLT."
      }`,
      value: `${latest.joursTeletravail}j TLT`,
    })
  }

  // ─── SMIC comparison ───
  const percentOfSmic = (latest.netApayer / SMIC_NET_MENSUEL_2026) * 100
  insights.push({
    id: 'smic-comparison',
    type: percentOfSmic >= 80 ? 'success' : 'info',
    icon: '⚖️',
    title: 'Comparaison SMIC',
    message: `Ton stage est rémunéré à ${formatPercent(percentOfSmic)} du SMIC net mensuel de référence (${formatCurrency(SMIC_NET_MENSUEL_2026)}). ${
      percentOfSmic >= 100 ? 'Tu dépasses le SMIC net !' :
      percentOfSmic >= 80 ? 'Tu es proche du SMIC net.' :
      'Rappel : la gratification de stage n\'est pas soumise au SMIC.'
    }`,
    value: formatPercent(percentOfSmic),
  })

  return insights
}
