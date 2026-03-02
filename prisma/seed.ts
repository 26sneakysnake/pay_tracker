import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding PayTrack database...')

  // Delete existing seed data
  await prisma.bulletin.deleteMany({
    where: { fileName: { startsWith: 'seed-' } },
  })

  // February 2026 — Seifeddine @ Climb (fintech)
  // Brut: 1451.61€, Net: 1233.33€, 140h, 20 TR à 4€, 2j TLT
  // Cotisations salariales = 1451.61 - 1233.33 = 218.28€ (taux ~15.04%)
  const cotisationsSalariales = 1451.61 - 1233.33 // 218.28

  // Breakdown estimates (proportional to typical intern payslip in France)
  const cotisationMaladie = 1451.61 * 0.0000 // 0% for interns (exonéré)
  const cotisationRetraite = 1451.61 * 0.0870 // AGIRC-ARRCO tranche 1
  const csgDeductible = 1451.61 * 0.9825 * 0.0675 // 6.75% of 98.25% of brut
  const csgNonDeductible = 1451.61 * 0.9825 * 0.0240 // 2.40% CRDS

  const brutBase = 1451.61
  const tauxHoraire = brutBase / 140 // ~10.37€/h

  // Employer cost estimate: brut × ~1.42 (patronal charges)
  const coutEmployeurTotal = brutBase * 1.42
  const cotisationsPatronales = coutEmployeurTotal - brutBase

  const bulletin = await prisma.bulletin.create({
    data: {
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-02-28'),
      employerName: 'Climb',
      employerSiret: '12345678901234',
      brutBase: 1451.61,
      cotisationsSalariales: parseFloat(cotisationsSalariales.toFixed(2)),
      netAvantImpot: 1233.33,
      tauxPrelevementSource: 0,
      montantPrelevementSource: 0,
      netApayer: 1233.33,
      montantNetSocial: 1233.33,
      nombreTitresRestaurant: 20,
      valeurTitreRestaurant: 4.0,
      montantTitresRestaurant: 80.0, // 20 × 4€
      heuresTravaillees: 140,
      tauxHoraire: parseFloat(tauxHoraire.toFixed(4)),
      coutEmployeurTotal: parseFloat(coutEmployeurTotal.toFixed(2)),
      cotisationsPatronales: parseFloat(cotisationsPatronales.toFixed(2)),
      cotisationMaladie: parseFloat(cotisationMaladie.toFixed(2)),
      cotisationRetraite: parseFloat(cotisationRetraite.toFixed(2)),
      csgDeductible: parseFloat(csgDeductible.toFixed(2)),
      csgNonDeductible: parseFloat(csgNonDeductible.toFixed(2)),
      netImposable: 1233.33,
      joursTeletravail: 2,
      fileName: 'seed-climb-fevrier-2026.pdf',
      rawText: null,
    },
  })

  console.log(`✅ Bulletin créé: ${bulletin.id}`)
  console.log(`   Période: Février 2026`)
  console.log(`   Employeur: Climb`)
  console.log(`   Brut: ${bulletin.brutBase}€`)
  console.log(`   Net: ${bulletin.netApayer}€`)
  console.log(`   Heures: ${bulletin.heuresTravaillees}h`)
  console.log(`   Titres-restaurant: ${bulletin.nombreTitresRestaurant} × ${bulletin.valeurTitreRestaurant}€`)
  console.log(`   Télétravail: ${bulletin.joursTeletravail} jours`)
  console.log()
  console.log('🎉 Base de données prête. Lancez: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
