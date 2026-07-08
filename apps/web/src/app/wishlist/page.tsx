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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">My Wishlist</h1>
        <p className="text-xs text-muted-foreground mt-1">Products you saved for later</p>
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
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card border border-border rounded-xl shadow-2xs">
          <Heart className="size-12 text-rose-300 mb-4" />
          <span className="font-display font-bold text-sm text-foreground">Your Wishlist is Empty</span>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center leading-relaxed">
            Save items here while you browse our catalog to easily review them later and purchase directly on WhatsApp.
          </p>
          <Link href="/products" className="mt-6">
            <Button size="sm" className="inline-flex items-center gap-2 font-bold cursor-pointer">
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
