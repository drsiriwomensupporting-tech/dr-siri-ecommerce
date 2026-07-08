import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Button } from '@drsiri/ui'
import { HeroSection } from '@/components/hero-section'
import {
  ArrowRight,
  ShoppingBag,
  Star,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Users,
  MessageCircle,
} from 'lucide-react'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('category_name')
  const categories = categoriesData || []

  const { data: productsData } = await supabase
    .from('products')
    .select('*, sellers(seller_name, is_active), categories(category_name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)
  const products = productsData || []

  // Pick up to 3 hero products that have images
  const heroProducts = products.filter((p: any) => p.thumbnail_image_url).slice(0, 3)

  return (
    <div className="flex flex-col">

      {/* 1. HERO SECTION */}
      <HeroSection heroProducts={heroProducts} />

      {/* ═══════════════════════════════════
          2. STATS BAR
      ═══════════════════════════════════ */}
      <section className="py-10 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+', label: 'Women Entrepreneurs' },
              { value: '100%', label: 'Goes to Seller' },
              { value: '0', label: 'Commission Charged' },
              { value: '∞', label: 'WhatsApp Connections' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-primary">{value}</span>
                <span className="text-xs text-muted-foreground font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          3. FEATURED CATEGORIES
      ═══════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Browse by type</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-1">
                Featured Categories
              </h2>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline underline-offset-4 shrink-0"
            >
              All Categories
              <ArrowRight className="size-3.5 shrink-0" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group flex flex-col items-center p-5 bg-card border border-border rounded-2xl shadow-xs hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center cursor-pointer hover:-translate-y-1"
              >
                <div className="size-14 rounded-xl bg-primary/6 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-3 shadow-xs">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt=""
                      className="size-8 object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingBag className="size-6" />
                  )}
                </div>
                <h3 className="font-display font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-tight">
                  {category.category_name}
                </h3>
              </Link>
            ))}
            {categories?.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                No categories found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          4. NEW ARRIVALS
      ═══════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Fresh in</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-1">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline underline-offset-4 shrink-0"
            >
              All Products
              <ArrowRight className="size-3.5 shrink-0" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products?.length === 0 && (
              <div className="col-span-full py-20 text-center text-xs text-muted-foreground">
                No products available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          5. VALUE PROPS (Dark Teal Panel)
      ═══════════════════════════════════ */}
      <section className="gradient-mesh-dark relative overflow-hidden py-20">
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 size-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Why Dr. Siri</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
              Built on Trust &amp; Community
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Star,
                title: 'Premium Quality',
                desc: 'Every item is hand-selected and carefully reviewed by our admins to guarantee premium, authentic quality.',
                iconBg: 'bg-secondary/20',
                iconColor: 'text-secondary',
              },
              {
                icon: ShieldCheck,
                title: 'Trust & Verification',
                desc: 'All sellers are verified women entrepreneurs. Deal directly with the creators — fully transparent, fully secure.',
                iconBg: 'bg-white/10',
                iconColor: 'text-white',
              },
              {
                icon: HeartHandshake,
                title: 'Direct Support',
                desc: '100% of your payment goes straight to the seller. We charge zero commission — every rupee empowers.',
                iconBg: 'bg-secondary/20',
                iconColor: 'text-secondary',
              },
            ].map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
              >
                <div className={`size-14 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`size-7 ${iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-base text-white">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          6. OUR STORY
      ═══════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image */}
            <div className="relative order-last lg:order-first">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800"
                  alt="Women working together"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              {/* Floating quote card */}
              <div className="absolute -bottom-6 -right-4 lg:right-auto lg:-left-6 bg-white rounded-2xl shadow-xl border border-border p-5 max-w-xs">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;When you support a woman, you support an entire family and community.&rdquo;
                </p>
                <span className="mt-2 block text-xs font-bold text-primary">— Dr. Siri Mission</span>
              </div>
            </div>

            {/* Copy */}
            <div className="flex flex-col gap-6">
              <span className="font-display text-xs font-bold text-primary uppercase tracking-widest">Our Story</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Empowering Women,
                <br />
                <span className="text-gradient-primary">Supporting Communities</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dr. Siri is more than an online catalog — it is a movement. We believe that when you support
                a woman, you support an entire family and community. By giving women entrepreneurs a digital
                platform, we remove technical barriers and bring their craft to the world.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse our collection today. Each product carries a story of dedication, resilience, and talent.
                Contact the seller directly on WhatsApp and take home a piece of handcrafted excellence.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="inline-flex items-center gap-2 font-bold cursor-pointer h-11 px-6"
                  >
                    Shop Now
                    <ArrowRight className="size-4 shrink-0" />
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button
                    variant="outline"
                    size="lg"
                    className="inline-flex items-center gap-2 font-bold cursor-pointer h-11 px-6 border-border"
                  >
                    View Categories
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
