'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { 
  Button, 
  Input, 
  Textarea, 
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
  DialogTitle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@drsiri/ui'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ShoppingBag, 
  Upload, 
  Image as ImageIcon, 
  Star, 
  X, 
  ArrowUpDown,
  Move,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { formatDate, formatCurrency, deriveStockStatus, getStockStatusColor } from '@drsiri/utils'

// Zod validation schema
const productSchema = z.object({
  product_name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  seller_id: z.string().uuid({ message: 'Please select a seller.' }),
  category_id: z.string().uuid({ message: 'Please select a category.' }).nullable(),
  description: z.string().optional().or(z.literal('')),
  price: z.number().min(0, { message: 'Price must be 0 or more.' }),
  available_stock: z.number().int().min(0, { message: 'Stock must be 0 or more.' }),
  stock_status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']),
  thumbnail_image_url: z.string().nullable().optional(),
  image_urls: z.array(z.string()),
  is_active: z.boolean()
})

type ProductFormValues = z.infer<typeof productSchema>

function ProductsPageContent() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const searchParamQuery = searchParams.get('search')

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setSearchQuery(searchParamQuery || '')
  }, [searchParamQuery])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sellerFilter, setSellerFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Dialog forms
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  
  // Image states
  const [uploadingImages, setUploadingImages] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Fetch Sellers, Categories, and Products
  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sellers').select('id, seller_name').eq('is_active', true)
      if (error) throw error
      return data
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, category_name')
      if (error) throw error
      return data
    }
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, sellers(seller_name), categories(category_name)')
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to load products: ' + error.message)
        throw error
      }
      return data
    }
  })

  // Forms Setup
  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: '',
      seller_id: '',
      category_id: null,
      description: '',
      price: 0,
      available_stock: 0,
      stock_status: 'OUT_OF_STOCK',
      thumbnail_image_url: null,
      image_urls: [],
      is_active: true
    }
  })

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: '',
      seller_id: '',
      category_id: null,
      description: '',
      price: 0,
      available_stock: 0,
      stock_status: 'OUT_OF_STOCK',
      thumbnail_image_url: null,
      image_urls: [],
      is_active: true
    }
  })

  // Watch stock in Add/Edit Forms to auto-derive status
  const watchedAddStock = addForm.watch('available_stock')
  const watchedEditStock = editForm.watch('available_stock')

  useEffect(() => {
    const stock = Number(watchedAddStock || 0)
    addForm.setValue('stock_status', deriveStockStatus(stock))
  }, [watchedAddStock, addForm])

  useEffect(() => {
    const stock = Number(watchedEditStock || 0)
    editForm.setValue('stock_status', deriveStockStatus(stock))
  }, [watchedEditStock, editForm])

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const { data, error } = await supabase
        .from('products')
        .insert([values])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Product created successfully!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsAddOpen(false)
      addForm.reset()
    },
    onError: (error: any) => {
      toast.error('Failed to create product: ' + error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProductFormValues }) => {
      const { data, error } = await supabase
        .from('products')
        .update(values)
        .eq('id', id)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Product updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setEditingProduct(null)
    },
    onError: (error: any) => {
      toast.error('Failed to update product: ' + error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Product deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: any) => {
      toast.error('Failed to delete product: ' + error.message)
    }
  })

  // Image Upload Handler (supports multiple files)
  const uploadFiles = async (files: FileList, formType: 'add' | 'edit') => {
    setUploadingImages(true)
    const currentForm = formType === 'add' ? addForm : editForm
    const currentUrls = currentForm.getValues('image_urls') || []
    const newUrls: string[] = [...currentUrls]

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > 5 * 1024 * 1024) {
          toast.warning(`File "${file.name}" exceeds 5MB size limit. Skipping.`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `product_${Date.now()}_${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName)

        newUrls.push(publicUrl)
      }

      currentForm.setValue('image_urls', newUrls, { shouldValidate: true })

      // Set first image as thumbnail if none is set
      const currentThumbnail = currentForm.getValues('thumbnail_image_url')
      if (!currentThumbnail && newUrls.length > 0) {
        currentForm.setValue('thumbnail_image_url', newUrls[0], { shouldValidate: true })
      }

      toast.success('Images uploaded successfully!')
    } catch (err: any) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImages(false)
    }
  }

  // File Drop Event Handler
  const handleDrop = (e: React.DragEvent, formType: 'add' | 'edit') => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files, formType)
    }
  }

  // Image deletion handler
  const deleteImage = (urlToDelete: string, formType: 'add' | 'edit') => {
    const currentForm = formType === 'add' ? addForm : editForm
    const urls = currentForm.getValues('image_urls') || []
    const updatedUrls = urls.filter(url => url !== urlToDelete)
    currentForm.setValue('image_urls', updatedUrls, { shouldValidate: true })

    // If thumbnail was deleted, set it to the next available, or null
    const currentThumbnail = currentForm.getValues('thumbnail_image_url')
    if (currentThumbnail === urlToDelete) {
      currentForm.setValue(
        'thumbnail_image_url', 
        updatedUrls.length > 0 ? updatedUrls[0] : null, 
        { shouldValidate: true }
      )
    }
  }

  // Native Drag and Drop Reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDropReorder = (e: React.DragEvent, targetIndex: number, formType: 'add' | 'edit') => {
    e.preventDefault()
    setDragOverIndex(null)
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return

    const currentForm = formType === 'add' ? addForm : editForm
    const urls = [...currentForm.getValues('image_urls')]

    // Swap items
    const [removed] = urls.splice(sourceIndex, 1)
    urls.splice(targetIndex, 0, removed)

    currentForm.setValue('image_urls', urls, { shouldValidate: true })
  }

  // Filter products list
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    const matchesSeller = sellerFilter === 'all' || product.seller_id === sellerFilter
    
    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = product.is_active
    if (statusFilter === 'inactive') matchesStatus = !product.is_active
    if (statusFilter === 'out_of_stock') matchesStatus = product.available_stock === 0
    if (statusFilter === 'low_stock') matchesStatus = product.stock_status === 'LOW_STOCK'

    return matchesSearch && matchesCategory && matchesSeller && matchesStatus
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let multiplier = sortOrder === 'asc' ? 1 : -1
    if (sortBy === 'name') return a.product_name.localeCompare(b.product_name) * multiplier
    if (sortBy === 'price') return (a.price - b.price) * multiplier
    if (sortBy === 'stock') return (a.available_stock - b.available_stock) * multiplier
    if (sortBy === 'date') return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * multiplier
    return 0
  })

  // Pagination
  const totalItems = sortedProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleEditClick = (product: any) => {
    setEditingProduct(product)
    editForm.reset({
      product_name: product.product_name,
      seller_id: product.seller_id,
      category_id: product.category_id,
      description: product.description || '',
      price: product.price,
      available_stock: product.available_stock,
      stock_status: product.stock_status,
      thumbnail_image_url: product.thumbnail_image_url,
      image_urls: product.image_urls || [],
      is_active: product.is_active
    })
  }

  const triggerSort = (field: 'name' | 'price' | 'stock' | 'date') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Products Module</h2>
          <p className="text-sm text-muted-foreground">Publish products, allocate stock status, and manage images.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="cursor-pointer">
          <Plus className="size-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
              <Input
                type="text"
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8 bg-background border-border text-sm"
              />
            </div>

            {/* Category / Seller / Status Filters */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto">
              <div className="flex flex-col min-w-36">
                <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1) }}>
                  <SelectTrigger className="text-xs h-9 bg-background border-border">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col min-w-36">
                <Select value={sellerFilter} onValueChange={(val) => { setSellerFilter(val); setCurrentPage(1) }}>
                  <SelectTrigger className="text-xs h-9 bg-background border-border">
                    <SelectValue placeholder="Seller" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Sellers</SelectItem>
                    {sellers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col min-w-36 col-span-2 sm:col-span-1">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1) }}>
                  <SelectTrigger className="text-xs h-9 bg-background border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="inactive">Inactive only</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary mb-2" />
              <span>Fetching products...</span>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No products found. Add a product to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none" onClick={() => triggerSort('name')}>
                    <div className="flex items-center gap-1">
                      Product Name
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none" onClick={() => triggerSort('price')}>
                    <div className="flex items-center gap-1">
                      Price
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center cursor-pointer select-none" onClick={() => triggerSort('stock')}>
                    <div className="flex items-center gap-1 justify-center">
                      Stock
                      <ArrowUpDown className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Stock Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Active</th>
                  <th className="px-6 py-3 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="px-6 py-3.5">
                      <div className="size-10 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                        {product.thumbnail_image_url ? (
                          <img src={product.thumbnail_image_url} alt="Thumbnail" className="size-full object-cover" />
                        ) : (
                          <ImageIcon className="size-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 font-semibold text-sm text-foreground whitespace-normal max-w-xs">
                      <div className="flex flex-col">
                        <span>{product.product_name}</span>
                        {product.image_urls?.length > 1 && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            +{product.image_urls.length - 1} more images
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground">
                      {product.categories?.category_name || <span className="italic text-muted-foreground/60">Uncategorized</span>}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs font-medium text-foreground">
                      {product.sellers?.seller_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 font-bold text-foreground">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center font-semibold text-foreground text-sm">
                      {product.available_stock}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center">
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${getStockStatusColor(product.stock_status)}`}>
                        {product.stock_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center">
                      <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 p-0 cursor-pointer">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                          <DropdownMenuItem onClick={() => handleEditClick(product)} className="text-xs cursor-pointer">
                            <Edit className="size-3.5 mr-2 text-muted-foreground" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${product.product_name}?`)) {
                                deleteMutation.mutate(product.id)
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Add Product Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-3xl border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold">Add New Product</DialogTitle>
            <p className="text-xs text-muted-foreground">Publish a new product item under a category and seller.</p>
          </DialogHeader>

          <form onSubmit={addForm.handleSubmit((values) => createMutation.mutate(values))} className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Left side text input details */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Product Name</label>
                <Input placeholder="E.g. Traditional Banarasi Saree" {...addForm.register('product_name')} />
                {addForm.formState.errors.product_name && (
                  <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.product_name.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Seller</label>
                  <Controller
                    name="seller_id"
                    control={addForm.control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Select Seller</option>
                        {sellers.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.seller_name}</option>
                        ))}
                      </select>
                    )}
                  />
                  {addForm.formState.errors.seller_id && (
                    <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.seller_id.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <select 
                    {...addForm.register('category_id')}
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Price (INR)</label>
                  <Input type="number" step="0.01" placeholder="999.00" {...addForm.register('price', { valueAsNumber: true })} />
                  {addForm.formState.errors.price && (
                    <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.price.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Available Stock</label>
                  <Input type="number" placeholder="25" {...addForm.register('available_stock', { valueAsNumber: true })} />
                  {addForm.formState.errors.available_stock && (
                    <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.available_stock.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Stock Status</label>
                  <select 
                    {...addForm.register('stock_status')}
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="add-active" className="size-4 text-primary border-border rounded" {...addForm.register('is_active')} />
                  <label htmlFor="add-active" className="text-xs font-semibold text-muted-foreground uppercase cursor-pointer">Active Product</label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <Textarea placeholder="Explain sizing details, artisan workmanship, delivery..." rows={4} {...addForm.register('description')} />
              </div>
            </div>

            {/* Right side Image Manager */}
            <div className="flex flex-col gap-4 border-l border-border pl-0 lg:pl-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Product Images Manager</label>
              
              {/* Drag and Drop Box */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'add')}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/10 transition-colors flex flex-col justify-center items-center gap-2 relative cursor-pointer"
              >
                <input 
                  type="file" 
                  id="images-add-upload"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && uploadFiles(e.target.files, 'add')}
                  className="hidden" 
                />
                <label htmlFor="images-add-upload" className="cursor-pointer size-full absolute inset-0 z-10" />
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {uploadingImages ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary hover:underline">Click to upload</span>
                  <span className="text-xs text-muted-foreground"> or drag & drop</span>
                </div>
                <p className="text-[10px] text-muted-foreground">PNG, JPEG, WEBP up to 5MB each. Drag images to reorder.</p>
              </div>

              {/* Uploaded Images List with drag-and-drop reordering */}
              {addForm.watch('image_urls')?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 bg-muted/10 rounded-lg">
                  {addForm.watch('image_urls').map((url, idx) => {
                    const isThumbnail = addForm.watch('thumbnail_image_url') === url
                    return (
                      <div 
                        key={url}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDropReorder(e, idx, 'add')}
                        className={`group aspect-square rounded-lg border bg-card relative overflow-hidden flex items-center justify-center cursor-move transition-all ${
                          dragOverIndex === idx ? 'border-primary scale-95 shadow-md' : 'border-border'
                        } ${isThumbnail ? 'ring-2 ring-secondary' : ''}`}
                      >
                        <img src={url} alt={`Product ${idx}`} className="size-full object-cover" />
                        
                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => addForm.setValue('thumbnail_image_url', url)}
                            className={`p-1 rounded-full ${isThumbnail ? 'bg-secondary text-white' : 'bg-white/80 hover:bg-white text-slate-800'}`}
                            title="Set as Thumbnail"
                          >
                            <Star className="size-3.5 fill-current" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => deleteImage(url, 'add')}
                            className="p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                            title="Delete Image"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>

                        {/* Thumbnail indicator */}
                        {isThumbnail && (
                          <div className="absolute top-1 left-1 bg-secondary text-white rounded-[4px] px-1 text-[8px] font-bold uppercase tracking-wider">
                            Cover
                          </div>
                        )}
                        <Move className="absolute bottom-1 right-1 size-3 text-white/50 group-hover:text-white/85" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="border border-border rounded-lg py-8 flex flex-col justify-center items-center text-muted-foreground text-xs bg-muted/5 gap-1">
                  <ImageIcon className="size-5 text-muted-foreground/60" />
                  No product images uploaded yet.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-1 lg:col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending || uploadingImages}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Save Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog Modal */}
      <Dialog open={editingProduct !== null} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-3xl border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold">Edit Product</DialogTitle>
            <p className="text-xs text-muted-foreground">Modify product attributes, pricing, stock allocation, and images.</p>
          </DialogHeader>

          {editingProduct && (
            <form onSubmit={editForm.handleSubmit((values) => updateMutation.mutate({ id: editingProduct.id, values }))} className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
              {/* Left Form Attributes */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Product Name</label>
                  <Input placeholder="E.g. Traditional Banarasi Saree" {...editForm.register('product_name')} />
                  {editForm.formState.errors.product_name && (
                    <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.product_name.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Seller</label>
                    <Controller
                      name="seller_id"
                      control={editForm.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors"
                        >
                          <option value="">Select Seller</option>
                          {sellers.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.seller_name}</option>
                          ))}
                        </select>
                      )}
                    />
                    {editForm.formState.errors.seller_id && (
                      <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.seller_id.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                    <select 
                      {...editForm.register('category_id')}
                      className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Price (INR)</label>
                    <Input type="number" step="0.01" placeholder="999.00" {...editForm.register('price', { valueAsNumber: true })} />
                    {editForm.formState.errors.price && (
                      <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.price.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Available Stock</label>
                    <Input type="number" placeholder="25" {...editForm.register('available_stock', { valueAsNumber: true })} />
                    {editForm.formState.errors.available_stock && (
                      <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.available_stock.message}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Stock Status</label>
                    <select 
                      {...editForm.register('stock_status')}
                      className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors"
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="LOW_STOCK">Low Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" id="edit-active" className="size-4 text-primary border-border rounded" {...editForm.register('is_active')} />
                    <label htmlFor="edit-active" className="text-xs font-semibold text-muted-foreground uppercase cursor-pointer">Active Product</label>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                  <Textarea placeholder="Explain sizing details, artisan workmanship, delivery..." rows={4} {...editForm.register('description')} />
                </div>
              </div>

              {/* Right Image Manager */}
              <div className="flex flex-col gap-4 border-l border-border pl-0 lg:pl-6">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Product Images Manager</label>
                
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'edit')}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/10 transition-colors flex flex-col justify-center items-center gap-2 relative cursor-pointer"
                >
                  <input 
                    type="file" 
                    id="images-edit-upload"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && uploadFiles(e.target.files, 'edit')}
                    className="hidden" 
                  />
                  <label htmlFor="images-edit-upload" className="cursor-pointer size-full absolute inset-0 z-10" />
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {uploadingImages ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary hover:underline">Click to upload</span>
                    <span className="text-xs text-muted-foreground"> or drag & drop</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">PNG, JPEG, WEBP up to 5MB each. Drag images to reorder.</p>
                </div>

                {editForm.watch('image_urls')?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 bg-muted/10 rounded-lg">
                    {editForm.watch('image_urls').map((url, idx) => {
                      const isThumbnail = editForm.watch('thumbnail_image_url') === url
                      return (
                        <div 
                          key={url}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDropReorder(e, idx, 'edit')}
                          className={`group aspect-square rounded-lg border bg-card relative overflow-hidden flex items-center justify-center cursor-move transition-all ${
                            dragOverIndex === idx ? 'border-primary scale-95 shadow-md' : 'border-border'
                          } ${isThumbnail ? 'ring-2 ring-secondary' : ''}`}
                        >
                          <img src={url} alt={`Product ${idx}`} className="size-full object-cover" />
                          
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => editForm.setValue('thumbnail_image_url', url)}
                              className={`p-1 rounded-full ${isThumbnail ? 'bg-secondary text-white' : 'bg-white/80 hover:bg-white text-slate-800'}`}
                              title="Set as Thumbnail"
                            >
                              <Star className="size-3.5 fill-current" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => deleteImage(url, 'edit')}
                              className="p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                              title="Delete Image"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>

                          {isThumbnail && (
                            <div className="absolute top-1 left-1 bg-secondary text-white rounded-[4px] px-1 text-[8px] font-bold uppercase tracking-wider">
                              Cover
                            </div>
                          )}
                          <Move className="absolute bottom-1 right-1 size-3 text-white/50 group-hover:text-white/85" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="border border-border rounded-lg py-8 flex flex-col justify-center items-center text-muted-foreground text-xs bg-muted/5 gap-1">
                    <ImageIcon className="size-5 text-muted-foreground/60" />
                    No product images uploaded yet.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 lg:col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingProduct(null)} className="border-border">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending || uploadingImages}>
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Update Product
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary mb-2 animate-pulse" />
        <span>Loading products page...</span>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
