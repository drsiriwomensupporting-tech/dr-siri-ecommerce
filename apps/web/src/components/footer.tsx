'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Heart, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react'

export function Footer() {
  const supabase = createClient()

  const { data: categories = [] } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, category_name')
        .limit(5)
      if (error) throw error
      return data
    }
  })

  return (
    <footer className="w-full border-t border-border bg-foreground text-white/80">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">

          {/* Brand Column */}
          <div className="md:col-span-1 flex flex-col gap-5">
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Dr. Siri
              </span>
              <p className="text-xs font-semibold text-secondary mt-0.5 tracking-wider uppercase">
                Women Supporting Women
              </p>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              A premium catalog empowering women entrepreneurs — sarees, chocolates, pickles, jewellery &
              more. Connect with artisans directly on WhatsApp.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-1">
              {[
                { icon: Instagram, label: 'Instagram', href: '#' },
                { icon: Twitter, label: 'Twitter', href: '#' },
                { icon: Facebook, label: 'Facebook', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="size-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Explore</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'All Products', href: '/products' },
                { label: 'Categories', href: '/categories' },
                { label: 'My Wishlist', href: '/wishlist' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Categories</h4>
            <ul className="flex flex-col gap-2.5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?category=${c.id}`}
                    className="text-xs text-white/50 hover:text-white transition-colors"
                  >
                    {c.category_name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <>
                  <li><span className="text-xs text-white/30">Sarees</span></li>
                  <li><span className="text-xs text-white/30">Chocolates</span></li>
                  <li><span className="text-xs text-white/30">Pickles</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Contact</h4>
            <ul className="flex flex-col gap-3">
              {[
                { icon: Mail, text: 'support@drsiri.com' },
                { icon: Phone, text: '+91 98765 43210' },
                { icon: MapPin, text: 'Hyderabad, India' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <div className="size-6 rounded-md bg-white/8 flex items-center justify-center shrink-0">
                    <Icon className="size-3 text-secondary" />
                  </div>
                  <span className="text-xs text-white/55">{text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/35">
          <span>
            © {new Date().getFullYear()} Dr. Siri – Women Supporting Women. All rights reserved.
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            Made with <Heart className="size-3 text-rose-400 fill-rose-400" /> for women empowerment
          </span>
        </div>
      </div>
    </footer>
  )
}
