'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Tags, 
  MessageSquare, 
  Warehouse, 
  UserCog, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  ChevronRight,
  Bell,
  Search
} from 'lucide-react'
import { Button, Input } from '@drsiri/ui'
import { toast } from 'sonner'

interface DashboardShellClientProps {
  children: React.ReactNode
  email: string
  role: string
}

export default function DashboardShellClient({
  children,
  email,
  role
}: DashboardShellClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Failed to log out: ' + error.message)
        return
      }
      toast.success('Successfully logged out!')
      router.push('/login')
      router.refresh()
    } catch (err) {
      toast.error('An unexpected error occurred during logout.')
    }
  }

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sellers', href: '/sellers', icon: Users },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Reviews', href: '/reviews', icon: MessageSquare },
    { name: 'Inventory', href: '/inventory', icon: Warehouse },
    { name: 'Admin Users', href: '/admins', icon: UserCog },
  ]

  const getPageTitle = () => {
    const activeItem = navItems.find(item => item.href === pathname)
    if (activeItem) return activeItem.name
    if (pathname.startsWith('/sellers')) return 'Sellers'
    if (pathname.startsWith('/products')) return 'Products'
    if (pathname.startsWith('/categories')) return 'Categories'
    if (pathname.startsWith('/reviews')) return 'Reviews'
    if (pathname.startsWith('/inventory')) return 'Inventory'
    if (pathname.startsWith('/admins')) return 'Admin Users'
    return 'Admin Portal'
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!globalSearch.trim()) return
    // Route to global search page or search products by default
    router.push(`/products?search=${encodeURIComponent(globalSearch.trim())}`)
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="flex items-center h-16 px-6 border-b border-border gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center border border-primary/20 shadow-sm">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight text-primary leading-tight">
                Dr. Siri
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-secondary uppercase leading-none mt-0.5">
                Women Supporting Women
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`size-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                  {item.name}
                  {isActive && <ChevronRight className="ml-auto size-3 text-white/70" />}
                </Link>
              )
            })}
          </nav>

          {/* Footer User Info */}
          <div className="p-4 border-t border-border bg-muted/20 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-semibold text-sm">
                {email[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate text-foreground leading-tight">
                  {email}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mt-1">
                  {role}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-xs border-border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors cursor-pointer"
            >
              <LogOut data-icon="inline-start" className="size-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 border-b border-border bg-card/85 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
              <Input
                type="text"
                placeholder="Global search products..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-60 pl-8 h-9 text-xs bg-muted/30 border-border focus:bg-background"
              />
            </form>

            <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors cursor-pointer">
              <Bell className="size-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Slide-out Panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative flex flex-col w-full max-w-xs bg-card border-r border-border h-full z-10 transition-transform">
            {/* Mobile Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Mobile Logo Brand */}
            <div className="flex items-center h-16 px-6 border-b border-border gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center border border-primary/20">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-tight text-primary leading-tight">
                  Dr. Siri
                </span>
                <span className="text-[9px] font-semibold tracking-wider text-secondary uppercase leading-none mt-0.5">
                  Women Supporting Women
                </span>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile User Info Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-semibold text-sm">
                  {email[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate text-foreground">
                    {email}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                    {role}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-xs border-border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors cursor-pointer"
              >
                <LogOut data-icon="inline-start" className="size-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
