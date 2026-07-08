import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ImageGallery } from '@/components/image-gallery'
import { ProductCard } from '@/components/product-card'
import { WishlistDetailButton } from '@/components/wishlist-detail-button'
import { Button, Badge, Card, CardContent } from '@drsiri/ui'
import { 
  formatCurrency, 
  formatDate, 
  getStockStatusColor 
} from '@drsiri/utils'
import { 
  Phone, 
  MessageCircle, 
  Star, 
  Calendar, 
  User, 
  ArrowLeft, 
  Building 
} from 'lucide-react'

export const revalidate = 60 // Revalidate product page every 60 seconds

interface PageProps {
  params: Promise<{ id: string }>
}

// 1. Dynamic Metadata Generation for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(category_name)')
    .eq('id', id)
    .single()

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.product_name,
    description: product.description || `Buy ${product.product_name} in ${product.categories?.category_name || 'handcrafted catalogue'} from verified women entrepreneurs.`,
    openGraph: {
      title: product.product_name,
      description: product.description || `Buy ${product.product_name} directly from verified women sellers.`,
      images: product.thumbnail_image_url ? [{ url: product.thumbnail_image_url }] : [],
    },
  }
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch current product with joints
  const { data: product } = await supabase
    .from('products')
    .select('*, sellers(*), categories(*)')
    .eq('id', id)
    .single()

  if (!product || !product.is_active) {
    notFound()
  }

  // Fetch approved customer reviews
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', id)
    .eq('approval_status', 'APPROVED')
    .order('review_date', { ascending: false })
  const reviews = reviewsData || []

  // Fetch up to 4 related products in same category (excluding current)
  const { data: relatedProductsData } = await supabase
    .from('products')
    .select('*, sellers(seller_name), categories(category_name)')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', id)
    .limit(4)
  const relatedProducts = relatedProductsData || []

  // 2. Format WhatsApp Contact Message Link
  const whatsappNumber = product.sellers?.whatsapp_number || product.sellers?.mobile_number || ''
  const messageTemplate = `Hello,

I'm interested in purchasing the following product.

Product:
${product.product_name}

Category:
${product.categories?.category_name || 'General'}

Could you please provide more details regarding availability and ordering?

Thank you.`

  let cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber
  }
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageTemplate)}`

  // Rating Stats
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : 0

  // 3. Schema.org JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.product_name,
    'image': product.image_urls.length > 0 ? product.image_urls : [product.thumbnail_image_url],
    'description': product.description,
    'offers': {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': 'INR',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.available_stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    'aggregateRating': totalReviews > 0 ? {
      '@type': 'AggregateRating',
      'ratingValue': averageRating,
      'reviewCount': totalReviews,
    } : undefined,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-12">
      
      {/* JSON-LD injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back Button */}
      <div>
        <Link href="/products" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 w-fit">
          <ArrowLeft className="size-3.5" />
          Back to Catalogue
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Gallery column */}
        <div className="lg:col-span-5 w-full">
          <ImageGallery images={product.image_urls} productName={product.product_name} />
        </div>

        {/* Product Details Column */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Tags and Availability */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/products?category=${product.category_id}`}>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20 cursor-pointer">
                {product.categories?.category_name || 'General'}
              </Badge>
            </Link>
            <Badge variant="outline" className={`text-[10px] font-bold border uppercase tracking-wider ${getStockStatusColor(product.stock_status)}`}>
              {product.stock_status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Title and Pricing */}
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-foreground tracking-tight leading-tight">
              {product.product_name}
            </h1>
            <span className="font-display font-black text-2xl sm:text-3xl text-foreground mt-2">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Product Description */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {product.description || <span className="italic text-muted-foreground/60">No description provided for this item.</span>}
            </p>
          </div>

          {/* Seller Block */}
          {product.sellers && (
            <Card className="border-border bg-muted/20">
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="size-12 rounded-lg bg-card flex items-center justify-center overflow-hidden border border-border shrink-0">
                  {product.sellers.business_logo_url ? (
                    <img src={product.sellers.business_logo_url} alt="" className="size-full object-cover" />
                  ) : (
                    <Building className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Creator / Seller</span>
                  </div>
                  <Link href={`/sellers/${product.seller_id}`} className="font-display font-bold text-sm text-foreground hover:text-primary transition-colors hover:underline">
                    {product.sellers.seller_name}
                  </Link>
                  <span className="text-xs text-muted-foreground truncate line-clamp-1 mt-0.5">
                    {product.sellers.business_description || 'Verified Women Entrepreneur'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="lg" className="w-full font-bold bg-[#25D366] hover:bg-[#20ba56] text-white border-none cursor-pointer h-11 gap-2 shadow-xs">
                <MessageCircle className="size-5 fill-white text-[#25D366]" />
                Contact Seller on WhatsApp
              </Button>
            </a>
            <WishlistDetailButton productId={product.id} />
          </div>

        </div>

      </div>

      {/* Customer Reviews Section */}
      <section className="border-t border-border pt-12">
        <div className="flex flex-col gap-6 max-w-3xl">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Customer Reviews</h2>
            {totalReviews > 0 ? (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`size-4 ${i < Math.round(parseFloat(averageRating as string)) ? 'text-amber-400 fill-amber-400' : 'text-muted/40'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  {averageRating} out of 5 ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Read honest feedback from previous customers</p>
            )}
          </div>

          <div className="flex flex-col gap-4 divide-y divide-border">
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 pt-4 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] border border-primary/10">
                      <User className="size-3" />
                    </div>
                    <span className="font-semibold text-xs text-foreground">{r.customer_name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(r.review_date)}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`size-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted/40'}`} 
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                  {r.review}
                </p>
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/10 border border-border rounded-xl">
                No reviews yet for this product.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-border pt-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
