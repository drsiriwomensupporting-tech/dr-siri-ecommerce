import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Button, Card, CardContent } from '@drsiri/ui'
import { 
  Building, 
  MessageCircle, 
  Mail, 
  Phone, 
  ArrowLeft,
  ShoppingBag
} from 'lucide-react'

export const revalidate = 60 // Revalidate seller profile page every 60 seconds

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: seller } = await supabase
    .from('sellers')
    .select('seller_name, business_description')
    .eq('id', id)
    .single()

  if (!seller) {
    return {
      title: 'Seller Not Found',
    }
  }

  return {
    title: `${seller.seller_name} Profile`,
    description: seller.business_description || `View products and catalog items created by ${seller.seller_name} on Dr. Siri.`,
  }
}

export default async function SellerProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch seller profile
  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', id)
    .single()

  if (!seller || !seller.is_active) {
    notFound()
  }

  // 2. Fetch all active products by this seller
  const { data: productsData } = await supabase
    .from('products')
    .select('*, sellers(seller_name), categories(category_name)')
    .eq('seller_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  const products = productsData || []

  // Format WhatsApp Link
  const whatsappNumber = seller.whatsapp_number || seller.mobile_number || ''
  const messageTemplate = `Hello,

I saw your seller profile on Dr. Siri. I'm interested in browsing your items and learning more.

Could you please share your latest updates?

Thank you.`

  let cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber
  }
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageTemplate)}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-10">
      
      {/* Back Button */}
      <div>
        <Link href="/products" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 w-fit">
          <ArrowLeft className="size-3.5" />
          Back to Products
        </Link>
      </div>

      {/* Seller Header Section */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            {/* Logo */}
            <div className="size-20 rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden border border-border shrink-0 shadow-3xs">
              {seller.business_logo_url ? (
                <img src={seller.business_logo_url} alt="" className="size-full object-cover" />
              ) : (
                <Building className="size-10 text-muted-foreground/60" />
              )}
            </div>
            {/* Seller Info */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Verified Seller</span>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground tracking-tight">
                {seller.seller_name}
              </h1>
              <p className="text-xs text-muted-foreground max-w-xl mt-1 leading-relaxed">
                {seller.business_description || 'Connecting premium handcrafted items to customers directly.'}
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-3 border-t border-border pt-4 md:border-none md:pt-0">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full font-bold bg-[#25D366] hover:bg-[#20ba56] text-white border-none cursor-pointer h-10 gap-2 shadow-xs">
                <MessageCircle className="size-4.5 fill-white text-[#25D366]" />
                Chat with Seller
              </Button>
            </a>
          </div>

        </div>

        {/* Contact info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/80 text-xs">
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/50">
            <Phone className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Mobile Contact</span>
              <span className="font-semibold text-foreground mt-0.5">{seller.mobile_number}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/50">
            <MessageCircle className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp Number</span>
              <span className="font-semibold text-foreground mt-0.5">{seller.whatsapp_number || seller.mobile_number}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/50">
            <Mail className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</span>
              <span className="font-semibold text-foreground mt-0.5 truncate">{seller.email}</span>
            </div>
          </div>

        </div>
      </section>

      {/* Seller products catalog */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Products by {seller.seller_name}</h2>
          <p className="text-xs text-muted-foreground mt-1">Browse items created by this entrepreneur</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl shadow-2xs">
              <ShoppingBag className="size-12 text-muted-foreground/30 mb-4" />
              <span className="font-semibold text-foreground">No Products Listed Yet</span>
              <p className="text-xs text-muted-foreground mt-1">
                This seller has not listed any active products at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
