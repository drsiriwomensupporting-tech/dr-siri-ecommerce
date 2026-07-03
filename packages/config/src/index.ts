export const LOW_STOCK_THRESHOLD = 5;

export const ITEMS_PER_PAGE = 10;

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const STORAGE_BUCKET_PRODUCTS = 'products';
export const STORAGE_BUCKET_SELLERS = 'sellers';
export const STORAGE_BUCKET_CATEGORIES = 'categories';

export const STOCK_STATUSES = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;

export const REVIEW_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CUSTOMER: 'customer',
} as const;
