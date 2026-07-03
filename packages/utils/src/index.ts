import { LOW_STOCK_THRESHOLD, STOCK_STATUSES } from '@drsiri/config';
import { StockStatus } from '@drsiri/types';

export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string, locale = 'en-IN'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function deriveStockStatus(stock: number): StockStatus {
  if (stock <= 0) {
    return STOCK_STATUSES.OUT_OF_STOCK;
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return STOCK_STATUSES.LOW_STOCK;
  }
  return STOCK_STATUSES.IN_STOCK;
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case 'IN_STOCK':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'LOW_STOCK':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'OUT_OF_STOCK':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

export function getReviewStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'PENDING':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'REJECTED':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}
