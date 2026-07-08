'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@drsiri/types'
import { formatCurrency } from '@drsiri/utils'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import { useWishlist } from './wishlist-context'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isWished = isInWishlist(product.id)

  const sellerName = product.seller?.seller_name || 'Seller'
  const categoryName = product.category?.category_name || 'General'
  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK'

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/8 cursor-pointer ${
        isOutOfStock ? 'border-border opacity-80' : 'border-border hover:border-primary/25'
      }`}
    >
      {/* Top accent bar — gold for in-stock, muted for out of stock */}
      <div
        className={`h-0.5 w-full transition-all duration-300 ${
          isOutOfStock
            ? 'bg-muted'
            : 'bg-gradient-to-r from-primary/60 via-secondary/80 to-primary/60 group-hover:opacity-100 opacity-0'
        }`}
      />

      {/* Product Image Thumbnail */}
      <Link href={`/products/${product.id}`} className="aspect-square relative block overflow-hidden bg-muted">
        {product.thumbnail_image_url ? (
          <Image
            src={product.thumbnail_image_url}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-108"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
            <ShoppingBag className="size-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Stock Status Label */}
        {product.stock_status === 'OUT_OF_STOCK' && (
          <span className="absolute left-2.5 top-2.5 rounded-lg bg-rose-600/95 px-2 py-1 text-[9px] font-bold text-white shadow-sm tracking-wider backdrop-blur-sm">
            OUT OF STOCK
          </span>
        )}
        {product.stock_status === 'LOW_STOCK' && (
          <span className="absolute left-2.5 top-2.5 rounded-lg bg-amber-500/95 px-2 py-1 text-[9px] font-bold text-slate-900 shadow-sm tracking-wider backdrop-blur-sm">
            LOW STOCK
          </span>
        )}
      </Link>

      {/* Wishlist Floating Button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          toggleWishlist(product.id)
        }}
        className={`absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 cursor-pointer ${
          isWished
            ? 'text-rose-500 border-rose-200 bg-rose-50/95'
            : 'text-muted-foreground border-border/80 hover:text-rose-400 hover:border-rose-200 hover:bg-rose-50/80'
        }`}
        title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`size-3.5 transition-all ${isWished ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Product Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">

        {/* Category & Seller info */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span className="text-primary/80">{categoryName}</span>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href={`/sellers/${product.seller_id}`}
            className="hover:text-primary transition-colors truncate max-w-[110px]"
            onClick={(e) => e.stopPropagation()}
          >
            {sellerName}
          </Link>
        </div>

        {/* Product Title */}
        <Link href={`/products/${product.id}`} className="block flex-1">
          <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {product.product_name}
          </h3>
        </Link>

        {/* Price & Primary Action */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-muted/60 mt-auto">
          <span className="font-display font-extrabold text-base text-foreground">
            {formatCurrency(product.price)}
          </span>
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors group/btn"
          >
            View
            <ArrowRight className="size-3 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  )
}
