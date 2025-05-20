
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string; // Firebase displayName
  avatarUrl?: string; // Firebase photoURL
  roles: string[]; // e.g., ['customer', 'vip', 'affiliate', 'admin']
  wishlist?: string[]; // Array of product IDs
  // Orders are fetched separately, not stored directly on user object in context
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
  dataAiHint?: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "M", "Red"
  sku?: string; // Optional SKU
  price: number;
  costPrice?: number; // Cost of goods for this variant
  stock: number;
  imageId?: string; // Link to a specific image for this variant
}

export interface PrintDesign {
  id: string;
  name: string;
  imageUrl: string;
  dataAiHint?: string;
}

export interface ProductCustomizationConfig {
  enabled?: boolean;
  allowPredefinedDesigns?: boolean;
  predefinedDesignsLabel?: string;
  allowCustomDescription?: boolean;
  customDescriptionLabel?: string;
  allowInstructions?: boolean;
  instructionsLabel?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number; // For sales
  costPrice?: number; // Cost of goods for the product (if no variants, or a general cost)
  images: ProductImage[];
  variants?: ProductVariant[]; // If product has variants like size/color
  categories: Pick<Category, 'id' | 'name' | 'slug'>[];
  collections?: Pick<Collection, 'id' | 'name' | 'slug'>[];
  tags?: string[];
  fabricDetails?: string;
  careInstructions?: string;
  sustainabilityMetrics?: string;
  fitGuide?: string;
  sku?: string; // Base SKU if no variants
  stock?: number; // Base stock if no variants
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  availablePrintDesigns?: PrintDesign[];
  customizationConfig?: ProductCustomizationConfig;
  reviews?: Review[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CartItemCustomization {
  type: 'predefined' | 'custom';
  predefinedDesign?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  customDescription?: string;
  instructions?: string;
}

export interface CartItem {
  id: string; // Unique ID for this cart line item (e.g., productId-variantId-timestampIfCustomized)
  productId: string;
  variantId?: string;
  name: string;
  price: number; // Price at the time of adding to cart
  costPrice?: number; // Cost price at the time of adding to cart
  quantity: number;
  imageUrl?: string;
  dataAiHint?: string;
  customization?: CartItemCustomization;
}

export interface OrderAddress {
  street: string;
  city: string;
  state?: string; // For countries that use states
  postalCode: string;
  country: string;
  fullName: string;
  phone?: string;
  apartmentSuite?: string;
}

export const ALL_ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'] as const;
export type OrderStatus = typeof ALL_ORDER_STATUSES[number];

export const ALL_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;
export type PaymentStatus = typeof ALL_PAYMENT_STATUSES[number];


export interface Order {
  id: string; // UUID from Supabase
  userId: string; // Firebase UID
  items: CartItem[]; // Stored as JSONB in Supabase
  totalAmount: number;
  currency: string; // e.g., "NPR"
  status: OrderStatus;
  shippingAddress: OrderAddress; // Stored as JSONB
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
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
  label?: string;
  children?: NavItem[];
  authRequired?: boolean;
  rolesRequired?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface StoryContentBlock {
  type: 'text' | 'image' | 'video' | 'quote';
  content: string;
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

export interface CartContextType {
  cartItems: CartItem[];
  cartItemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity: number, selectedVariant?: ProductVariant, customization?: CartItemCustomization) => void;
  removeFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  isCartLoading: boolean;
}

export interface ReviewImage {
  id: string;
  url: string;
  altText?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string; 
  userName: string;
  userAvatarUrl?: string;
  rating: number; 
  title?: string;
  comment: string;
  images?: ReviewImage[]; 
  verifiedPurchase?: boolean;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface HeroSlide {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoId?: string;
  altText?: string;
  dataAiHint?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface SocialCommerceItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText?: string;
  dataAiHint?: string;
}

export interface HomepageContent {
  heroSlides?: HeroSlide[];
  artisanalRoots?: {
    title: string;
    description: string;
  };
  socialCommerceItems?: SocialCommerceItem[];
  // Removed heroVideoId and heroImageUrl as they are now part of heroSlides
}


// For user posts
export interface UserPost {
  id: string; // uuid from Supabase
  user_id: string; // Firebase UID, links to User.id
  user_name?: string; // Denormalized for easier display
  user_avatar_url?: string; // Denormalized
  image_url: string;
  caption?: string;
  product_tags?: string[]; // Array of product names/slugs
  status: 'pending' | 'approved' | 'rejected';
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
