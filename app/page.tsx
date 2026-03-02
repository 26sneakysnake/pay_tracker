import { prisma } from '@/lib/prisma'
import { KPICard } from '@/components/dashboard/KPICard'
import { EvolutionChart } from '@/components/dashboard/EvolutionChart'
import { CotisationsDonut } from '@/components/dashboard/CotisationsDonut'
import { CumulativeChart } from '@/components/dashboard/CumulativeChart'
import { EfficiencyChart } from '@/components/dashboard/EfficiencyChart'
import { HoursChart } from '@/components/dashboard/HoursChart'
import { TeletravailChart } from '@/components/dashboard/TeletravailChart'
import { InsightCard } from '@/components/dashboard/InsightCard'
import { BenchmarkCard } from '@/components/dashboard/BenchmarkCard'
import { generateInsights } from '@/lib/insights'
import { computeAggregatedStats } from '@/lib/calculations'
import {
  Euro,
  TrendingUp,
  Clock,
  Briefcase,
  Building2,
  PiggyBank,
  Target,
  Coffee,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const bulletins = await prisma.bulletin.findMany({
    orderBy: { periodStart: 'asc' },
  })

  if (bulletins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen gap-8 p-8">
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}
          >
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Bienvenue sur PayTrack</h1>
          <p className="text-white/40 max-w-md">
            Votre plateforme personnelle de suivi et d&apos;analyse de bulletins de paie.
            Importez votre premier bulletin pour commencer.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/upload"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
          >
            Importer un bulletin PDF
          </Link>
          <Link
            href="/bulletin/new"
            className="px-6 py-3 rounded-xl text-sm font-semibold border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
          >
            Saisie manuelle
          </Link>
        </div>
      </div>
    )
  }

  const latest = bulletins[bulletins.length - 1]
  const prev = bulletins.length >= 2 ? bulletins[bulletins.length - 2] : null
  const agg = computeAggregatedStats(bulletins)
  const insights = generateInsights(bulletins)

  const netDelta = prev ? latest.netApayer - prev.netApayer : undefined
  const netDeltaPct = prev ? ((latest.netApayer - prev.netApayer) / prev.netApayer) * 100 : undefined
  const brutDelta = prev ? latest.brutBase - prev.brutBase : undefined

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/30 mt-1">
            {bulletins.length} bulletin{bulletins.length > 1 ? 's' : ''}
            {' · '}
            Dernier : <span className="text-white/50">{formatDate(latest.periodStart)}</span>
            {latest.employerName && (
              <> · <span className="text-white/50">{latest.employerName}</span></>
            )}
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          + Ajouter
        </Link>
      </div>

      {/* KPI Grid — Row 1: Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Net à payer"
          value={latest.netApayer}
          format="currency"
          icon={<Euro size={15} className="text-emerald-400" />}
          delta={netDelta}
          deltaPercent={netDeltaPct}
          accentColor="green"
          animationDelay={0}
        />
        <KPICard
          title="Brut de base"
          value={latest.brutBase}
          format="currency"
          icon={<Briefcase size={15} className="text-blue-400" />}
          delta={brutDelta}
          accentColor="blue"
          animationDelay={100}
        />
        <KPICard
          title="Cotisations salariales"
          value={latest.cotisationsSalariales}
          format="currency"
          icon={<PiggyBank size={15} className="text-amber-400" />}
          subtitle={`Taux ${((latest.cotisationsSalariales / latest.brutBase) * 100).toFixed(1)}%`}
          accentColor="yellow"
          animationDelay={200}
        />
        <KPICard
          title="Heures travaillées"
          value={latest.heuresTravaillees ?? 0}
          format="hours"
          icon={<Clock size={15} className="text-slate-400" />}
          subtitle={latest.heuresTravaillees
            ? `${formatCurrency(latest.netApayer / latest.heuresTravaillees)}/h net`
            : undefined}
          accentColor="gray"
          animationDelay={300}
        />
      </div>

      {/* KPI Grid — Row 2: Cumulative + projections */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cumul net"
          value={agg.totalNet}
          format="currency"
          icon={<TrendingUp size={15} className="text-emerald-400" />}
          subtitle={`${agg.monthsWithData} mois`}
          accentColor="green"
          animationDelay={400}
        />
        <KPICard
          title="Cumul brut"
          value={agg.totalBrut}
          format="currency"
          icon={<Building2 size={15} className="text-blue-400" />}
          accentColor="blue"
          animationDelay={500}
        />
        <KPICard
          title="Projection annuelle nette"
          value={agg.projectionAnnuelle}
          format="currency"
          icon={<Target size={15} className="text-violet-400" />}
          subtitle="Basée sur la moyenne"
          accentColor="purple"
          animationDelay={600}
        />
        <KPICard
          title="Titres-restaurant"
          value={latest.montantTitresRestaurant ?? 0}
          format="currency"
          icon={<Coffee size={15} className="text-amber-400" />}
          subtitle={latest.nombreTitresRestaurant
            ? `${latest.nombreTitresRestaurant} × ${formatCurrency(latest.valeurTitreRestaurant ?? 0)}`
            : undefined}
          accentColor="yellow"
          animationDelay={700}
        />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EvolutionChart bulletins={bulletins} />
        </div>
        <CotisationsDonut bulletin={latest} />
      </div>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CumulativeChart bulletins={bulletins} />
        <EfficiencyChart bulletins={bulletins} />
        <HoursChart bulletins={bulletins} />
      </div>

      {/* Télétravail */}
      {bulletins.some((b) => (b.joursTeletravail ?? 0) > 0) && (
        <TeletravailChart bulletins={bulletins} />
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">
            Insights & Analyses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Benchmarks */}
      <BenchmarkCard bulletin={latest} />
    </div>
  )
}
