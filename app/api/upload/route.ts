import { NextRequest, NextResponse } from 'next/server'
import { parseBulletin, getParsingConfidence } from '@/lib/pdf-parser'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Le fichier doit être un PDF' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamically import pdf-parse to ensure it's server-side only
    const pdfParse = (await import('pdf-parse')).default
    let pdfData: { text: string }
    try {
      pdfData = await pdfParse(buffer)
    } catch (pdfError) {
      return NextResponse.json(
        { error: 'Impossible de lire le PDF. Vérifiez que le fichier n\'est pas protégé par mot de passe.' },
        { status: 422 }
      )
    }

    const rawText = pdfData.text
    const parsed = parseBulletin(rawText)
    const confidence = getParsingConfidence(parsed)

    // If we couldn't extract the most essential fields, warn the user
    if (!parsed.brutBase && !parsed.netApayer) {
      return NextResponse.json(
        {
          error: 'Impossible d\'extraire les données salariales depuis ce PDF. Utilisez la saisie manuelle.',
          rawText: rawText.substring(0, 500),
          confidence: 0,
        },
        { status: 422 }
      )
    }

    const bulletin = await prisma.bulletin.create({
      data: {
        fileName: file.name,
        periodStart: parsed.periodStart ?? new Date(),
        periodEnd: parsed.periodEnd ?? new Date(),
        employerName: parsed.employerName,
        employerSiret: parsed.employerSiret,
        brutBase: parsed.brutBase ?? 0,
        cotisationsSalariales: parsed.cotisationsSalariales ?? (parsed.brutBase && parsed.netApayer ? parsed.brutBase - parsed.netApayer : 0),
        netAvantImpot: parsed.netAvantImpot ?? parsed.netApayer ?? 0,
        tauxPrelevementSource: parsed.tauxPrelevementSource ?? 0,
        montantPrelevementSource: parsed.montantPrelevementSource ?? 0,
        netApayer: parsed.netApayer ?? 0,
        montantNetSocial: parsed.montantNetSocial,
        nombreTitresRestaurant: parsed.nombreTitresRestaurant,
        valeurTitreRestaurant: parsed.valeurTitreRestaurant,
        montantTitresRestaurant: parsed.montantTitresRestaurant,
        heuresTravaillees: parsed.heuresTravaillees,
        tauxHoraire: parsed.tauxHoraire,
        coutEmployeurTotal: parsed.coutEmployeurTotal,
        cotisationsPatronales: parsed.cotisationsPatronales,
        cotisationMaladie: parsed.cotisationMaladie,
        cotisationRetraite: parsed.cotisationRetraite,
        csgDeductible: parsed.csgDeductible,
        csgNonDeductible: parsed.csgNonDeductible,
        netImposable: parsed.netImposable,
        joursTeletravail: parsed.joursTeletravail,
        rawText: rawText,
      },
    })

    return NextResponse.json(
      {
        bulletin,
        confidence,
        needsReview: confidence < 60,
        fieldsDetected: {
          brutBase: parsed.brutBase !== null,
          netApayer: parsed.netApayer !== null,
          cotisationsSalariales: parsed.cotisationsSalariales !== null,
          periodStart: parsed.periodStart !== null,
          employerName: parsed.employerName !== null,
          heuresTravaillees: parsed.heuresTravaillees !== null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du bulletin' },
      { status: 500 }
    )
  }
}
