'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/product-card'
import { useWishlist } from '@/components/wishlist-context'
import { Button } from '@drsiri/ui'
import { Heart, Loader2, ArrowRight } from 'lucide-react'

export default function WishlistPage() {
  const supabase = createClient()
  const { wishlist } = useWishlist()

  // Fetch product details for the items stored in the local wishlist
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['wishlist-products', wishlist],
    queryFn: async () => {
      if (wishlist.length === 0) return []

      const { data, error } = await supabase
        .from('products')
        .select('*, sellers(seller_name), categories(category_name)')
        .in('id', wishlist)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching wishlist products:', error)
        throw error
      }
      return data
    },
    enabled: wishlist.length > 0
  })

  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 flex flex-col gap-10">
      
      {/* Title */}
      <div className="relative border-b border-border/60 pb-6">
        <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">
          My <span className="text-gradient-primary">Wishlist</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">
          Your curated selection of hand-crafted products and unique items from inspiring women entrepreneurs.
        </p>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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
      ) : wishlist.length === 0 ? (
        
        /* Empty State */
        <div className="relative overflow-hidden flex flex-col items-center justify-center py-24 px-6 text-muted-foreground bg-card/40 border border-border/80 rounded-2xl shadow-xs backdrop-blur-md max-w-xl mx-auto w-full">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 size-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
          
          <div className="relative size-20 rounded-full bg-rose-500/5 flex items-center justify-center mb-6">
            <Heart className="size-10 text-rose-500 fill-rose-500/10 animate-float" />
          </div>
          
          <h3 className="font-display font-extrabold text-xl text-foreground tracking-tight">Your Wishlist is Empty</h3>
          <p className="text-sm text-muted-foreground mt-3 max-w-sm text-center leading-relaxed">
            Keep track of items you love while you browse the catalog. Once you add items, you can review them here and contact sellers directly on WhatsApp.
          </p>
          <Link href="/products" className="mt-8">
            <Button size="lg" className="inline-flex items-center gap-2 font-bold cursor-pointer h-11 px-6 shadow-md hover:shadow-lg hover:shadow-primary/10 transition-all text-white bg-primary hover:bg-primary/90">
              Explore Products
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          </Link>
        </div>
      ) : (
        
        /* Wishlist Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}

    </div>
  )
}
