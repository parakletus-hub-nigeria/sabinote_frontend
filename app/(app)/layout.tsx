'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/lib/hooks'
import { selectIsAuthenticated, selectCurrentUser } from '@/lib/slices/authSlice'
import TabBar from '@/components/TabBar'
import { ReleaseBadge } from '@/components/release'
import { useGetMeQuery } from '@/lib/services/authApi'
import {
  IconHome,
  IconBolt,
  IconLibrary,
  IconWallet,
  IconSettings,
  IconUpload,
  IconShield,
} from '@/components/icons'

const LOGO_URL = "https://res.cloudinary.com/drh4ma3hj/image/upload/v1779473509/SabiNote_Purple_SVG_tlzlqm.svg"

function SidebarLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
}) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      prefetch={true}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-sm font-medium"
      style={active
        ? { background: "var(--color-primary-dim)", color: "oklch(40% 0.22 290)" }
        : { color: "var(--color-text-muted)" }
      }
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function DesktopSidebar({
  user,
  isAdmin,
}: {
  user: { firstName: string; lastName: string; email: string } | null
  isAdmin: boolean
}) {
  return (
    <aside
      className="hidden lg:flex flex-col w-60 xl:w-64 h-screen sticky top-0 shrink-0 bg-white"
      style={{ borderRight: "1px solid var(--color-border)" }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <img src={LOGO_URL} alt="SabiNote" className="h-7 w-auto object-contain" />
        <span style={{ fontSize: "9px", color: "var(--color-text-muted)", letterSpacing: "0.04em", lineHeight: 1, marginTop: "1px" }}>
          by Parakletus
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Menu
        </p>
        <SidebarLink href="/dashboard" icon={IconHome}     label="Dashboard" />
        <SidebarLink href="/generate"  icon={IconBolt}     label="Generate"  />
        <SidebarLink href="/notes"     icon={IconLibrary}  label="Library"   />
        <SidebarLink href="/resources" icon={IconUpload}   label="Resources" />
        <SidebarLink href="/wallet"    icon={IconWallet}   label="Wallet"    />
        <SidebarLink href="/settings"  icon={IconSettings} label="Settings"  />

        {isAdmin && (
          <>
            <p
              className="px-3.5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              Admin
            </p>
            <SidebarLink href="/admin" icon={IconShield} label="Admin panel" />
          </>
        )}
      </nav>

      {/* User footer & release badge */}
      <div className="border-t shrink-0" style={{ borderColor: "var(--color-border)" }}>
        {user && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs font-display"
                style={{ background: "oklch(40% 0.22 290)", color: "white" }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  {isAdmin && (
                    <span
                      className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{ background: "var(--color-primary-dim)", color: "oklch(40% 0.22 290)" }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 bg-gray-50/60">
          <ReleaseBadge variant="sidebar" className="text-[11px] py-0.5 w-full justify-between" />
        </div>
      </div>
    </aside>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router          = useRouter()
  const pathname        = usePathname()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user            = useAppSelector(selectCurrentUser)
  const isAdmin         = user?.role === 'admin'
  const [mounted, setMounted] = useState(false)

  useGetMeQuery(undefined, { skip: !isAuthenticated })

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) return null

  // The note canvas manages its own document layout — give it the full main area
  const isCanvas = /^\/notes\/[^/]+/.test(pathname)

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>

      {/* Desktop layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <DesktopSidebar user={user} isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--color-surface)" }}>
          {isCanvas ? (
            children
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col min-h-full justify-between">
              <div>{children}</div>
              <div className="pt-10 pb-4 flex items-center justify-between border-t border-gray-100 text-xs text-gray-400">
                <span>© 2026 Parakletus Technologies</span>
                <ReleaseBadge variant="light" className="text-[11px]" />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile layout */}
      <div className="app-mobile-outer flex items-center justify-center lg:hidden">
        <div className="app-screen">
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            {children}
            {!isCanvas && (
              <div className="p-4 flex items-center justify-center border-t border-gray-100">
                <ReleaseBadge variant="light" className="text-[11px]" />
              </div>
            )}
          </div>
          {!isCanvas && <TabBar />}
        </div>
      </div>
    </div>
  )
}
