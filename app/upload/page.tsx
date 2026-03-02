import { DropZone } from '@/components/upload/DropZone'
import Link from 'next/link'
import { ArrowLeft, FileText, Zap, Shield } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Importer un bulletin</h1>
          <p className="text-sm text-white/30 mt-0.5">
            Extraction automatique des données salariales depuis votre PDF
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <DropZone />

      {/* Features */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: Zap,
            title: 'Extraction auto',
            desc: 'PayFit, Sage, ADP, Silae et autres formats',
          },
          {
            icon: FileText,
            title: 'Saisie manuelle',
            desc: 'Si l\'extraction échoue, corrigez chaque champ',
          },
          {
            icon: Shield,
            title: 'Données locales',
            desc: 'Stockées uniquement sur votre machine',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl p-4 space-y-2 text-center"
            style={{
              background: 'rgba(18, 18, 26, 0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto bg-blue-500/10">
              <Icon size={15} className="text-blue-400" />
            </div>
            <p className="text-xs font-semibold text-white/60">{title}</p>
            <p className="text-[10px] text-white/25">{desc}</p>
          </div>
        ))}
      </div>

      {/* Manual entry link */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{
          background: 'rgba(18, 18, 26, 0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <p className="text-sm font-medium text-white/60">Saisie manuelle</p>
          <p className="text-xs text-white/25 mt-0.5">
            Entrez les données directement si l&apos;import PDF échoue
          </p>
        </div>
        <Link
          href="/bulletin/new"
          className="flex-shrink-0 px-4 py-2 rounded-xl text-xs border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all"
        >
          Saisie manuelle →
        </Link>
      </div>
    </div>
  )
}
