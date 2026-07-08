import React from 'react'
import Link from 'next/link'
import { Button } from '@drsiri/ui'
import { FileQuestion, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/10">
        <FileQuestion className="size-8" />
      </div>
      <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
        The product, seller, or page you are looking for does not exist or has been moved by Dr. Siri admins.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <Button className="font-bold cursor-pointer h-10 px-5">
            Go to Home
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" className="inline-flex items-center gap-2 font-bold cursor-pointer h-10 px-5 border-border">
            Browse Catalogue
            <ArrowRight className="size-4 shrink-0" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
