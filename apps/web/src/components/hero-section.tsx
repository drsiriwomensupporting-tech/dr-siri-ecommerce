'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Button } from '@drsiri/ui'
import {
  ArrowRight,
  ShoppingBag,
  Star,
  ShieldCheck,
  Sparkles,
  Users,
  MessageCircle,
} from 'lucide-react'

interface HeroSectionProps {
  heroProducts: any[]
}

export function HeroSection({ heroProducts }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Motion values for mouse position relative to center of screen (normalized between -0.5 and 0.5)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring animations for smooth damping
  const springConfig = { stiffness: 60, damping: 20, mass: 1 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  // Transform coordinates into different translation scales for depth layers (parallax)
  // Far background layer
  const bgX = useTransform(xSpring, [-0.5, 0.5], [-15, 15])
  const bgY = useTransform(ySpring, [-0.5, 0.5], [-15, 15])

  // Midground layer (images)
  const img1X = useTransform(xSpring, [-0.5, 0.5], [-25, 25])
  const img1Y = useTransform(ySpring, [-0.5, 0.5], [-25, 25])

  const img2X = useTransform(xSpring, [-0.5, 0.5], [30, -30])
  const img2Y = useTransform(ySpring, [-0.5, 0.5], [-35, 35])

  const img3X = useTransform(xSpring, [-0.5, 0.5], [-40, 40])
  const img3Y = useTransform(ySpring, [-0.5, 0.5], [40, -40])

  // Foreground layer (pills/badges)
  const pill1X = useTransform(xSpring, [-0.5, 0.5], [-45, 45])
  const pill1Y = useTransform(ySpring, [-0.5, 0.5], [-45, 45])

  const pill2X = useTransform(xSpring, [-0.5, 0.5], [50, -50])
  const pill2Y = useTransform(ySpring, [-0.5, 0.5], [50, -50])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left - width / 2
    const mouseY = e.clientY - rect.top - height / 2

    x.set(mouseX / width)
    y.set(mouseY / height)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="gradient-mesh-hero relative overflow-hidden min-h-[92vh] flex items-center select-none"
    >
      {/* Decorative blurred background orbs */}
      <motion.div 
        style={{ x: bgX, y: bgY }}
        className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" 
      />
      <motion.div 
        style={{ x: bgX, y: bgY }}
        className="absolute bottom-0 right-0 size-[500px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" 
      />

      <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Column — Text & CTAs */}
          <div className="flex flex-col items-start gap-6 z-10">
            {/* Handcrafted curating indicator */}
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-secondary animate-fade-up">
              <span>Handcrafted Items</span>
              <span className="size-1.5 rounded-full bg-secondary/70 shrink-0" />
              <span>Curated with Care</span>
            </div>

            {/* Main headline */}
            <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-foreground tracking-tight leading-[1.05] animate-fade-up delay-100">
              Supporting{' '}
              <span className="relative">
                <span className="text-gradient-primary">Women,</span>
              </span>
              <br />
              One Purchase
              <br />
              <span className="text-gradient-gold">at a Time.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-up delay-200">
              Dr. Siri is a premium catalog celebrating local craftsmanship —
              sarees, pickles, chocolates, jewellery &amp; more. Contact artisans
              directly on WhatsApp.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 animate-fade-up delay-300">
              <Link href="/products">
                <Button
                  size="lg"
                  className="inline-flex items-center gap-2 font-bold cursor-pointer h-12 px-7 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all text-white bg-primary hover:bg-primary/90"
                >
                  Explore Products
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button
                  variant="outline"
                  size="lg"
                  className="inline-flex items-center gap-2 font-bold cursor-pointer h-12 px-7 border-border bg-white/80 hover:bg-white transition-all text-foreground"
                >
                  View Categories
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5 pt-2 animate-fade-up delay-400">
              {[
                { icon: Users, text: '50+ Verified Sellers' },
                { icon: MessageCircle, text: 'Direct WhatsApp Purchase' },
                { icon: ShieldCheck, text: 'Zero Commission' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Icon className="size-3.5 text-primary shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — 3D Interactive Floating Collage */}
          <div className="hidden lg:block relative h-[540px]">
            {/* Layer 1: Main product frame (deepest layer) */}
            <motion.div
              style={{ x: img1X, y: img1Y, rotate: -2 }}
              className="absolute top-0 right-8 w-64 h-72 rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-muted z-10"
            >
              {heroProducts[0]?.thumbnail_image_url ? (
                <Image
                  src={heroProducts[0].thumbnail_image_url}
                  alt={heroProducts[0].product_name}
                  fill
                  className="object-cover"
                  sizes="256px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center">
                  <ShoppingBag className="size-12 text-primary/30" />
                </div>
              )}
              {heroProducts[0] && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-bold truncate">{heroProducts[0].product_name}</p>
                  <p className="text-white/70 text-[10px]">₹{heroProducts[0].price}</p>
                </div>
              )}
            </motion.div>

            {/* Layer 2: Second product frame (mid layer) */}
            <motion.div
              style={{ x: img2X, y: img2Y, rotate: 3 }}
              className="absolute top-28 left-0 w-52 h-60 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-muted z-20"
            >
              {heroProducts[1]?.thumbnail_image_url ? (
                <Image
                  src={heroProducts[1].thumbnail_image_url}
                  alt={heroProducts[1]?.product_name || 'Product'}
                  fill
                  className="object-cover"
                  sizes="208px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                  <ShoppingBag className="size-10 text-secondary/40" />
                </div>
              )}
            </motion.div>

            {/* Layer 3: Third product frame (upper mid layer) */}
            <motion.div
              style={{ x: img3X, y: img3Y, rotate: -4 }}
              className="absolute bottom-0 right-4 w-48 h-52 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-muted z-30"
            >
              {heroProducts[2]?.thumbnail_image_url ? (
                <Image
                  src={heroProducts[2].thumbnail_image_url}
                  alt={heroProducts[2]?.product_name || 'Product'}
                  fill
                  className="object-cover"
                  sizes="192px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/15 flex items-center justify-center">
                  <ShoppingBag className="size-8 text-primary/25" />
                </div>
              )}
            </motion.div>

            {/* Layer 4: Quality pill (foreground foreground layer) */}
            <motion.div
              style={{ x: pill1X, y: pill1Y }}
              className="absolute top-8 left-12 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-border z-40"
            >
              <div className="size-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                <Star className="size-4 text-secondary fill-secondary/50" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-foreground">Premium Quality</p>
                <p className="text-[10px] text-muted-foreground">Hand-curated catalog</p>
              </div>
            </motion.div>

            {/* Layer 5: WhatsApp pill (foreground foreground layer) */}
            <motion.div
              style={{ x: pill2X, y: pill2Y }}
              className="absolute bottom-24 left-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-border z-50"
            >
              <div className="size-9 rounded-xl bg-green-50 flex items-center justify-center">
                <MessageCircle className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-foreground">Buy on WhatsApp</p>
                <p className="text-[10px] text-muted-foreground">Direct from seller</p>
              </div>
            </motion.div>

            {/* Grid dot background pattern (follows background parallax) */}
            <motion.div
              style={{
                x: bgX,
                y: bgY,
                backgroundImage: 'radial-gradient(rgba(13, 148, 136, 0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
              className="absolute inset-0 -z-10 opacity-20 pointer-events-none"
            />
          </div>

        </div>
      </div>

      {/* Wave bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0 32C240 64 480 0 720 32C960 64 1200 0 1440 32V64H0V32Z" fill="oklch(0.98 0.01 80)" />
        </svg>
      </div>
    </section>
  )
}
