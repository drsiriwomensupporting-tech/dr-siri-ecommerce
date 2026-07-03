-- 1. Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$function$;

-- 3. Create public.profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role = ANY (ARRAY['admin'::text, 'seller'::text, 'customer'::text])),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create public.sellers table
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT NOT NULL,
  contact_person_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT NOT NULL UNIQUE,
  business_description TEXT,
  business_logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create public.categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create public.products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0::numeric),
  available_stock INTEGER NOT NULL CHECK (available_stock >= 0),
  stock_status TEXT NOT NULL CHECK (stock_status = ANY (ARRAY['IN_STOCK'::text, 'LOW_STOCK'::text, 'OUT_OF_STOCK'::text])),
  thumbnail_image_url TEXT,
  image_urls TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create public.reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  review_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Create public.wishlist table
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create public.system_settings table
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Create public.notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS Policies

-- Profiles Policies
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (is_admin());

-- Sellers Policies
CREATE POLICY "Anyone can view active sellers" ON public.sellers FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage all sellers" ON public.sellers FOR ALL TO authenticated USING (is_admin());

-- Categories Policies
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage all categories" ON public.categories FOR ALL TO authenticated USING (is_admin());

-- Products Policies
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT TO public USING ((is_active = true) AND (EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = products.seller_id AND sellers.is_active = true)));
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL TO authenticated USING (is_admin());

-- Reviews Policies
CREATE POLICY "Anyone can submit reviews" ON public.reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT TO public USING (approval_status = 'APPROVED'::text);
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL TO authenticated USING (is_admin());

-- Wishlist Policies
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist FOR ALL TO authenticated USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins can view all wishlists for analytics" ON public.wishlist FOR SELECT TO authenticated USING (is_admin());

-- System Settings Policies
CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage all system settings" ON public.system_settings FOR ALL TO authenticated USING (is_admin());

-- Notifications Policies
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (is_admin());

-- 13. Grant Privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 14. Create Trigger Functions and Triggers

-- Review Trigger
CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES (
    'NEW_REVIEW',
    'New Review Submitted',
    'A new review has been submitted for approval by customer ' || COALESCE(NEW.customer_name, 'Anonymous') || '.',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.on_review_created();

-- Seller Trigger
CREATE OR REPLACE FUNCTION public.on_seller_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES (
    'NEW_SELLER',
    'New Seller Registration',
    'New seller registered: ' || NEW.seller_name || ' (' || NEW.contact_person_name || ').',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_seller_created
  AFTER INSERT ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.on_seller_created();

-- 15. Create Storage Buckets
-- Note: Storage buckets exist in the storage schema managed by Supabase storage-api
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', true),
  ('sellers', 'sellers', true),
  ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access policies on storage buckets
CREATE POLICY "Allow public read access to objects" ON storage.objects FOR SELECT TO public USING (bucket_id = ANY (ARRAY['products'::text, 'sellers'::text, 'categories'::text]));
CREATE POLICY "Allow admins to upload objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = ANY (ARRAY['products'::text, 'sellers'::text, 'categories'::text])) AND is_admin());
CREATE POLICY "Allow admins to update objects" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = ANY (ARRAY['products'::text, 'sellers'::text, 'categories'::text])) AND is_admin());
CREATE POLICY "Allow admins to delete objects" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = ANY (ARRAY['products'::text, 'sellers'::text, 'categories'::text])) AND is_admin());
