'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/product-card'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@drsiri/ui'
import { 
  Search, 
  SlidersHorizontal, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  RefreshCw,
  ShoppingBag,
  X
} from 'lucide-react'

const ITEMS_PER_PAGE = 8

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Read initial params
  const initialCategory = searchParams.get('category')
  const initialSearch = searchParams.get('search')
  const initialSeller = searchParams.get('seller')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])
  const [stockStatus, setStockStatus] = useState<string[]>(['IN_STOCK', 'LOW_STOCK'])
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name_asc'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Sync state with URL params on initial load
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories([initialCategory])
    }
    if (initialSearch) {
      setSearchQuery(initialSearch)
    }
    if (initialSeller) {
      setSelectedSellers([initialSeller])
    }
  }, [initialCategory, initialSearch, initialSeller])

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setSelectedSellers([])
    setStockStatus(['IN_STOCK', 'LOW_STOCK'])
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
    setCurrentPage(1)
    router.replace('/products')
  }

  // Fetch all active categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name')
      if (error) throw error
      return data
    }
  })

  // Fetch all active sellers
  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('id, seller_name')
        .eq('is_active', true)
        .order('seller_name')
      if (error) throw error
      return data
    }
  })

  // Fetch products based on filters
  const { data: productData, isLoading } = useQuery({
    queryKey: [
      'products-list', 
      searchQuery, 
      selectedCategories, 
      selectedSellers, 
      stockStatus, 
      minPrice, 
      maxPrice, 
      sortBy, 
      currentPage
    ],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, sellers(seller_name, is_active), categories(category_name)', { count: 'exact' })
        .eq('is_active', true)

      // Search Query
      if (searchQuery.trim()) {
        query = query.ilike('product_name', `%${searchQuery.trim()}%`)
      }

      // Categories filter
      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories)
      }

      // Sellers filter
      if (selectedSellers.length > 0) {
        query = query.in('seller_id', selectedSellers)
      }

      // Stock Status filter
      if (stockStatus.length > 0) {
        query = query.in('stock_status', stockStatus)
      }

      // Price filter
      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice))
      }
      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice))
      }

      // Sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'price_asc') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false })
      } else if (sortBy === 'name_asc') {
        query = query.order('product_name', { ascending: true })
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, count, error } = await query
      if (error) throw error

      return {
        products: data as any[],
        totalCount: count || 0
      }
    }
  })

  const products = productData?.products || []
  const totalCount = productData?.totalCount || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Handle category toggle
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    )
    setCurrentPage(1)
  }

  // Handle seller toggle
  const toggleSeller = (sellerId: string) => {
    setSelectedSellers(prev => 
      prev.includes(sellerId) 
        ? prev.filter(id => id !== sellerId) 
        : [...prev, sellerId]
    )
    setCurrentPage(1)
  }

  // Handle stock toggle
  const toggleStock = (status: string) => {
    setStockStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    )
    setCurrentPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Title */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Our Catalogue</h1>
        <p className="text-xs text-muted-foreground mt-1">Browse premium items hand-selected by Dr. Siri admins</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 bg-card border border-border rounded-xl p-6 shadow-2xs shrink-0 sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="size-4 text-primary" />
              Filters
            </h3>
            <button 
              onClick={resetFilters}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="size-3" />
              Reset All
            </button>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Category Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Categories</span>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pt-1">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
                    />
                    <span>{c.category_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price Range (₹)</span>
              <div className="flex gap-2 items-center mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  className="h-8 text-xs bg-muted/40 border-border"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Availability</span>
              <div className="flex flex-col gap-2 pt-1">
                {[
                  { name: 'In Stock', value: 'IN_STOCK' },
                  { name: 'Low Stock', value: 'LOW_STOCK' },
                  { name: 'Out of Stock', value: 'OUT_OF_STOCK' },
                ].map((s) => (
                  <label key={s.value} className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={stockStatus.includes(s.value)}
                      onChange={() => toggleStock(s.value)}
                      className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Seller Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sellers</span>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pt-1">
                {sellers.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedSellers.includes(s.id)}
                      onChange={() => toggleSeller(s.id)}
                      className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
                    />
                    <span className="truncate">{s.seller_name}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* Top Bar (Search + Sort) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-xl p-4 shadow-2xs">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 bg-background border-border text-xs h-9"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end items-center">
              {/* Mobile Filter Trigger */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden h-9 border-border text-xs cursor-pointer"
              >
                <Filter className="size-4 mr-1.5" />
                Filters
              </Button>

              {/* Sort dropdown */}
              <Select
                value={sortBy}
                onValueChange={(value) => { setSortBy(value as any); setCurrentPage(1); }}
              >
                <SelectTrigger className="h-9 w-44 px-4 text-xs border-border bg-background hover:bg-muted/30 cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent position="popper" align="end" className="text-xs bg-popover text-popover-foreground border border-border rounded-lg shadow-md">
                  <SelectItem value="newest" className="text-xs cursor-pointer">Newest First</SelectItem>
                  <SelectItem value="price_asc" className="text-xs cursor-pointer">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc" className="text-xs cursor-pointer">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc" className="text-xs cursor-pointer">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Grid / Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 gap-3 animate-pulse">
                  <div className="aspect-square w-full rounded-lg bg-muted/60" />
                  <div className="h-4 w-1/3 rounded bg-muted/60" />
                  <div className="h-5 w-3/4 rounded bg-muted/60 mt-1" />
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-5 w-1/4 rounded bg-muted/60" />
                    <div className="h-7 w-20 rounded bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card border border-border rounded-xl shadow-2xs">
              <ShoppingBag className="size-12 text-muted-foreground/30 mb-4" />
              <span className="font-display font-bold text-sm text-foreground">No Products Found</span>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center leading-relaxed">
                We couldn&apos;t find any items matching your selected criteria. Try clearing some filters.
              </p>
              <Button onClick={resetFilters} variant="outline" size="sm" className="mt-4 border-border cursor-pointer">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border border-border bg-card rounded-xl shadow-2xs mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-xs border-border cursor-pointer"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-xs border-border cursor-pointer"
              >
                Next
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Filters Drawer / Drawer overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-xs">
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-card border-l border-border p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="size-4 text-primary" />
                Filters
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Category Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Categories</span>
                <div className="flex flex-col gap-2">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="rounded border-border text-primary focus:ring-primary size-3.5"
                      />
                      <span>{c.category_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price Range (₹)</span>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                    className="h-8 text-xs bg-muted/40 border-border"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                    className="h-8 text-xs bg-muted/40 border-border"
                  />
                </div>
              </div>

              {/* Availability Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Availability</span>
                <div className="flex flex-col gap-2">
                  {[
                    { name: 'In Stock', value: 'IN_STOCK' },
                    { name: 'Low Stock', value: 'LOW_STOCK' },
                    { name: 'Out of Stock', value: 'OUT_OF_STOCK' },
                  ].map((s) => (
                    <label key={s.value} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stockStatus.includes(s.value)}
                        onChange={() => toggleStock(s.value)}
                        className="rounded border-border text-primary focus:ring-primary size-3.5"
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seller Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sellers</span>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {sellers.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSellers.includes(s.id)}
                        onChange={() => toggleSeller(s.id)}
                        className="rounded border-border text-primary focus:ring-primary size-3.5"
                      />
                      <span className="truncate">{s.seller_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                <Button onClick={resetFilters} variant="outline" size="sm" className="w-full border-border cursor-pointer">
                  Reset All
                </Button>
                <Button onClick={() => setIsMobileFilterOpen(false)} size="sm" className="w-full cursor-pointer">
                  Apply Filters
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary mb-2" />
        <span>Loading product catalog...</span>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
