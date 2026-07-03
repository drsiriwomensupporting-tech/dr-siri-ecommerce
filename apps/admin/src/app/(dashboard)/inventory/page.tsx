'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@drsiri/ui'
import { toast } from 'sonner'
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Warehouse, 
  Plus, 
  Minus, 
  Edit3, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  PackageCheck
} from 'lucide-react'
import { getStockStatusColor } from '@drsiri/utils'

export default function InventoryPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Adjust Dialog States
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase')
  const [adjustmentValue, setAdjustmentValue] = useState('')

  // Fetch Products with Stock
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, sellers(seller_name)')
        .order('available_stock', { ascending: true }) // Put low stock first

      if (error) {
        toast.error('Failed to load products: ' + error.message)
        throw error
      }
      return data
    }
  })

  // Mutation to update stock
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, newStock, newStatus }: { id: string; newStock: number; newStatus: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          available_stock: newStock,
          stock_status: newStatus 
        })
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Stock adjusted successfully!')
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Invalidate product module queries too
      setAdjustingProduct(null)
      setAdjustmentValue('')
    },
    onError: (error: any) => {
      toast.error('Failed to adjust stock: ' + error.message)
    }
  })

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustingProduct) return

    const value = parseInt(adjustmentValue, 10)
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid positive integer value.')
      return
    }

    let newStock = adjustingProduct.available_stock
    if (adjustmentType === 'increase') {
      newStock += value
    } else if (adjustmentType === 'decrease') {
      newStock = Math.max(0, newStock - value)
    } else if (adjustmentType === 'set') {
      newStock = value
    }

    // Determine derived status (will match backend trigger fallback, but sending it is safe)
    let derivedStatus = 'IN_STOCK'
    if (newStock <= 0) {
      derivedStatus = 'OUT_OF_STOCK'
    } else if (newStock <= 5) {
      derivedStatus = 'LOW_STOCK'
    }

    adjustStockMutation.mutate({
      id: adjustingProduct.id,
      newStock,
      newStatus: derivedStatus
    })
  }

  // Filter products list
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sellers?.seller_name && product.sellers.seller_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (stockFilter === 'all') return matchesSearch
    return matchesSearch && product.stock_status === stockFilter
  })

  // Pagination
  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const openAdjustDialog = (product: any, type: 'increase' | 'decrease' | 'set') => {
    setAdjustingProduct(product)
    setAdjustmentType(type)
    setAdjustmentValue('')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Inventory Module</h2>
        <p className="text-sm text-muted-foreground">Monitor inventory levels, restock items, and configure low-stock warnings.</p>
      </div>

      {/* Stock Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Stock Items</span>
            <CheckCircle className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display tracking-tight text-foreground">
              {products.filter(p => p.stock_status === 'IN_STOCK').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Healthy inventory levels</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Low Stock Warnings</span>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display tracking-tight text-foreground">
              {products.filter(p => p.stock_status === 'LOW_STOCK').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stock count is 5 or less</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Out of Stock Items</span>
            <XCircle className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display tracking-tight text-foreground">
              {products.filter(p => p.available_stock === 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border shadow-xs">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
            <Input
              type="text"
              placeholder="Search products or sellers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 bg-background border-border text-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((status) => (
              <Button
                key={status}
                variant={stockFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStockFilter(status as any)
                  setCurrentPage(1)
                }}
                className="capitalize text-xs cursor-pointer shrink-0"
              >
                {status === 'all' ? 'All levels' : status.replace('_', ' ').toLowerCase()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventory List Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary mb-2" />
              <span>Fetching inventory logs...</span>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No inventory records match the selected parameters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seller Business</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Current Stock</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-right">Quick Stock Adjustments</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const isLow = product.stock_status === 'LOW_STOCK'
                  const isOut = product.available_stock === 0
                  return (
                    <TableRow key={product.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="px-6 py-3.5 font-semibold text-sm text-foreground">
                        {product.product_name}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-xs text-muted-foreground">
                        {product.sellers?.seller_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-center font-bold text-sm">
                        <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}>
                          {product.available_stock}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-center">
                        <Badge variant="outline" className={`text-[10px] font-semibold border ${getStockStatusColor(product.stock_status)}`}>
                          {product.stock_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openAdjustDialog(product, 'increase')}
                            className="text-xs h-8 border-border text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 cursor-pointer"
                          >
                            <Plus className="size-3 mr-1" />
                            Restock
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openAdjustDialog(product, 'decrease')}
                            className="text-xs h-8 border-border text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 cursor-pointer"
                            disabled={product.available_stock === 0}
                          >
                            <Minus className="size-3 mr-1" />
                            Deduct
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openAdjustDialog(product, 'set')}
                            className="text-xs h-8 border-border text-primary hover:bg-primary/5 cursor-pointer"
                          >
                            <Edit3 className="size-3 mr-1" />
                            Set Total
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card rounded-lg shadow-xs">
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
          <span className="text-xs text-muted-foreground font-medium">
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

      {/* Adjustment Dialog Modal */}
      <Dialog open={adjustingProduct !== null} onOpenChange={(open) => !open && setAdjustingProduct(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold flex items-center gap-1.5">
              <Warehouse className="size-4.5 text-primary" />
              Adjust Stock Count
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Adjusting stock levels for: <span className="font-semibold text-foreground">{adjustingProduct?.product_name}</span>
            </p>
          </DialogHeader>

          {adjustingProduct && (
            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4 py-3">
              <div className="p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Level</span>
                  <span className="text-sm font-bold text-foreground mt-0.5">{adjustingProduct.available_stock} items</span>
                </div>
                <Badge variant="outline" className={`text-[9px] border ${getStockStatusColor(adjustingProduct.stock_status)}`}>
                  {adjustingProduct.stock_status}
                </Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  {adjustmentType === 'increase' ? 'Restock Quantity' : adjustmentType === 'decrease' ? 'Deduction Quantity' : 'Set Exact Stock Total'}
                </label>
                <Input
                  type="number"
                  placeholder={adjustmentType === 'set' ? '50' : '10'}
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  className="bg-background border-border"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdjustingProduct(null)} className="border-border">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={adjustStockMutation.isPending}>
                  {adjustStockMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Confirm Adjust
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
