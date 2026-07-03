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
  Power, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  Upload,
  User,
  ShoppingBag,
  PackageCheck
} from 'lucide-react'
import { formatDate } from '@drsiri/utils'

// Zod Schema for Seller Form
const sellerSchema = z.object({
  seller_name: z.string().min(2, { message: 'Business name must be at least 2 characters.' }),
  contact_person_name: z.string().min(2, { message: 'Contact person name must be at least 2 characters.' }),
  mobile_number: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  whatsapp_number: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  business_description: z.string().optional().or(z.literal('')),
  business_logo_url: z.string().optional().or(z.literal('')),
})

type SellerFormValues = z.infer<typeof sellerSchema>

function SellersPageContent() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const searchParamQuery = searchParams.get('search')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setSearchQuery(searchParamQuery || '')
  }, [searchParamQuery])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState<any | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // React Query Fetch Sellers
  const { data: sellers = [], isLoading, refetch } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*, products(id, available_stock)')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load sellers: ' + error.message)
        throw error
      }

      // Map metrics
      return data.map((seller: any) => {
        const productsList = seller.products || []
        const productsCount = productsList.length
        const totalInventory = productsList.reduce((acc: number, p: any) => acc + p.available_stock, 0)
        return {
          ...seller,
          productsCount,
          totalInventory
        }
      })
    }
  })

  // React Hook Form hooks
  const addForm = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      seller_name: '',
      contact_person_name: '',
      mobile_number: '',
      whatsapp_number: '',
      email: '',
      business_description: '',
      business_logo_url: ''
    }
  })

  const editForm = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema)
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: SellerFormValues) => {
      const { data, error } = await supabase
        .from('sellers')
        .insert([{ ...values, is_active: true }])
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Seller added successfully!')
      queryClient.invalidateQueries({ queryKey: ['sellers'] })
      setIsAddOpen(false)
      addForm.reset()
    },
    onError: (error: any) => {
      toast.error('Failed to add seller: ' + error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SellerFormValues }) => {
      const { data, error } = await supabase
        .from('sellers')
        .update(values)
        .eq('id', id)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Seller updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['sellers'] })
      setEditingSeller(null)
    },
    onError: (error: any) => {
      toast.error('Failed to update seller: ' + error.message)
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('sellers')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Seller status updated!')
      queryClient.invalidateQueries({ queryKey: ['sellers'] })
    },
    onError: (error: any) => {
      toast.error('Failed to update seller status: ' + error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Seller deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['sellers'] })
    },
    onError: (error: any) => {
      toast.error('Failed to delete seller: ' + error.message)
    }
  })

  // Handle Logo Upload to Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5 MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `seller_logo_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('sellers')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('sellers')
        .getPublicUrl(fileName)

      if (formType === 'add') {
        addForm.setValue('business_logo_url', publicUrl, { shouldValidate: true })
      } else {
        editForm.setValue('business_logo_url', publicUrl, { shouldValidate: true })
      }
      toast.success('Logo uploaded successfully!')
    } catch (err: any) {
      toast.error('Logo upload failed: ' + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Filter sellers
  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch = 
      seller.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.contact_person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (statusFilter === 'active') return matchesSearch && seller.is_active
    if (statusFilter === 'inactive') return matchesSearch && !seller.is_active
    return matchesSearch
  })

  // Paginated sellers
  const totalItems = filteredSellers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleEditClick = (seller: any) => {
    setEditingSeller(seller)
    editForm.reset({
      seller_name: seller.seller_name,
      contact_person_name: seller.contact_person_name,
      mobile_number: seller.mobile_number,
      whatsapp_number: seller.whatsapp_number || '',
      email: seller.email,
      business_description: seller.business_description || '',
      business_logo_url: seller.business_logo_url || ''
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Sellers Module</h2>
          <p className="text-sm text-muted-foreground">Add, edit, toggle, and view metrics of Dr. Siri entrepreneurs.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="cursor-pointer">
          <Plus className="size-4 mr-1.5" />
          Add Seller
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="border-border">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
            <Input
              type="text"
              placeholder="Search by business, contact, or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 bg-background border-border text-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {['all', 'active', 'inactive'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(status as any)
                  setCurrentPage(1)
                }}
                className="capitalize text-xs cursor-pointer"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sellers List Table Card */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary mb-2" />
              <span>Fetching sellers list...</span>
            </div>
          ) : paginatedSellers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No sellers found matching the current search criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Products</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Inventory</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSellers.map((seller) => (
                  <TableRow key={seller.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="px-6 py-3.5 whitespace-normal max-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                          {seller.business_logo_url ? (
                            <img src={seller.business_logo_url} alt="Logo" className="size-full object-cover" />
                          ) : (
                            <Building2 className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate text-foreground">{seller.seller_name}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{seller.business_description || 'No description'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <User className="size-3.5 text-muted-foreground" />
                        {seller.contact_person_name}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Mail className="size-3 text-muted-foreground/75" />
                          {seller.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground/75" />
                          {seller.mobile_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center font-semibold text-foreground">
                      <div className="inline-flex items-center gap-1 text-xs">
                        <ShoppingBag className="size-3 text-primary" />
                        {seller.productsCount}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center font-semibold text-foreground">
                      <div className="inline-flex items-center gap-1 text-xs">
                        <PackageCheck className="size-3 text-secondary" />
                        {seller.totalInventory}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground/75" />
                        {formatDate(seller.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <Badge variant={seller.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {seller.is_active ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => handleEditClick(seller)} className="text-xs cursor-pointer">
                            <Edit className="size-3.5 mr-2 text-muted-foreground" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleStatusMutation.mutate({ id: seller.id, is_active: !seller.is_active })}
                            className="text-xs cursor-pointer"
                          >
                            <Power className={`size-3.5 mr-2 ${seller.is_active ? 'text-rose-500' : 'text-emerald-500'}`} />
                            {seller.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${seller.seller_name}? This will delete all their products.`)) {
                                deleteMutation.mutate(seller.id)
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete Seller
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-xs border-border"
          >
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
            className="text-xs border-border"
          >
            Next
          </Button>
        </div>
      )}

      {/* Add Seller Dialog Modals */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold">Add New Seller</DialogTitle>
            <p className="text-xs text-muted-foreground">Register a new women entrepreneur to showcase products on Dr. Siri.</p>
          </DialogHeader>

          <form onSubmit={addForm.handleSubmit((values) => createMutation.mutate(values))} className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Business Name</label>
                <Input placeholder="Siri Sarees" {...addForm.register('seller_name')} />
                {addForm.formState.errors.seller_name && (
                  <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.seller_name.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Contact Person</label>
                <Input placeholder="Siri Devi" {...addForm.register('contact_person_name')} />
                {addForm.formState.errors.contact_person_name && (
                  <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.contact_person_name.message}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Mobile Number</label>
                <Input placeholder="9876543210" {...addForm.register('mobile_number')} />
                {addForm.formState.errors.mobile_number && (
                  <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.mobile_number.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp (Optional)</label>
                <Input placeholder="9876543210" {...addForm.register('whatsapp_number')} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
              <Input type="email" placeholder="siri@drsiri.com" {...addForm.register('email')} />
              {addForm.formState.errors.email && (
                <span className="text-xs text-destructive mt-0.5">{addForm.formState.errors.email.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Business Description</label>
              <Textarea placeholder="Describe the products and artisan focus..." {...addForm.register('business_description')} />
            </div>

            {/* Logo Upload Form Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Business Logo</label>
              <div className="flex items-center gap-4 mt-1">
                <div className="size-16 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                  {addForm.watch('business_logo_url') ? (
                    <img src={addForm.watch('business_logo_url')} alt="Logo preview" className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-6 text-muted-foreground/75" />
                  )}
                </div>
                <div className="relative">
                  <Input 
                    type="file" 
                    id="logo-add-upload"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'add')}
                    className="hidden" 
                  />
                  <label 
                    htmlFor="logo-add-upload" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                  >
                    {uploadingLogo ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    Upload Logo
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending || uploadingLogo}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Save Seller
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Seller Dialog Modal */}
      <Dialog open={editingSeller !== null} onOpenChange={(open) => !open && setEditingSeller(null)}>
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold">Edit Seller Details</DialogTitle>
            <p className="text-xs text-muted-foreground">Modify the seller business configuration details.</p>
          </DialogHeader>

          {editingSeller && (
            <form onSubmit={editForm.handleSubmit((values) => updateMutation.mutate({ id: editingSeller.id, values }))} className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Business Name</label>
                  <Input placeholder="Siri Sarees" {...editForm.register('seller_name')} />
                  {editForm.formState.errors.seller_name && (
                    <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.seller_name.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Contact Person</label>
                  <Input placeholder="Siri Devi" {...editForm.register('contact_person_name')} />
                  {editForm.formState.errors.contact_person_name && (
                    <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.contact_person_name.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Mobile Number</label>
                  <Input placeholder="9876543210" {...editForm.register('mobile_number')} />
                  {editForm.formState.errors.mobile_number && (
                    <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.mobile_number.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp (Optional)</label>
                  <Input placeholder="9876543210" {...editForm.register('whatsapp_number')} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
                <Input type="email" placeholder="siri@drsiri.com" {...editForm.register('email')} />
                {editForm.formState.errors.email && (
                  <span className="text-xs text-destructive mt-0.5">{editForm.formState.errors.email.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Business Description</label>
                <Textarea placeholder="Describe the products and artisan focus..." {...editForm.register('business_description')} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Business Logo</label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="size-16 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                    {editForm.watch('business_logo_url') ? (
                      <img src={editForm.watch('business_logo_url')} alt="Logo preview" className="size-full object-cover" />
                    ) : (
                      <Building2 className="size-6 text-muted-foreground/75" />
                    )}
                  </div>
                  <div className="relative">
                    <Input 
                      type="file" 
                      id="logo-edit-upload"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'edit')}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="logo-edit-upload" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                    >
                      {uploadingLogo ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      Upload Logo
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingSeller(null)} className="border-border">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending || uploadingLogo}>
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Update Seller
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SellersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary mb-2 animate-pulse" />
        <span>Loading sellers page...</span>
      </div>
    }>
      <SellersPageContent />
    </Suspense>
  )
}
