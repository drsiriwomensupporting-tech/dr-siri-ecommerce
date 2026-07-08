import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@drsiri/ui'
import { ShoppingBag, ArrowRight } from 'lucide-react'

export const revalidate = 60 // Revalidate category page every 60 seconds

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Fetch categories along with their active products (RLS filters out inactive automatically)
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*, products(id)')
    .order('category_name')
  const categories = categoriesData || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      
      {/* Title */}
      <div className="mb-12 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Browse by type</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mt-2">Explore Categories</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
          Discover a curated collection of handcrafted items created by verified women entrepreneurs.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((c) => {
          const productCount = c.products?.length || 0
          return (
            <Link key={c.id} href={`/products?category=${c.id}`} className="group block">
              <Card className="border-border hover:border-primary/30 bg-card overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col h-full">
                
                {/* Banner / Image */}
                <div className="h-48 w-full bg-muted relative overflow-hidden flex items-center justify-center border-b border-border">
                  {c.image_url ? (
                    <img 
                      src={c.image_url} 
                      alt={c.category_name} 
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-103" 
                    />
                  ) : (
                    <ShoppingBag className="size-12 text-muted-foreground/30" />
                  )}
                  
                  {/* Floating Count Badge */}
                  <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-2xs border border-border">
                    {productCount} {productCount === 1 ? 'Product' : 'Products'}
                  </span>
                </div>

                {/* Card Content */}
                <CardContent className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {c.category_name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {c.description || 'Discover handpicked products in this premium category.'}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all mt-2">
                    <span>Browse Collection</span>
                    <ArrowRight className="size-3.5 shrink-0" />
                  </div>
                </CardContent>

              </Card>
            </Link>
          )
        })}

        {categories?.length === 0 && (
          <div className="col-span-full py-20 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
            No categories available at this moment.
          </div>
        )}
      </div>

    </div>
  )
}
