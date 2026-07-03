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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@drsiri/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Tags, 
  Grid, 
  List,
  Loader2,
  Upload,
  Calendar,
  Layers
} from 'lucide-react'
import { formatDate } from '@drsiri/utils'

// Zod Validation Schema
const categorySchema = z.object({
  category_name: z.string().min(2, { message: 'Category name must be at least 2 characters.' }),
  description: z.string().optional().or(z.literal('')),
  image_url: z.string().optional().or(z.literal('')),
})

type CategoryFormValues = z.infer<typeof categorySchema>

function CategoriesPageContent() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const searchParamQuery = searchParams.get('search')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setSearchQuery(searchParamQuery || '')
  }, [searchParamQuery])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Dialog controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // React Query Fetch Categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(id)')
        .order('category_name', { ascending: true })

      if (error) {
        toast.error('Failed to load categories: ' + error.message)
        throw error
      }

      // Map metrics
      return data.map((category: any) => ({
        ...category,
        productsCount: category.products?.length || 0
      }))
    }
  })

  // Forms
  const addForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      category_name: '',
      description: '',
      image_url: ''
    }
  })

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema)
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([values])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Category created successfully!')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsAddOpen(false)
      addForm.reset()
    },
    onError: (error: any) => {
      toast.error('Failed to create category: ' + error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CategoryFormValues }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(values)
        .eq('id', id)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Category updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategory(null)
    },
    onError: (error: any) => {
      toast.error('Failed to update category: ' + error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Category deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error: any) => {
      toast.error('Failed to delete category: ' + error.message)
    }
  })

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5 MB.')
      return
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `category_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('categories')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('categories')
        .getPublicUrl(fileName)

      if (formType === 'add') {
        addForm.setValue('image_url', publicUrl, { shouldValidate: true })
      } else {
        editForm.setValue('image_url', publicUrl, { shouldValidate: true })
      }
      toast.success('Category image uploaded successfully!')
    } catch (err: any) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  // Filter categories
  const filteredCategories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditClick = (category: any) => {
    setEditingCategory(category)
    editForm.reset({
      category_name: category.category_name,
      description: category.description || '',
      image_url: category.image_url || ''
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Categories Module</h2>
          <p className="text-sm text-muted-foreground">Manage and seed categories of products sold on the platform.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="cursor-pointer">
          <Plus className="size-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Filters, View Toggle and Search bar */}
      <Card className="border-border">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-background border-border text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 border border-border rounded-lg p-1 bg-muted/20">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7 p-0 cursor-pointer"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="size-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7 p-0 cursor-pointer"
              onClick={() => setViewMode('list')}
            >
              <List className="size-4" />
              <span className="sr-only">List View</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Categories Render */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary mb-2" />
          <span>Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No categories found.
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="border-border overflow-hidden flex flex-col group hover:border-primary/20 transition-colors">
              <div className="h-44 bg-muted/40 relative flex items-center justify-center overflow-hidden border-b border-border shrink-0">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.category_name} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Layers className="size-10 text-muted-foreground/60" />
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {category.productsCount} {category.productsCount === 1 ? 'Product' : 'Products'}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base font-bold text-foreground">
                    {category.category_name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-6 p-0 cursor-pointer">
                        <MoreVertical className="size-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                      <DropdownMenuItem onClick={() => handleEditClick(category)} className="text-xs cursor-pointer">
                        <Edit className="size-3.5 mr-2 text-muted-foreground" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${category.category_name}? This will unclassify all its products.`)) {
                            deleteMutation.mutate(category.id)
                          }
                        }}
                        className="text-xs text-rose-600 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete Category
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
                  {category.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/75 mt-3 pt-3 border-t border-border/50">
                  <Calendar className="size-3" />
                  Added {formatDate(category.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View Layout */
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Products Count</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-3 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="px-6 py-3.5">
                      <div className="size-12 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                        {category.image_url ? (
                          <img src={category.image_url} alt="Thumbnail" className="size-full object-cover" />
                        ) : (
                          <Layers className="size-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 font-semibold text-sm text-foreground">
                      {category.category_name}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground max-w-sm truncate">
                      {category.description || 'No description'}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center font-bold text-foreground text-sm">
                      {category.productsCount}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground">
                      {formatDate(category.created_at)}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 p-0 cursor-pointer">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                          <DropdownMenuItem onClick={() => handleEditClick(category)} className="text-xs cursor-pointer">
                            <Edit className="size-3.5 mr-2 text-muted-foreground" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${category.category_name}? This will unclassify all its products.`)) {
                                deleteMutation.mutate(category.id)
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete Category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Category Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold">Add New Category</DialogTitle>
            <p className="text-xs text-muted-foreground">Create a new category classification for e-commerce products.</p>
          </DialogHeader>

          <form onSubmit={addForm.handleSubmit((values) => createMutation.mutate(values))} className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Category Name</label>
              <Input placeholder="E.g. Jewellery, Sarees" {...addForm.register('category_name')} />
              {addForm.formState.errors.category_name && (
                <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.category_name.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
              <Textarea placeholder="Explain what kinds of products belong in this category..." {...addForm.register('description')} />
            </div>

            {/* Category Image Upload */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Category Image</label>
              <div className="flex items-center gap-4 mt-1">
                <div className="size-16 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                  {addForm.watch('image_url') ? (
                    <img src={addForm.watch('image_url')} alt="Preview" className="size-full object-cover" />
                  ) : (
                    <Tags className="size-6 text-muted-foreground/75" />
                  )}
                </div>
                <div className="relative">
                  <Input 
                    type="file" 
                    id="image-add-upload"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'add')}
                    className="hidden" 
                  />
                  <label 
                    htmlFor="image-add-upload" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                  >
                    {uploadingImage ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    Upload Image
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending || uploadingImage}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Save Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog Modal */}
      <Dialog open={editingCategory !== null} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold">Edit Category</DialogTitle>
            <p className="text-xs text-muted-foreground">Modify the classification name and details.</p>
          </DialogHeader>

          {editingCategory && (
            <form onSubmit={editForm.handleSubmit((values) => updateMutation.mutate({ id: editingCategory.id, values }))} className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Category Name</label>
                <Input placeholder="E.g. Jewellery, Sarees" {...editForm.register('category_name')} />
                {editForm.formState.errors.category_name && (
                  <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.category_name.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <Textarea placeholder="Explain what kinds of products belong in this category..." {...editForm.register('description')} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Category Image</label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="size-16 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                    {editForm.watch('image_url') ? (
                      <img src={editForm.watch('image_url')} alt="Preview" className="size-full object-cover" />
                    ) : (
                      <Tags className="size-6 text-muted-foreground/75" />
                    )}
                  </div>
                  <div className="relative">
                    <Input 
                      type="file" 
                      id="image-edit-upload"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="image-edit-upload" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                    >
                      {uploadingImage ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      Upload Image
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingCategory(null)} className="border-border">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending || uploadingImage}>
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Update Category
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary mb-2 animate-pulse" />
        <span>Loading categories page...</span>
      </div>
    }>
      <CategoriesPageContent />
    </Suspense>
  )
}
