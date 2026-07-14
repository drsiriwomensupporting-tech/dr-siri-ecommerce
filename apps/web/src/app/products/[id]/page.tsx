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
  getStockStatusColor 
} from '@drsiri/utils'
import { 
  MessageCircle, 
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
