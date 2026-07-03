export type UserRole = 'admin' | 'seller' | 'customer';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  seller_name: string;
  contact_person_name: string;
  mobile_number: string;
  whatsapp_number: string | null;
  email: string;
  business_description: string | null;
  business_logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  category_name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  product_name: string;
  description: string | null;
  price: number;
  available_stock: number;
  stock_status: StockStatus;
  thumbnail_image_url: string | null;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  seller?: Seller;
  category?: Category;
}

export type ReviewApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  review: string | null;
  approval_status: ReviewApprovalStatus;
  review_date: string;
  // Joins
  product?: Product;
}

export interface Wishlist {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  // Joins
  product?: Product;
}

export interface ReviewWorkflowConfig {
  auto_publish: boolean;
}

export interface SystemSettings {
  review_workflow: ReviewWorkflowConfig;
}
