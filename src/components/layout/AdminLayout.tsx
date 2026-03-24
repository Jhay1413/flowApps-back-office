import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { FlowOpsLogo } from '@/components/FlowOpsLogo'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  LogOut,
  Shield,
  PackageOpen,
  UserRound,
  Cpu,
  Bot,
  Banknote,
  Inbox,
  Settings,
  MailOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
      { label: 'Revenue',       href: '/revenue',       icon: TrendingUp },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Organizations', href: '/organizations', icon: Building2 },
      { label: 'Users',         href: '/users',         icon: Users },
      { label: 'Leads',         href: '/leads',         icon: UserRound },
      { label: 'Automations',   href: '/automations',   icon: Bot },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
      { label: 'Plans',         href: '/plans',         icon: PackageOpen },
      { label: 'Payments',      href: '/payments',      icon: Banknote },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'AI Usage',       href: '/ai-usage',       icon: Cpu },
      { label: 'Inbox',          href: '/inbox',          icon: MailOpen },
      { label: 'Email Settings', href: '/email-config',   icon: Settings },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Access Requests', href: '/access-requests', icon: Inbox },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { location } = useRouterState()
  const pathname = location.pathname
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <FlowOpsLogo size="sm" />
          <div className="flex items-center gap-1">
            <Shield className="h-2.5 w-2.5 text-primary" />
            <span className="text-[10px] text-primary font-medium tracking-wide">ADMIN</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 pt-3 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    to={item.href as '/dashboard'}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-border p-2">
          {user && (
            <div className="mb-1 px-3 py-1.5">
              <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">
        {children}
      </main>
    </div>
  )
}
