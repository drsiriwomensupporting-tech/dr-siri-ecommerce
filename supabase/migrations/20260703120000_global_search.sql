-- 1. Create B-Tree Indexes on lowercased names for fast case-insensitive prefix search
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON public.products (lower(product_name));
CREATE INDEX IF NOT EXISTS idx_sellers_name_lower ON public.sellers (lower(seller_name));
CREATE INDEX IF NOT EXISTS idx_categories_name_lower ON public.categories (lower(category_name));

-- 2. Create Global Search RPC Function
CREATE OR REPLACE FUNCTION public.global_search(search_query text)
RETURNS jsonb AS $$
DECLARE
  product_results jsonb;
  seller_results jsonb;
  category_results jsonb;
  query_lower text;
BEGIN
  query_lower := lower(search_query);

  -- 1. Search products (prefix match using lower B-tree index)
  SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) INTO product_results
  FROM (
    SELECT id, product_name, price, thumbnail_image_url
    FROM public.products
    WHERE lower(product_name) LIKE query_lower || '%'
    LIMIT 5
  ) p;

  -- 2. Search sellers (prefix match using lower B-tree index)
  SELECT COALESCE(jsonb_agg(s), '[]'::jsonb) INTO seller_results
  FROM (
    SELECT id, seller_name, business_description, business_logo_url
    FROM public.sellers
    WHERE lower(seller_name) LIKE query_lower || '%'
    LIMIT 5
  ) s;

  -- 3. Search categories (prefix match using lower B-tree index)
  SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) INTO category_results
  FROM (
    SELECT id, category_name
    FROM public.categories
    WHERE lower(category_name) LIKE query_lower || '%'
    LIMIT 5
  ) c;

  RETURN jsonb_build_object(
    'products', product_results,
    'sellers', seller_results,
    'categories', category_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant RPC permission
GRANT EXECUTE ON FUNCTION public.global_search(text) TO anon, authenticated, service_role;
