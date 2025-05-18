
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  roles: string[]; // e.g., ['customer', 'vip', 'affiliate', 'admin']
  // E-commerce specific fields
  wishlist?: string[]; // Array of product IDs
  orders?: string[]; // Array of order IDs
  // Other fields like shipping addresses can be added here
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isPrivate?: boolean; // For VIP collections
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "M", "Red"
  sku: string;
  price: number;
  stock: number;
  imageId?: string; // Link to a specific image for this variant
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number; // For sales
  images: ProductImage[];
  variants?: ProductVariant[]; // If product has variants like size/color
  categories: Pick<Category, 'id' | 'name' | 'slug'>[];
  collections?: Pick<Collection, 'id' | 'name' | 'slug'>[];
  tags?: string[];
  // Detailed Product Page fields
  fabricDetails?: string;
  careInstructions?: string;
  sustainabilityMetrics?: string;
  fitGuide?: string; // Could be text or link to a fit predictor tool
  sku?: string; // Base SKU if no variants or for default variant
  stock?: number; // Base stock if no variants
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CartItem {
  id: string; // Typically productId or variantId
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  dataAiHint?: string; // For placeholder image hints
  // variantDetails?: Pick<ProductVariant, 'name' | 'value'>[];
}

export interface OrderAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  fullName: string;
  phone?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  currency: string; // e.g., 'NPR', 'USD'
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingMethod?: string;
  trackingNumber?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string; // Optional badge/label
  children?: NavItem[]; // For dropdowns/mega menus
  authRequired?: boolean; // If link should only be shown to authenticated users
  rolesRequired?: string[]; // Specific roles needed
}

// For the AI Chatbot
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// For Brand Storytelling
export interface StoryContentBlock {
  type: 'text' | 'image' | 'video' | 'quote';
  content: string; // Text content, or URL for image/video
  caption?: string;
}

export interface StoryPage {
  title: string;
  slug: string;
  heroImage?: string;
  blocks: StoryContentBlock[];
}

export interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'color';
  options?: { value: string; label: string; color?: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface BreadcrumbItem {
  name: string;
  href?: string;
}
