
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string; // Firebase displayName
  avatarUrl?: string; // Firebase photoURL
  roles: string[]; // e.g., ['customer', 'vip', 'affiliate', 'admin'] - needs separate logic to populate
  wishlist?: string[]; // Array of product IDs
  orders?: string[]; // Array of order IDs
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
  sku: string;
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
  sku?: string;
  stock?: number;
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  availablePrintDesigns?: PrintDesign[];
  customizationConfig?: ProductCustomizationConfig;
  reviews?: Review[]; // Added for product reviews
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
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  dataAiHint?: string;
  customization?: CartItemCustomization;
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

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
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
  userId: string; // ID of the user who wrote the review
  userName: string;
  userAvatarUrl?: string;
  rating: number; // 1-5 stars
  title?: string;
  comment: string;
  images?: ReviewImage[]; // User-uploaded images for the review
  verifiedPurchase?: boolean;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// For Homepage Content Management
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
  socialCommerceItems?: SocialCommerceItem[]; // Added for Instagram grid
}
