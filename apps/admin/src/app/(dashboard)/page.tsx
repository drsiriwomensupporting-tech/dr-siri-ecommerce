import React from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export const revalidate = 0 // Disable cache for real-time dashboard data

export default async function DashboardPage() {
  const supabase = await createClient()

  // Run all counts in parallel for optimal loading speed
  const [
    productsRes,
    sellersRes,
    categoriesRes,
    outOfStockRes,
    wishlistRes,
    recentSellersRes,
    recentProductsRes,
    productsByCategoryRes
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('sellers').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('available_stock', 0),
    supabase.from('wishlist').select('*', { count: 'exact', head: true }),
    supabase.from('sellers').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('*, sellers(seller_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('id, category_id, categories(category_name)')
  ])

  // Count products by category ID
  const categoryCounts: Record<string, { name: string; count: number }> = {}
  
  if (productsByCategoryRes.data) {
    productsByCategoryRes.data.forEach((p) => {
      const catName = p.categories ? (p.categories as any).category_name : 'Uncategorized'
      if (!categoryCounts[catName]) {
        categoryCounts[catName] = { name: catName, count: 0 }
      }
      categoryCounts[catName].count++
    })
  }

  const chartData = Object.values(categoryCounts)

  const stats = {
    totalProducts: productsRes.count || 0,
    totalSellers: sellersRes.count || 0,
    totalCategories: categoriesRes.count || 0,
    outOfStock: outOfStockRes.count || 0,
    totalWishlist: wishlistRes.count || 0,
  }

  return (
    <DashboardClient
      stats={stats}
      recentSellers={recentSellersRes.data || []}
      recentProducts={recentProductsRes.data || []}
      chartData={chartData}
    />
  )
}
