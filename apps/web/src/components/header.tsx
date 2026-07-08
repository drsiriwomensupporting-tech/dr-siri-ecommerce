'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWishlist } from './wishlist-context'
import { 
  Search, 
  Heart, 
  Menu, 
  X, 
  Loader2, 
  ShoppingBag, 
  Users, 
  Tag, 
  Phone 
} from 'lucide-react'
import { Input } from '@drsiri/ui'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { wishlist } = useWishlist()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ products: any[]; sellers: any[]; categories: any[] }>({
    products: [],
    sellers: [],
    categories: [],
  })
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Handle outside clicks to close the search results dropdown
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

  // Scroll-aware header
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Execute global search when query changes (debounced)
  useEffect(() => {
    const trimmed = globalSearch.trim().toLowerCase()
    
    if (trimmed.length < 2) {
      setSearchResults({ products: [], sellers: [], categories: [] })
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('global_search', { search_query: trimmed })
        if (error) throw error
        
        setSearchResults({
          products: data?.products || [],
          sellers: data?.sellers || [],
          categories: data?.categories || []
        })
      } catch (err) {
        console.error('Error fetching global search results:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [globalSearch, supabase])

  // Navigation Links
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'Products', href: '/products' },
    { name: 'Wishlist', href: '/wishlist' },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      router.push(`/products?search=${encodeURIComponent(globalSearch.trim())}`)
      setIsSearchFocused(false)
      setGlobalSearch('')
    }
  }

  return (
    <div className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8 pointer-events-none">
      <header
        className={`mx-auto max-w-7xl w-full rounded-2xl border pointer-events-auto transition-all duration-300 ${
          isScrolled
            ? 'border-border bg-background/95 backdrop-blur-lg shadow-md'
            : 'border-border/60 bg-background/80 backdrop-blur-md shadow-xs'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-9 overflow-hidden rounded-lg border border-border shadow-xs flex items-center justify-center bg-white">
                <img src="/logo.jpg" alt="Logo" className="size-full object-cover" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-primary">
                Dr. Siri
              </span>
            </Link>
  
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'text-primary bg-primary/8 font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>
          </div>

        {/* Search, Wishlist, and Contact Actions */}
        <div className="flex items-center gap-4">
          
          {/* Global Search Bar */}
          <div ref={searchRef} className="hidden sm:block relative w-60">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/70" />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 size-4 text-primary animate-spin" />
              )}
              <Input
                type="text"
                placeholder="Search catalog..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-8 pr-8 h-9 text-xs bg-muted/40 border-border focus:bg-background"
              />
            </form>

            {/* Instant Search Results Dropdown */}
            {isSearchFocused && globalSearch.trim() !== '' && (
              <div className="absolute right-0 mt-1 max-h-96 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-y-auto divide-y divide-border">
                {searchResults.products.length === 0 && 
                 searchResults.sellers.length === 0 && 
                 searchResults.categories.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    {isSearching ? 'Searching...' : `No results matching "${globalSearch}"`}
                  </div>
                ) : (
                  <>
                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <div className="py-1">
                        <span className="px-3 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Products</span>
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.id}`}
                            onClick={() => {
                              setGlobalSearch('')
                              setIsSearchFocused(false)
                            }}
                            className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/40 transition-colors"
                          >
                            <div className="size-6 rounded bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                              {p.thumbnail_image_url ? (
                                <img src={p.thumbnail_image_url} alt="" className="size-full object-cover" />
                              ) : (
                                <ShoppingBag className="size-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-semibold text-xs text-foreground truncate">{p.product_name}</span>
                              <span className="text-[10px] text-muted-foreground">₹{p.price}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Sellers */}
                    {searchResults.sellers.length > 0 && (
                      <div className="py-1">
                        <span className="px-3 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Sellers</span>
                        {searchResults.sellers.map((s) => (
                          <Link
                            key={s.id}
                            href={`/sellers/${s.id}`}
                            onClick={() => {
                              setGlobalSearch('')
                              setIsSearchFocused(false)
                            }}
                            className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/40 transition-colors"
                          >
                            <div className="size-6 rounded bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                              {s.business_logo_url ? (
                                <img src={s.business_logo_url} alt="" className="size-full object-cover" />
                              ) : (
                                <Users className="size-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-semibold text-xs text-foreground truncate">{s.seller_name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{s.business_description || 'Seller'}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Categories */}
                    {searchResults.categories.length > 0 && (
                      <div className="py-1">
                        <span className="px-3 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Categories</span>
                        {searchResults.categories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/products?category=${c.id}`}
                            onClick={() => {
                              setGlobalSearch('')
                              setIsSearchFocused(false)
                            }}
                            className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/40 transition-colors text-xs text-foreground font-semibold"
                          >
                            <Tag className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{c.category_name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Wishlist Link & Counter */}
          <Link
            href="/wishlist"
            className="relative p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors flex items-center justify-center"
            title="Wishlist"
          >
            <Heart className="size-5 shrink-0" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-slate-900 shadow-xs ring-1 ring-background">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-3">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Search catalog..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-8 h-9 text-xs bg-muted/40 border-border"
            />
          </form>

          {/* Mobile Links */}
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
      </header>
    </div>
  )
}
