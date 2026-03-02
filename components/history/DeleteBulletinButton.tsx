'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  id: string
}

export function DeleteBulletinButton({ id }: Props) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    try {
      const res = await fetch(`/api/bulletins/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Bulletin supprimé')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all duration-150 ${
        confirming
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'
      }`}
      title={confirming ? 'Cliquer pour confirmer la suppression' : 'Supprimer ce bulletin'}
    >
      <Trash2 size={12} />
      {confirming ? 'Confirmer ?' : ''}
    </button>
  )
}
