'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ShoppingBag, 
  Users, 
  Tags, 
  AlertTriangle, 
  Heart,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@drsiri/ui'
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Cell
} from 'recharts'
import { formatDate, formatCurrency } from '@drsiri/utils'

interface DashboardClientProps {
  stats: {
    totalProducts: number
    totalSellers: number
    totalCategories: number
    outOfStock: number
    totalWishlist: number
  }
  recentSellers: any[]
  recentProducts: any[]
  chartData: Array<{ name: string; count: number }>
}

export default function DashboardClient({
  stats,
  recentSellers,
  recentProducts,
  chartData
}: DashboardClientProps) {

  const kpis = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      description: 'Items listed in portal',
      icon: ShoppingBag,
      color: 'text-primary bg-primary/10 border-primary/20',
      href: '/products'
    },
    {
      title: 'Total Sellers',
      value: stats.totalSellers,
      description: 'Active women entrepreneurs',
      icon: Users,
      color: 'text-secondary bg-secondary/10 border-secondary/20',
      href: '/sellers'
    },
    {
      title: 'Total Categories',
      value: stats.totalCategories,
      description: 'Product classifications',
      icon: Tags,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      href: '/categories'
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      description: 'Requires replenishment',
      icon: AlertTriangle,
      color: stats.outOfStock > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-100',
      href: '/inventory'
    },
    {
      title: 'Wishlist Count',
      value: stats.totalWishlist,
      description: 'Total customer wishlists',
      icon: Heart,
      color: 'text-rose-500 bg-rose-50 border-rose-100',
      href: '#'
    }
  ]

  const chartConfig = {
    count: {
      label: 'Products',
      color: 'oklch(0.38 0.08 195)', // Deep Teal
    }
  }

  // Predefined colors for charts (combining teal and gold scales)
  const colors = [
    'oklch(0.38 0.08 195)', // Teal
    'oklch(0.74 0.11 78)',  // Gold
    'oklch(0.5 0.02 240)',  // Slate
    'oklch(0.48 0.07 195)', // Muted Teal
    'oklch(0.8 0.09 78)',   // Muted Gold
    'oklch(0.6 0.02 240)',  // Muted Slate
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Welcome Back, Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is what is happening across your platform today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/products" className="cursor-pointer">
            <Button size="sm">
              <Plus className="size-4 mr-1.5" />
              Add Product
            </Button>
          </Link>
          <Link href="/sellers" className="cursor-pointer">
            <Button size="sm" variant="outline">
              <Plus className="size-4 mr-1.5" />
              Add Seller
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.title} href={kpi.href} className="group block cursor-pointer">
              <Card className="transition-all duration-200 border-border group-hover:border-primary/30 group-hover:shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {kpi.title}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                    <Icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-display tracking-tight text-foreground">
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpi.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Bento Layout Grid for Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products by Category Chart Card */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-base font-bold">Products by Category</CardTitle>
              <CardDescription>Visual distribution of items across seeded categories</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <TrendingUp className="size-3" />
              Active
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-muted-foreground text-sm">
                No product distribution data available.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Log */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display text-base font-bold flex items-center gap-1.5">
              <Clock className="size-4 text-primary" />
              Recent Sellers
            </CardTitle>
            <CardDescription>Latest entrepreneurs registered</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {recentSellers.length === 0 ? (
              <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                No registered sellers yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {recentSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/10">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {seller.seller_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {seller.contact_person_name}
                      </span>
                    </div>
                    <Badge variant={seller.is_active ? 'default' : 'secondary'} className="text-[10px] scale-90">
                      {seller.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
                <div className="px-6 pt-4">
                  <Link href="/sellers" className="cursor-pointer">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View All Sellers
                      <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Products List */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="font-display text-base font-bold">Recently Added Products</CardTitle>
            <CardDescription>Latest inventory publications across the platform</CardDescription>
          </div>
          <Link href="/products" className="cursor-pointer">
            <Button variant="outline" size="sm" className="text-xs">
              View All Products
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 overflow-x-auto">
          {recentProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No products registered in the database yet.
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Seller</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Available Stock</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {product.product_name}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {product.sellers?.seller_name || 'Unknown Seller'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-foreground">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-medium">{product.available_stock}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
