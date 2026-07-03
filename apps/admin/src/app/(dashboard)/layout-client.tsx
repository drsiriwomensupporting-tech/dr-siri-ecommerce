'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  ChevronRight,
  Bell,
  Search,
  Loader2
} from 'lucide-react'
import { Button, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@drsiri/ui'
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
  const [searchResults, setSearchResults] = useState<{ products: any[]; sellers: any[]; categories: any[] }>({ products: [], sellers: [], categories: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchCache = useRef<Record<string, { products: any[]; sellers: any[]; categories: any[] }>>({})
  const [notifications, setNotifications] = useState<any[]>([])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (!error && data) {
        setNotifications(data)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length === 0) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('public-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 20))
          toast(payload.new.title, {
            description: payload.new.message,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Handle outside clicks to close the search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle global search input change and execute queries (debounced + cached + RPC)
  useEffect(() => {
    const trimmed = globalSearch.trim().toLowerCase()
    
    // Start searching only after 2 characters
    if (trimmed.length < 2) {
      setSearchResults({ products: [], sellers: [], categories: [] })
      setIsSearching(false)
      return
    }

    // Check Cache
    if (searchCache.current[trimmed]) {
      setSearchResults(searchCache.current[trimmed])
      setIsSearching(false)
      return
    }

    let isCurrent = true
    setIsSearching(true)
    
    // Increased debounce to 250 ms
    const delayDebounce = setTimeout(async () => {
      try {
        // Query using a single database RPC for better scalability & single round-trip
        const { data, error } = await supabase.rpc('global_search', { search_query: trimmed })

        if (error) {
          throw error
        }

        const results = {
          products: data?.products || [],
          sellers: data?.sellers || [],
          categories: data?.categories || []
        }

        // Cache results
        searchCache.current[trimmed] = results

        // Cancel/ignore stale requests
        if (isCurrent && globalSearch.trim().toLowerCase() === trimmed) {
          setSearchResults(results)
        }
      } catch (err) {
        console.error('Global search error:', err)
      } finally {
        if (isCurrent) {
          setIsSearching(false)
        }
      }
    }, 250)

    return () => {
      isCurrent = false
      clearTimeout(delayDebounce)
    }
  }, [globalSearch])

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
            <div className="size-8 rounded-lg overflow-hidden border border-border shadow-xs flex items-center justify-center">
              <img src="/logo.jpg" alt="Logo" className="size-full object-cover" />
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
      <div className="flex flex-col flex-1 md:pl-64 min-w-0">
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
            {/* Global Search Bar with Live Results */}
            <div ref={searchRef} className="hidden sm:block relative w-60 z-30">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75 z-10" />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 size-4 text-primary animate-spin z-10" />
              )}
              <Input
                type="text"
                placeholder="Global search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-8 pr-8 h-9 text-xs bg-muted/30 border-border focus:bg-background"
              />
              
              {isSearchFocused && globalSearch.trim() !== '' && (
                <div className="absolute left-0 right-0 mt-1 max-h-96 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-y-auto divide-y divide-border">
                  {searchResults.products.length === 0 && 
                   searchResults.sellers.length === 0 && 
                   searchResults.categories.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No results matching &quot;{globalSearch}&quot;
                    </div>
                  ) : (
                    <>
                      {/* Products */}
                      {searchResults.products.length > 0 && (
                        <div className="py-1">
                          <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Products</span>
                          {searchResults.products.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setGlobalSearch('')
                                setIsSearchFocused(false)
                                router.push(`/products?search=${encodeURIComponent(p.product_name)}`)
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs hover:bg-muted/40 transition-colors cursor-pointer"
                            >
                              <div className="size-6 rounded bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                                {p.thumbnail_image_url ? (
                                  <img src={p.thumbnail_image_url} alt="" className="size-full object-cover" />
                                ) : (
                                  <ShoppingBag className="size-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-foreground truncate">{p.product_name}</span>
                                <span className="text-[10px] text-muted-foreground">₹{p.price}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sellers */}
                      {searchResults.sellers.length > 0 && (
                        <div className="py-1">
                          <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Sellers</span>
                          {searchResults.sellers.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setGlobalSearch('')
                                setIsSearchFocused(false)
                                router.push(`/sellers?search=${encodeURIComponent(s.seller_name)}`)
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs hover:bg-muted/40 transition-colors cursor-pointer"
                            >
                              <div className="size-6 rounded bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                                {s.business_logo_url ? (
                                  <img src={s.business_logo_url} alt="" className="size-full object-cover" />
                                ) : (
                                  <Users className="size-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-foreground truncate">{s.seller_name}</span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1 truncate">{s.business_description || 'Seller'}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Categories */}
                      {searchResults.categories.length > 0 && (
                        <div className="py-1">
                          <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Categories</span>
                          {searchResults.categories.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setGlobalSearch('')
                                setIsSearchFocused(false)
                                router.push(`/categories?search=${encodeURIComponent(c.category_name)}`)
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs hover:bg-muted/40 transition-colors cursor-pointer"
                            >
                              <Tags className="size-3 text-muted-foreground shrink-0" />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-foreground truncate">{c.category_name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors cursor-pointer relative"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-600 ring-2 ring-background animate-pulse" />
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-0 border-border bg-card shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/10">
                  <span className="font-display font-bold text-xs">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        markAllAsRead()
                      }}
                      className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`px-4 py-3 text-left transition-colors cursor-pointer hover:bg-muted/30 ${
                          !n.is_read ? 'bg-muted/10 font-semibold' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] text-foreground leading-tight">{n.title}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-normal font-normal">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <div className="size-8 rounded-lg overflow-hidden border border-border flex items-center justify-center">
                <img src="/logo.jpg" alt="Logo" className="size-full object-cover" />
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
