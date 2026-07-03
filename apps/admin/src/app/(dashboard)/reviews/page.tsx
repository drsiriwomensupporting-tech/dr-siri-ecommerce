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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@drsiri/ui'
import { toast } from 'sonner'
import { 
  Search, 
  MoreVertical, 
  Check, 
  X, 
  Trash2, 
  Settings2, 
  Star, 
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { formatDate, getReviewStatusColor } from '@drsiri/utils'

export default function ReviewsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<any | null>(null)
  const itemsPerPage = 8

  // Fetch reviews with product details
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(product_name, thumbnail_image_url)')
        .order('review_date', { ascending: false })

      if (error) {
        toast.error('Failed to load reviews: ' + error.message)
        throw error
      }
      return data
    }
  })

  // Fetch System Settings for review workflow
  const { data: settings = { auto_publish: false } } = useQuery({
    queryKey: ['system-settings-review'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'review_workflow')
        .single()
      
      if (error && error.code !== 'PGRST116') {
        toast.error('Failed to load settings: ' + error.message)
      }
      return data ? data.value : { auto_publish: false }
    }
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ approval_status: status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      toast.success(`Review status updated to ${variables.status}!`)
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => {
      toast.error('Failed to update status: ' + error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Review deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => {
      toast.error('Failed to delete review: ' + error.message)
    }
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (autoPublish: boolean) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'review_workflow', 
          value: { auto_publish: autoPublish } 
        })
      if (error) throw error
    },
    onSuccess: (_, autoPublish) => {
      toast.success(`Review workflow configuration set to: ${autoPublish ? 'Auto Publish' : 'Admin Approval'}`)
      queryClient.invalidateQueries({ queryKey: ['system-settings-review'] })
    },
    onError: (error: any) => {
      toast.error('Failed to update workflow configuration: ' + error.message)
    }
  })

  // Filter reviews list
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.review && review.review.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (review.products?.product_name && review.products.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && review.approval_status === statusFilter
  })

  // Pagination
  const totalItems = filteredReviews.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`size-3.5 ${star <= rating ? 'text-secondary fill-secondary' : 'text-slate-200'}`} 
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Reviews Module</h2>
        <p className="text-sm text-muted-foreground">Approve, reject, delete, and configure client review workflows.</p>
      </div>

      {/* Review Workflow Settings Header */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-base font-bold flex items-center gap-1.5">
            <Settings2 className="size-4 text-primary" />
            Review Moderation Policy
          </CardTitle>
          <CardDescription>Configure how review submissions behave when sent by clients.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {settings.auto_publish ? 'Auto Publish Enabled' : 'Admin Approval Required'}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {settings.auto_publish 
                ? 'Incoming reviews are automatically published. No manual admin moderation required.' 
                : 'Reviews will default to "Pending" status and must be approved by an administrator before appearing.'
              }
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant={!settings.auto_publish ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSettingsMutation.mutate(false)}
              className="text-xs cursor-pointer"
            >
              Require Approval
            </Button>
            <Button
              variant={settings.auto_publish ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSettingsMutation.mutate(true)}
              className="text-xs cursor-pointer"
            >
              Auto Publish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search Bar */}
      <Card className="border-border shadow-xs">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/75" />
            <Input
              type="text"
              placeholder="Search by customer, review, or product..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 bg-background border-border text-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(status as any)
                  setCurrentPage(1)
                }}
                className="capitalize text-xs cursor-pointer shrink-0"
              >
                {status.toLowerCase()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table Card */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary mb-2" />
              <span>Fetching reviews...</span>
            </div>
          ) : paginatedReviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No reviews found matching the selected filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Rating</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Content</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-2 max-w-xs">
                        <div className="size-8 rounded-md bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                          {review.products?.thumbnail_image_url ? (
                            <img src={review.products.thumbnail_image_url} alt="" className="size-full object-cover" />
                          ) : (
                            <MessageSquare className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-semibold text-xs text-foreground truncate">
                          {review.products?.product_name || 'Deleted Product'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 font-medium text-foreground text-xs">
                      {review.customer_name}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center">
                      <div className="flex justify-center">{renderStars(review.rating)}</div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground max-w-sm whitespace-normal">
                      <p className="line-clamp-2 leading-relaxed" title={review.review}>
                        {review.review || <span className="italic text-muted-foreground/60">No text provided.</span>}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(review.review_date)}
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${getReviewStatusColor(review.approval_status)}`}>
                        {review.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setSelectedReview(review)}
                          className="size-7 border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                          title="View Review Details"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        {review.approval_status === 'PENDING' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'APPROVED' })}
                              className="size-7 border-border text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 cursor-pointer"
                              title="Approve Review"
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'REJECTED' })}
                              className="size-7 border-border text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 cursor-pointer"
                              title="Reject Review"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 p-0 cursor-pointer">
                              <MoreVertical className="size-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                            <DropdownMenuItem 
                              onClick={() => setSelectedReview(review)}
                              className="text-xs cursor-pointer"
                            >
                              <Eye className="size-3.5 mr-2 text-muted-foreground" />
                              View Details
                            </DropdownMenuItem>
                            {review.approval_status !== 'APPROVED' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'APPROVED' })}
                                className="text-xs cursor-pointer"
                              >
                                <Check className="size-3.5 mr-2 text-emerald-600" />
                                Approve Review
                              </DropdownMenuItem>
                            )}
                            {review.approval_status !== 'REJECTED' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'REJECTED' })}
                                className="text-xs cursor-pointer"
                              >
                                <X className="size-3.5 mr-2 text-rose-600" />
                                Reject Review
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this review?')) {
                                  deleteMutation.mutate(review.id)
                                }
                              }}
                              className="text-xs text-rose-600 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="size-3.5 mr-2" />
                              Delete Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      {/* View Review Modal */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border">
                <div className="size-10 rounded bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0">
                  {selectedReview.products?.thumbnail_image_url ? (
                    <img src={selectedReview.products.thumbnail_image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <MessageSquare className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate text-foreground">
                    {selectedReview.products?.product_name || 'Deleted Product'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Product ID: {selectedReview.product_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Customer Name</span>
                  <span className="text-foreground font-medium">{selectedReview.customer_name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Submitted On</span>
                  <span className="text-foreground font-medium">{formatDate(selectedReview.review_date)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Rating</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`size-3.5 ${i < selectedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-muted/40'}`} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Status</span>
                  <div>
                    <Badge variant="outline" className={`text-[10px] font-semibold border ${getReviewStatusColor(selectedReview.approval_status)}`}>
                      {selectedReview.approval_status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Review Comment</span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mt-1 p-3 bg-muted/20 border border-border rounded-lg">
                  {selectedReview.review || <span className="italic text-muted-foreground/60">No text comment provided.</span>}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                {selectedReview.approval_status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedReview.id, status: 'REJECTED' })
                        setSelectedReview(null)
                      }}
                      className="border-border text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 cursor-pointer"
                    >
                      <X className="size-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedReview.id, status: 'APPROVED' })
                        setSelectedReview(null)
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
                    >
                      <Check className="size-3.5 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
                {selectedReview.approval_status === 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedReview.id, status: 'REJECTED' })
                      setSelectedReview(null)
                    }}
                    className="border-border text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 cursor-pointer"
                  >
                    <X className="size-3.5 mr-1" />
                    Reject / Hide
                  </Button>
                )}
                {selectedReview.approval_status === 'REJECTED' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedReview.id, status: 'APPROVED' })
                      setSelectedReview(null)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer"
                  >
                    <Check className="size-3.5 mr-1" />
                    Approve / Show
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedReview(null)} className="cursor-pointer">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
