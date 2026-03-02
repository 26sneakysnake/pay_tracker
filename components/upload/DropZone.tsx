'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface ParsedFields {
  brutBase: boolean
  netApayer: boolean
  cotisationsSalariales: boolean
  periodStart: boolean
  employerName: boolean
  heuresTravaillees: boolean
}

export function DropZone() {
  const [state, setState] = useState<UploadState>('idle')
  const [confidence, setConfidence] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null)
  const [bulletinId, setBulletinId] = useState<string | null>(null)
  const router = useRouter()

  const uploadFile = useCallback(async (file: File) => {
    setState('uploading')
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Erreur lors de l\'upload')
      }

      setConfidence(data.confidence)
      setParsedFields(data.fieldsDetected)
      setBulletinId(data.bulletin.id)
      setState('success')

      if (data.needsReview) {
        toast.warning(
          `Bulletin importé avec une confiance de ${data.confidence}%. Certains champs n'ont pas pu être extraits.`,
          {
            duration: 8000,
            action: {
              label: 'Vérifier',
              onClick: () => router.push(`/bulletin/${data.bulletin.id}`),
            },
          }
        )
      } else {
        toast.success(
          `Bulletin importé avec succès — confiance ${data.confidence}%`,
          { duration: 4000 }
        )
        setTimeout(() => router.push(`/bulletin/${data.bulletin.id}`), 1500)
      }
    } catch (err) {
      setState('error')
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setErrorMessage(msg)
      toast.error(msg)
    }
  }, [router])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles[0])
      }
    },
    [uploadFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: state === 'uploading',
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0]
      if (err?.code === 'file-too-large') {
        toast.error('Fichier trop volumineux (max 10MB)')
      } else if (err?.code === 'file-invalid-type') {
        toast.error('Seuls les fichiers PDF sont acceptés')
      } else {
        toast.error('Fichier rejeté')
      }
    },
  })

  const resetState = () => {
    setState('idle')
    setConfidence(0)
    setParsedFields(null)
    setBulletinId(null)
    setErrorMessage('')
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed',
          'flex flex-col items-center justify-center',
          'cursor-pointer transition-all duration-200 min-h-[280px] p-8',
          'outline-none focus:border-blue-500/50',
          state === 'idle' && !isDragActive && 'border-white/[0.08] hover:border-white/[0.15]',
          isDragActive && 'border-blue-500/60 scale-[1.01]',
          state === 'uploading' && 'border-white/[0.08] cursor-not-allowed',
          state === 'success' && 'border-emerald-500/40',
          state === 'error' && 'border-red-500/40',
        )}
        style={{
          background: isDragActive
            ? 'rgba(59, 130, 246, 0.05)'
            : state === 'success'
            ? 'rgba(16, 185, 129, 0.05)'
            : state === 'error'
            ? 'rgba(239, 68, 68, 0.05)'
            : 'rgba(18, 18, 26, 0.7)',
        }}
      >
        <input {...getInputProps()} />

        {state === 'uploading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-blue-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-white/70">Analyse du PDF...</p>
              <p className="text-xs text-white/30 mt-1">Extraction des données salariales</p>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-emerald-400">Bulletin importé !</p>
              <p className="text-xs text-white/30 mt-1">
                Confiance : {confidence}%
              </p>
            </div>

            {parsedFields && (
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-2">
                {Object.entries(parsedFields).map(([key, detected]) => {
                  const labels: Record<string, string> = {
                    brutBase: 'Brut', netApayer: 'Net', cotisationsSalariales: 'Cotisations',
                    periodStart: 'Période', employerName: 'Employeur', heuresTravaillees: 'Heures',
                  }
                  return (
                    <div
                      key={key}
                      className={cn(
                        'text-center text-[10px] px-2 py-1 rounded-lg',
                        detected
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-white/[0.03] text-white/20',
                      )}
                    >
                      {labels[key] || key}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); if (bulletinId) router.push(`/bulletin/${bulletinId}`) }}
                className="px-4 py-2 text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Voir le bulletin →
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); resetState() }}
                className="px-4 py-2 text-xs rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Importer un autre
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-red-400">Erreur d&apos;import</p>
              <p className="text-xs text-white/30 mt-1 max-w-xs">{errorMessage}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); resetState() }}
              className="px-4 py-2 text-xs rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {state === 'idle' && (
          <>
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: isDragActive
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              {isDragActive ? (
                <FileText size={28} className="text-blue-400" />
              ) : (
                <Upload size={28} className="text-blue-400" />
              )}
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <p className="text-base font-semibold text-white/80">
                {isDragActive
                  ? 'Déposez le fichier ici'
                  : 'Glissez votre bulletin de paie PDF'}
              </p>
              <p className="text-sm text-white/30">
                ou{' '}
                <span className="text-blue-400 hover:text-blue-300 transition-colors">
                  cliquez pour sélectionner
                </span>
              </p>
            </div>

            {/* Supported formats */}
            <div className="flex gap-2 mt-4">
              {['PayFit', 'Sage', 'ADP', 'Silae', 'Autres'].map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 rounded-lg text-[10px] text-white/30"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {label}
                </span>
              ))}
            </div>

            <p className="text-xs text-white/20 mt-3">PDF uniquement · Max 10MB</p>
          </>
        )}
      </div>
    </div>
  )
}
