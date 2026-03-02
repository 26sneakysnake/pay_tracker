'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  History,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Importer', icon: Upload },
  { href: '/history', label: 'Historique', icon: History },
  { href: '/timeline', label: 'Timeline', icon: CalendarDays },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex-shrink-0 flex flex-col h-screen',
        'border-r border-white/[0.06]',
        'w-16 lg:w-56',
        'transition-all duration-200',
      )}
      style={{ background: 'rgba(10, 10, 18, 0.95)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-white/[0.06]">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
          }}
        >
          <TrendingUp size={16} className="text-white" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <p className="text-sm font-bold text-white tracking-tight">PayTrack</p>
          <p className="text-[10px] text-white/40 font-mono">v1.0.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]',
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'group-hover:text-white/70',
                )}
              />
              <span
                className={cn(
                  'hidden lg:block text-sm font-medium',
                  isActive ? 'text-blue-300' : '',
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="hidden lg:flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/30 font-mono">Local · Hors ligne</span>
        </div>
      </div>
    </aside>
  )
}
