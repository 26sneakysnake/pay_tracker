'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Edit3 } from 'lucide-react'
import type { Bulletin } from '@prisma/client'

interface Props {
  bulletin: Bulletin | null
}

type FormData = {
  periodStart: string
  periodEnd: string
  employerName: string
  brutBase: string
  cotisationsSalariales: string
  netAvantImpot: string
  tauxPrelevementSource: string
  montantPrelevementSource: string
  netApayer: string
  montantNetSocial: string
  nombreTitresRestaurant: string
  valeurTitreRestaurant: string
  montantTitresRestaurant: string
  heuresTravaillees: string
  tauxHoraire: string
  coutEmployeurTotal: string
  cotisationMaladie: string
  cotisationRetraite: string
  csgDeductible: string
  csgNonDeductible: string
  netImposable: string
  joursTeletravail: string
  fileName: string
}

function toFormData(b: Bulletin | null): FormData {
  if (!b) {
    return {
      periodStart: new Date().toISOString().slice(0, 10),
      periodEnd: new Date().toISOString().slice(0, 10),
      employerName: '', brutBase: '', cotisationsSalariales: '', netAvantImpot: '',
      tauxPrelevementSource: '0', montantPrelevementSource: '0', netApayer: '',
      montantNetSocial: '', nombreTitresRestaurant: '', valeurTitreRestaurant: '',
      montantTitresRestaurant: '', heuresTravaillees: '', tauxHoraire: '',
      coutEmployeurTotal: '', cotisationMaladie: '', cotisationRetraite: '',
      csgDeductible: '', csgNonDeductible: '', netImposable: '', joursTeletravail: '',
      fileName: 'saisie-manuelle.pdf',
    }
  }
  return {
    periodStart: new Date(b.periodStart).toISOString().slice(0, 10),
    periodEnd: new Date(b.periodEnd).toISOString().slice(0, 10),
    employerName: b.employerName ?? '',
    brutBase: String(b.brutBase),
    cotisationsSalariales: String(b.cotisationsSalariales),
    netAvantImpot: String(b.netAvantImpot),
    tauxPrelevementSource: String(b.tauxPrelevementSource ?? 0),
    montantPrelevementSource: String(b.montantPrelevementSource ?? 0),
    netApayer: String(b.netApayer),
    montantNetSocial: String(b.montantNetSocial ?? ''),
    nombreTitresRestaurant: String(b.nombreTitresRestaurant ?? ''),
    valeurTitreRestaurant: String(b.valeurTitreRestaurant ?? ''),
    montantTitresRestaurant: String(b.montantTitresRestaurant ?? ''),
    heuresTravaillees: String(b.heuresTravaillees ?? ''),
    tauxHoraire: String(b.tauxHoraire ?? ''),
    coutEmployeurTotal: String(b.coutEmployeurTotal ?? ''),
    cotisationMaladie: String(b.cotisationMaladie ?? ''),
    cotisationRetraite: String(b.cotisationRetraite ?? ''),
    csgDeductible: String(b.csgDeductible ?? ''),
    csgNonDeductible: String(b.csgNonDeductible ?? ''),
    netImposable: String(b.netImposable ?? ''),
    joursTeletravail: String(b.joursTeletravail ?? ''),
    fileName: b.fileName,
  }
}

export function BulletinEditForm({ bulletin }: Props) {
  const [isEditing, setIsEditing] = useState(!bulletin)
  const [formData, setFormData] = useState<FormData>(toFormData(bulletin))
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        periodStart: new Date(formData.periodStart).toISOString(),
        periodEnd: new Date(formData.periodEnd).toISOString(),
        employerName: formData.employerName || null,
        brutBase: parseFloat(formData.brutBase) || 0,
        cotisationsSalariales: parseFloat(formData.cotisationsSalariales) || 0,
        netAvantImpot: parseFloat(formData.netAvantImpot) || 0,
        tauxPrelevementSource: parseFloat(formData.tauxPrelevementSource) || 0,
        montantPrelevementSource: parseFloat(formData.montantPrelevementSource) || 0,
        netApayer: parseFloat(formData.netApayer) || 0,
        montantNetSocial: formData.montantNetSocial ? parseFloat(formData.montantNetSocial) : null,
        nombreTitresRestaurant: formData.nombreTitresRestaurant ? parseInt(formData.nombreTitresRestaurant) : null,
        valeurTitreRestaurant: formData.valeurTitreRestaurant ? parseFloat(formData.valeurTitreRestaurant) : null,
        montantTitresRestaurant: formData.montantTitresRestaurant ? parseFloat(formData.montantTitresRestaurant) : null,
        heuresTravaillees: formData.heuresTravaillees ? parseFloat(formData.heuresTravaillees) : null,
        tauxHoraire: formData.tauxHoraire ? parseFloat(formData.tauxHoraire) : null,
        coutEmployeurTotal: formData.coutEmployeurTotal ? parseFloat(formData.coutEmployeurTotal) : null,
        cotisationMaladie: formData.cotisationMaladie ? parseFloat(formData.cotisationMaladie) : null,
        cotisationRetraite: formData.cotisationRetraite ? parseFloat(formData.cotisationRetraite) : null,
        csgDeductible: formData.csgDeductible ? parseFloat(formData.csgDeductible) : null,
        csgNonDeductible: formData.csgNonDeductible ? parseFloat(formData.csgNonDeductible) : null,
        netImposable: formData.netImposable ? parseFloat(formData.netImposable) : null,
        joursTeletravail: formData.joursTeletravail ? parseInt(formData.joursTeletravail) : null,
        fileName: formData.fileName || 'saisie-manuelle.pdf',
      }

      let res: Response
      if (bulletin) {
        res = await fetch(`/api/bulletins/${bulletin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/bulletins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) throw new Error('Sauvegarde échouée')

      const saved = await res.json()
      toast.success(bulletin ? 'Bulletin mis à jour' : 'Bulletin créé')
      setIsEditing(false)

      if (!bulletin) {
        router.push(`/bulletin/${saved.id}`)
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const fields: Array<{ label: string; key: keyof FormData; type?: string; section?: string }> = [
    { label: 'Période début', key: 'periodStart', type: 'date', section: 'Période' },
    { label: 'Période fin', key: 'periodEnd', type: 'date', section: 'Période' },
    { label: 'Employeur', key: 'employerName', section: 'Employeur' },
    { label: 'Brut de base (€)', key: 'brutBase', section: 'Salaire' },
    { label: 'Cotisations salariales (€)', key: 'cotisationsSalariales', section: 'Salaire' },
    { label: 'Net avant impôt (€)', key: 'netAvantImpot', section: 'Salaire' },
    { label: 'Taux PAS (%)', key: 'tauxPrelevementSource', section: 'Impôt' },
    { label: 'Montant PAS (€)', key: 'montantPrelevementSource', section: 'Impôt' },
    { label: 'Net à payer (€)', key: 'netApayer', section: 'Salaire' },
    { label: 'Montant net social (€)', key: 'montantNetSocial', section: 'Salaire' },
    { label: 'Nb titres-restaurant', key: 'nombreTitresRestaurant', section: 'Avantages' },
    { label: 'Valeur TR part salarié (€)', key: 'valeurTitreRestaurant', section: 'Avantages' },
    { label: 'Montant TR total (€)', key: 'montantTitresRestaurant', section: 'Avantages' },
    { label: 'Heures travaillées', key: 'heuresTravaillees', section: 'Temps' },
    { label: 'Taux horaire (€/h)', key: 'tauxHoraire', section: 'Temps' },
    { label: 'Jours télétravail', key: 'joursTeletravail', section: 'Temps' },
    { label: 'Coût employeur (€)', key: 'coutEmployeurTotal', section: 'Employeur' },
    { label: 'Cotisation maladie (€)', key: 'cotisationMaladie', section: 'Détail cotisations' },
    { label: 'Cotisation retraite (€)', key: 'cotisationRetraite', section: 'Détail cotisations' },
    { label: 'CSG déductible (€)', key: 'csgDeductible', section: 'Détail cotisations' },
    { label: 'CSG/CRDS non déductible (€)', key: 'csgNonDeductible', section: 'Détail cotisations' },
    { label: 'Net imposable (€)', key: 'netImposable', section: 'Détail cotisations' },
    { label: 'Nom du fichier', key: 'fileName', section: 'Fichier' },
  ]

  // Group fields by section
  const sections = Array.from(new Set(fields.map((f) => f.section)))

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70">
          {bulletin ? 'Données du bulletin' : 'Saisie manuelle'}
        </h2>
        {bulletin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all"
          >
            <Edit3 size={12} />
            Modifier
          </button>
        )}
      </div>

      {sections.map((section) => (
        <div key={section} className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/20">
            {section}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {fields
              .filter((f) => f.section === section)
              .map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] text-white/30">{field.label}</label>
                  {isEditing ? (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono text-white/80 outline-none focus:border-blue-500/50 transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      placeholder="—"
                    />
                  ) : (
                    <p className="text-sm font-mono text-white/60 py-2">
                      {formData[field.key] || '—'}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}

      {isEditing && (
        <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {bulletin && (
            <button
              onClick={() => { setIsEditing(false); setFormData(toFormData(bulletin)) }}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white hover:border-white/20 transition-all"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  )
}
