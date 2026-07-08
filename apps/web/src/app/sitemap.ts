import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://drsiri.com'

  // Instantiate server client
  const supabase = await createClient()

  // Fetch products
  const { data: productsData } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true)
  const products = productsData || []

  // Fetch sellers
  const { data: sellersData } = await supabase
    .from('sellers')
    .select('id, updated_at')
    .eq('is_active', true)
  const sellers = sellersData || []

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id')
  const categories = categoriesData || []

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: new Date(p.updated_at),
  }))

  const sellerUrls = sellers.map((s) => ({
    url: `${baseUrl}/sellers/${s.id}`,
    lastModified: new Date(s.updated_at),
  }))

  const categoryUrls = categories.map((c) => ({
    url: `${baseUrl}/products?category=${c.id}`,
    lastModified: new Date(),
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productUrls,
    ...sellerUrls,
    ...categoryUrls,
  ]
}
