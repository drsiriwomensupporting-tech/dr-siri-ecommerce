'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })

  const galleryImages = images.length > 0 ? images : []

  if (galleryImages.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-muted/40 flex items-center justify-center border border-border">
        <ShoppingBag className="size-16 text-muted-foreground/30" />
      </div>
    )
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {/* Main Cover Display */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-white shadow-2xs group">
        
        {/* Navigation Arrows */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); handlePrev(); }}
              className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 size-9 items-center justify-center rounded-full border border-border/80 bg-white/90 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="size-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handleNext(); }}
              className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 size-9 items-center justify-center rounded-full border border-border/80 bg-white/90 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="size-5 text-foreground" />
            </button>
          </>
        )}

        {/* Image with Hover Zoom on Desktop */}
        <div
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          className="relative size-full cursor-zoom-in"
        >
          <Image
            src={galleryImages[activeIndex]}
            alt={productName}
            fill
            priority
            sizes="(max-w-7xl) 50vw, 100vw"
            className={`object-cover transition-transform duration-100 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            style={
              isZoomed
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : undefined
            }
          />
        </div>
      </div>

      {/* Thumbnails Navigation Row */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto py-1">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative size-16 rounded-lg overflow-hidden border bg-white shrink-0 transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'border-primary ring-2 ring-primary/10'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
