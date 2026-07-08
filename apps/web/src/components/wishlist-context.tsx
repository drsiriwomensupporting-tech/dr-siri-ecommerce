'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

interface WishlistContextType {
  wishlist: string[]
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => void
  addToWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'drsiri_wishlist'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // Initialize wishlist from localStorage on client side mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setWishlist(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Error loading wishlist from local storage:', err)
    } finally {
      setIsMounted(true)
    }
  }, [])

  // Sync state to localStorage whenever wishlist changes
  const saveWishlist = (newWishlist: string[]) => {
    setWishlist(newWishlist)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newWishlist))
    } catch (err) {
      console.error('Error saving wishlist to local storage:', err)
    }
  }

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId)
  }

  const addToWishlist = (productId: string) => {
    if (!wishlist.includes(productId)) {
      const updated = [...wishlist, productId]
      saveWishlist(updated)
      toast.success('Added to wishlist')
    }
  }

  const removeFromWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      const updated = wishlist.filter((id) => id !== productId)
      saveWishlist(updated)
      toast.success('Removed from wishlist')
    }
  }

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId)
    } else {
      addToWishlist(productId)
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist: isMounted ? wishlist : [],
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
