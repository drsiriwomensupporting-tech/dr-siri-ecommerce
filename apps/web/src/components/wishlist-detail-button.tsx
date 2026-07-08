'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { useWishlist } from './wishlist-context'
import { Button } from '@drsiri/ui'

interface WishlistDetailButtonProps {
  productId: string
}

export function WishlistDetailButton({ productId }: WishlistDetailButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isWished = isInWishlist(productId)

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => toggleWishlist(productId)}
      className={`font-semibold cursor-pointer border-border gap-2 flex-1 sm:flex-initial h-11 px-6 ${
        isWished 
          ? 'text-rose-500 border-rose-100 bg-rose-50 hover:bg-rose-50/80 hover:text-rose-600' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Heart className={`size-4.5 ${isWished ? 'fill-rose-500' : ''}`} />
      {isWished ? 'Saved to Wishlist' : 'Add to Wishlist'}
    </Button>
  )
}
