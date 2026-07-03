-- 1. Create Mock Admin User (Email: admin@drsiri.com, Password: admin123)
-- Password hash generated using bcrypt for 'admin123'
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  'd7b6b107-1bfa-4c4f-9e7f-712f5a043c8b',
  '00000000-0000-0000-0000-000000000000',
  'admin@drsiri.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"role":"admin","provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Create matching admin profile in public.profiles
INSERT INTO public.profiles (id, email, role)
VALUES ('d7b6b107-1bfa-4c4f-9e7f-712f5a043c8b', 'admin@drsiri.com', 'admin')
ON CONFLICT (id) DO NOTHING;


-- 2. Insert Dummy Categories
INSERT INTO public.categories (id, category_name, description, image_url)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Banarasi Sarees', 'Traditional hand-woven silk sarees from Varanasi.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Terracotta Jewelry', 'Hand-crafted earthen jewelry reflecting ethnic heritage.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400'),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Handcrafted Bags', 'Sustainable, eco-friendly jute and cotton bags.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400'),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'Apparel & Kurtas', 'Casual and formal organic cotton clothing for women.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400'),
  ('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'Home Decor Artisans', 'Macrame wall hangings and handcrafted home accessories.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (id) DO NOTHING;


-- 3. Insert Dummy Sellers
INSERT INTO public.sellers (id, seller_name, contact_person_name, mobile_number, whatsapp_number, email, business_description, business_logo_url, is_active)
VALUES
  ('11111111-2222-3333-4444-555555555555', 'Asha Weaves', 'Asha Devi', '9876543210', '9876543210', 'asha@drsiri-seller.com', 'We weave traditional Banarasi silk sarees on handlooms, preserving age-old patterns passed down for generations.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', true),
  ('22222222-3333-4444-5555-666666666666', 'Mati Crafts', 'Radha Rani', '9988776655', '9988776655', 'radha@drsiri-seller.com', 'Specialists in terracotta designs, offering sustainable and beautifully hand-painted earrings, necklaces, and home accents.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150', true),
  ('33333333-4444-5555-6666-777777777777', 'Jute Creations', 'Priya Sen', '9123456789', NULL, 'priya@drsiri-seller.com', 'Empowering rural women by creating trendy, functional, and 100% biodegradable jute bags and lifestyle items.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', true),
  ('44444444-5555-6666-7777-888888888888', 'Organic Threads', 'Kiran Bedi', '9567890123', '9567890123', 'kiran@drsiri-seller.com', 'Ethically sourced, naturally dyed clothing items ensuring comfortable summer wear while supporting cotton growers.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', false)
ON CONFLICT (id) DO NOTHING;


-- 4. Insert Dummy Products
INSERT INTO public.products (id, seller_id, category_id, product_name, description, price, available_stock, stock_status, thumbnail_image_url, image_urls, is_active)
VALUES
  (
    '00000000-0000-0000-0001-000000000001', 
    '11111111-2222-3333-4444-555555555555', 
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    'Royal Crimson Banarasi Saree', 
    'Exquisite crimson silk saree featuring intricate zari work. Handcrafted on traditional looms over a span of 18 days.', 
    8500.00, 3, 'IN_STOCK', 
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600', 
    ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600'], 
    true
  ),
  (
    '00000000-0000-0000-0001-000000000002', 
    '11111111-2222-3333-4444-555555555555', 
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    'Classic Mustard Katan Silk Saree', 
    'Pure Katan silk in elegant mustard yellow with antique border. Perfect for festive celebrations.', 
    6200.00, 1, 'LOW_STOCK', 
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', 
    ARRAY['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'], 
    true
  ),
  (
    '00000000-0000-0000-0002-000000000001', 
    '22222222-3333-4444-5555-666666666666', 
    'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 
    'Floral Terracotta Jhumkas', 
    'Clay earrings shaped as blooming flowers, painted in earthy orange and gold. Extremely lightweight and allergy-free.', 
    350.00, 15, 'IN_STOCK', 
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600', 
    ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600'], 
    true
  ),
  (
    '00000000-0000-0000-0002-000000000002', 
    '22222222-3333-4444-5555-666666666666', 
    'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 
    'Ganesha Clay Pendant Necklace', 
    'Artistic hand-modeled Ganesha necklace in rich terracotta clay. Paired with adjustable thread.', 
    650.00, 0, 'OUT_OF_STOCK', 
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600', 
    ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600'], 
    true
  ),
  (
    '00000000-0000-0000-0003-000000000001', 
    '33333333-4444-5555-6666-777777777777', 
    'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 
    'Chevron Jute Tote Bag', 
    'Spacious jute bag printed with black-and-white chevron pattern. Features sturdy cotton handles and inner secure zipper pocket.', 
    490.00, 30, 'IN_STOCK', 
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600', 
    ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600'], 
    true
  ),
  (
    '00000000-0000-0000-0004-000000000001', 
    '44444444-5555-6666-7777-888888888888', 
    'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 
    'Indigo blockprint Cotton Kurta', 
    'Organic cotton printed with natural indigo dyes. Perfect summer staple, breathable and comfortable.', 
    1200.00, 12, 'IN_STOCK', 
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600', 
    ARRAY['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600'], 
    true
  )
ON CONFLICT (id) DO NOTHING;


-- 5. Insert Dummy Reviews
INSERT INTO public.reviews (id, product_id, customer_name, rating, review, approval_status, review_date)
VALUES
  ('11111111-aaaa-bbbb-cccc-000000000001', '00000000-0000-0000-0001-000000000001', 'Anita Deshmukh', 5, 'The Banarasi saree is absolutely breathtaking. True master workmanship!', 'APPROVED', now() - INTERVAL '3 days'),
  ('22222222-aaaa-bbbb-cccc-000000000002', '00000000-0000-0000-0001-000000000001', 'Meera Patel', 4, 'Very beautiful color, but took a bit longer to deliver. Happy with the quality.', 'APPROVED', now() - INTERVAL '1 day'),
  ('33333333-aaaa-bbbb-cccc-000000000003', '00000000-0000-0000-0002-000000000001', 'Sneha Paul', 5, 'Love these terracotta earrings! They are so light and look very pretty.', 'APPROVED', now() - INTERVAL '12 hours'),
  ('44444444-aaaa-bbbb-cccc-000000000004', '00000000-0000-0000-0003-000000000001', 'Kriti Sharma', 3, 'Spacious, but the print pattern looks slightly faded compared to the photo.', 'PENDING', now() - INTERVAL '2 hours'),
  ('55555555-aaaa-bbbb-cccc-000000000005', '00000000-0000-0000-0001-000000000002', 'Devika Nair', 5, 'Yellow color is radiant! Feels so authentic.', 'PENDING', now() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;


-- 6. Insert System Settings
INSERT INTO public.system_settings (key, value, updated_at)
VALUES
  ('general_config', '{"platform_name": "Dr. Siri", "contact_email": "support@drsiri.com", "currency": "INR", "tax_percentage": 5}', now()),
  ('featured_items', '{"featured_categories": ["a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", "b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e"]}', now())
ON CONFLICT (key) DO NOTHING;


-- 7. Insert Dummy Notifications
INSERT INTO public.notifications (id, type, title, message, is_read, reference_id, created_at)
VALUES
  ('99999999-1111-2222-3333-444444444441', 'NEW_REVIEW', 'New Review Submitted', 'A new review has been submitted for approval by customer Kriti Sharma.', false, '44444444-aaaa-bbbb-cccc-000000000004', now() - INTERVAL '2 hours'),
  ('99999999-1111-2222-3333-444444444442', 'NEW_REVIEW', 'New Review Submitted', 'A new review has been submitted for approval by customer Devika Nair.', false, '55555555-aaaa-bbbb-cccc-000000000005', now() - INTERVAL '15 minutes'),
  ('99999999-1111-2222-3333-444444444443', 'NEW_SELLER', 'New Seller Registration', 'New seller registered: Organic Threads (Kiran Bedi).', true, '44444444-5555-6666-7777-888888888888', now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
