/**
 * PayTrack PDF Parser
 * Robust extraction of French payslip data using layered regex patterns.
 * Supports PayFit, Sage, ADP, and other French payroll editors.
 */

export interface ParsedBulletin {
  periodStart: Date | null
  periodEnd: Date | null
  employerName: string | null
  employerSiret: string | null
  brutBase: number | null
  cotisationsSalariales: number | null
  netAvantImpot: number | null
  tauxPrelevementSource: number | null
  montantPrelevementSource: number | null
  netApayer: number | null
  montantNetSocial: number | null
  nombreTitresRestaurant: number | null
  valeurTitreRestaurant: number | null
  montantTitresRestaurant: number | null
  heuresTravaillees: number | null
  tauxHoraire: number | null
  coutEmployeurTotal: number | null
  cotisationsPatronales: number | null
  cotisationMaladie: number | null
  cotisationRetraite: number | null
  csgDeductible: number | null
  csgNonDeductible: number | null
  netImposable: number | null
  joursTeletravail: number | null
}

// Convert French number format to float: "1 233,33" → 1233.33
function parseFrenchNumber(s: string): number | null {
  if (!s) return null
  // Remove thousands separators (spaces or non-breaking spaces), replace comma decimal
  const cleaned = s.replace(/[\s\u00A0]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

// Try multiple regex patterns and return the first match
function tryPatterns(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

function tryNumberPatterns(text: string, patterns: RegExp[]): number | null {
  const raw = tryPatterns(text, patterns)
  if (!raw) return null
  return parseFrenchNumber(raw)
}

// French month names for date parsing
const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
}

function parseFrenchDate(s: string): Date | null {
  if (!s) return null
  s = s.trim()

  // Format: 01/02/2026 or 01-02-2026 or 01.02.2026
  const numericMatch = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/)
  if (numericMatch) {
    const day = parseInt(numericMatch[1])
    const month = parseInt(numericMatch[2])
    let year = parseInt(numericMatch[3])
    if (year < 100) year += 2000
    return new Date(year, month - 1, day)
  }

  // Format: "1er février 2026" or "février 2026" (assume day=1)
  const frenchMatch = s.match(/^(\d{1,2})(?:er|ème)?\s+(\w+)\s+(\d{4})$/i)
  if (frenchMatch) {
    const day = parseInt(frenchMatch[1])
    const monthName = frenchMatch[2].toLowerCase()
    const year = parseInt(frenchMatch[3])
    const month = FRENCH_MONTHS[monthName]
    if (month) return new Date(year, month - 1, day)
  }

  // Format: "février 2026" (no day - assume 1)
  const monthYearMatch = s.match(/^(\w+)\s+(\d{4})$/i)
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase()
    const year = parseInt(monthYearMatch[2])
    const month = FRENCH_MONTHS[monthName]
    if (month) return new Date(year, month - 1, 1)
  }

  return null
}

function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0) // day 0 = last day of previous month
}

export function parseBulletin(rawText: string): ParsedBulletin {
  // Normalize text: collapse multiple whitespace but keep newlines for context
  const text = rawText.replace(/\r\n/g, '\n').replace(/\t/g, ' ')

  // ─── Period ───
  let periodStart: Date | null = null
  let periodEnd: Date | null = null

  const periodStartRaw = tryPatterns(text, [
    /p[eé]riode\s+du\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /du\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+au/i,
    /p[eé]riode\s*:\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /mois\s+de\s+((?:janvier|février|fevrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+\d{4})/i,
  ])

  const periodEndRaw = tryPatterns(text, [
    /au\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /p[eé]riode\s+du\s+\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\s+au\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  ])

  if (periodStartRaw) {
    periodStart = parseFrenchDate(periodStartRaw)
  }
  if (periodEndRaw) {
    periodEnd = parseFrenchDate(periodEndRaw)
  }

  // If we have start but no end, compute end as last day of that month
  if (periodStart && !periodEnd) {
    periodEnd = getLastDayOfMonth(periodStart.getFullYear(), periodStart.getMonth() + 1)
  }

  // ─── Employer ───
  const employerName = tryPatterns(text, [
    /(?:employeur|société|entreprise|raison sociale)\s*:?\s*([A-Z][A-Za-zÀ-ÿ0-9\s&.,-]{2,50})/i,
    /^([A-Z][A-Z\s]{3,30})\n/m,
  ])

  const employerSiret = tryPatterns(text, [
    /siret\s*:?\s*(\d[\d\s]{13,18})/i,
    /n[°o]\s*siret\s*:?\s*(\d[\d\s]{13,18})/i,
  ])

  // ─── Salaire brut ───
  const brutBase = tryNumberPatterns(text, [
    /(?:salaire de base|traitement de base)\s+[\d\s,]+\s+[\d\s,]+\s+([\d\s]+[,.][\d]{2})/i,
    /r[ée]mun[ée]ration brute\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /(?:total|cumul)\s+brut\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /brut\s+(?:total|mensuel|de\s+base)\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /montant\s+brut\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /salaire\s+brut\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Net à payer ───
  const netApayer = tryNumberPatterns(text, [
    /net\s+[àa]\s+payer\s*(?:au\s+salari[ée])?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /montant\s+net\s+[àa]\s+payer\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /net\s+pay[ée]\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /total\s+net\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Cotisations salariales ───
  const cotisationsSalariales = tryNumberPatterns(text, [
    /total\s+(?:des\s+)?cotisations\s+(?:et\s+contributions\s+)?salariales\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /cotisations\s+salariales\s+totales?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /total\s+retenues\s+salariales\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /total\s+cotisations\s+salariales\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Net avant impôt ───
  const netAvantImpot = tryNumberPatterns(text, [
    /net\s+avant\s+(?:pr[ée]l[eè]vement\s+[àa]\s+la\s+source|impôt|imp[oô]t)\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /net\s+avant\s+PAS\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /net\s+imposable\s+avant\s+PAS\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Prélèvement à la source ───
  const tauxPrelevementSource = tryNumberPatterns(text, [
    /pr[ée]l[eè]vement\s+[àa]\s+la\s+source\s+(\d+[,.]\d+)\s*%/i,
    /taux\s+PAS\s*:?\s*(\d+[,.]\d+)\s*%/i,
    /taux\s+pr[ée]l[eè]vement\s*:?\s*(\d+[,.]\d+)\s*%/i,
  ])

  const montantPrelevementSource = tryNumberPatterns(text, [
    /pr[ée]l[eè]vement\s+[àa]\s+la\s+source\s+\d+[,.]\d+\s*%\s*([\d\s]+[,.][\d]{2})/i,
    /montant\s+pr[ée]l[eè]vement\s+[àa]\s+la\s+source\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /PAS\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Montant net social ───
  const montantNetSocial = tryNumberPatterns(text, [
    /montant\s+net\s+social\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /net\s+social\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Titres-restaurant ───
  const nombreTitresRestaurant = tryNumberPatterns(text, [
    /titres?\s+restaurant\s+(\d+)\s+titre/i,
    /(\d+)\s+titres?\s+restaurant/i,
    /titres?\s+repas\s+(\d+)/i,
    /nombre\s+(?:de\s+)?titres?\s*:?\s*(\d+)/i,
  ])

  const valeurTitreRestaurant = tryNumberPatterns(text, [
    /valeur\s+(?:faciale|unitaire)\s+(?:du\s+titre\s+restaurant)?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /titre\s+restaurant.*?valeur\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /(?:ticket|titre)\s+restaurant.*?(\d+[,.]\d{2})\s*€/i,
  ])

  let montantTitresRestaurant = tryNumberPatterns(text, [
    /titres?\s+restaurant.*?montant\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /(?:avantage|contribution)\s+(?:en\s+nature\s+)?titres?\s+restaurant\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /part\s+salariale?\s+titres?\s+restaurant\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // Calculate if we have count and value but not total
  if (!montantTitresRestaurant && nombreTitresRestaurant && valeurTitreRestaurant) {
    montantTitresRestaurant = nombreTitresRestaurant * valeurTitreRestaurant
  }

  // ─── Heures travaillées ───
  const heuresTravaillees = tryNumberPatterns(text, [
    /(?:heures?\s+(?:travaillées?|effectuées?)|nombre\s+d.heures?)\s*:?\s*([\d\s]+[,.]?\d*)/i,
    /(\d+[,.]?\d*)\s*h(?:eures?)?\s*(?:travaillées?|effectuées?)/i,
    /heures?\s+(?:du\s+mois|mensuelles?)\s*:?\s*([\d]+[,.]?\d*)/i,
    /total\s+heures?\s*:?\s*([\d]+[,.]?\d*)/i,
  ])

  // ─── Taux horaire ───
  const tauxHoraire = tryNumberPatterns(text, [
    /taux\s+(?:horaire|de\s+base)\s*:?\s*([\d\s]+[,.][\d]{2,4})/i,
    /salaire\s+(?:horaire|de\s+base)\s*:?\s*([\d\s]+[,.][\d]{2,4})/i,
    /(?:gratification|r[ée]mun[ée]ration)\s+horaire\s*:?\s*([\d\s]+[,.][\d]{2,4})/i,
  ])

  // ─── Coût employeur ───
  const coutEmployeurTotal = tryNumberPatterns(text, [
    /co[uû]t\s+(?:total\s+)?(?:pour\s+l.)?employeur\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /total\s+(?:charges?\s+)?employeur\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /charge\s+(?:totale\s+)?employeur\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  const cotisationsPatronales = tryNumberPatterns(text, [
    /total\s+(?:des\s+)?cotisations\s+(?:et\s+contributions\s+)?patronales\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /cotisations\s+patronales\s+totales?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /cotisations\s+employeur\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Détail cotisations ───
  const cotisationMaladie = tryNumberPatterns(text, [
    /(?:assurance\s+)?maladie.*?salariale?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /maladie\s+maternit[ée].*?([\d\s]+[,.][\d]{2})/i,
    /(?:cotisation\s+)?maladie\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  const cotisationRetraite = tryNumberPatterns(text, [
    /retraite\s+(?:compl[ée]mentaire|de\s+base)?\s*(?:tranche\s+[AB12])?\s*(?:salariale?)?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /(?:AGIRC|ARRCO|IRCANTEC)\s*(?:tranche\s+[AB12])?\s*(?:salariale?)?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /retraite\s+SS\s+(?:plafonn[ée]e?\s+)?\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  const csgDeductible = tryNumberPatterns(text, [
    /CSG\s+d[ée]ductible\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /CSG\s+(?:imposable\s+)?d[ée]ductible\s+de\s+l.impôt\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  const csgNonDeductible = tryNumberPatterns(text, [
    /CSG[-\/]?CRDS?\s+non\s+d[ée]ductible\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /CRDS\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /CSG\s+non\s+d[ée]ductible\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Net imposable ───
  const netImposable = tryNumberPatterns(text, [
    /net\s+imposable\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /revenu\s+imposable\s*:?\s*([\d\s]+[,.][\d]{2})/i,
    /base\s+imposable\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  ])

  // ─── Télétravail ───
  const joursTeletravail = tryNumberPatterns(text, [
    /(?:jours?\s+de\s+)?t[ée]l[ée]travail\s*:?\s*(\d+)\s*j(?:ours?)?/i,
    /(\d+)\s*j(?:ours?)?\s+(?:de\s+)?t[ée]l[ée]travail/i,
    /TLT\s*:?\s*(\d+)\s*j/i,
    /travail\s+[àa]\s+domicile\s*:?\s*(\d+)/i,
  ])

  return {
    periodStart,
    periodEnd,
    employerName: employerName ? employerName.trim().substring(0, 100) : null,
    employerSiret: employerSiret ? employerSiret.replace(/\s/g, '') : null,
    brutBase,
    cotisationsSalariales,
    netAvantImpot,
    tauxPrelevementSource,
    montantPrelevementSource,
    netApayer,
    montantNetSocial,
    nombreTitresRestaurant: nombreTitresRestaurant ? Math.round(nombreTitresRestaurant) : null,
    valeurTitreRestaurant,
    montantTitresRestaurant,
    heuresTravaillees,
    tauxHoraire,
    coutEmployeurTotal,
    cotisationsPatronales,
    cotisationMaladie,
    cotisationRetraite,
    csgDeductible,
    csgNonDeductible,
    netImposable,
    joursTeletravail: joursTeletravail ? Math.round(joursTeletravail) : null,
  }
}

// Count how many fields were successfully extracted
export function getParsingConfidence(parsed: ParsedBulletin): number {
  const requiredFields: (keyof ParsedBulletin)[] = [
    'periodStart', 'periodEnd', 'brutBase', 'netApayer', 'cotisationsSalariales',
  ]
  const optionalFields: (keyof ParsedBulletin)[] = [
    'employerName', 'netAvantImpot', 'heuresTravaillees', 'cotisationMaladie',
    'cotisationRetraite', 'csgDeductible', 'netImposable', 'nombreTitresRestaurant',
  ]

  const requiredFound = requiredFields.filter(f => parsed[f] !== null).length
  const optionalFound = optionalFields.filter(f => parsed[f] !== null).length

  return Math.round((requiredFound / requiredFields.length) * 70 + (optionalFound / optionalFields.length) * 30)
}
