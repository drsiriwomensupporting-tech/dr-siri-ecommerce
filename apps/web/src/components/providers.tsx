'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@drsiri/ui'
import { WishlistProvider } from './wishlist-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <WishlistProvider>
        {children}
        <Toaster position="top-right" closeButton richColors />
      </WishlistProvider>
    </QueryClientProvider>
  )
}
