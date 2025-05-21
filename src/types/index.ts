
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string; // Firebase displayName
  avatarUrl?: string; // Firebase photoURL
  roles: string[]; // e.g., ['customer', 'vip', 'affiliate', 'admin']
  wishlist?: string[]; // Array of product IDs
}

export interface AdminCategory {
  id: string; // uuid from Supabase
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  aiImagePrompt?: string;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
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
  costPrice?: number | null; // Cost of goods for this variant
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
  compareAtPrice?: number | null;
  costPrice?: number | null;
  images: ProductImage[];
  variants?: ProductVariant[];
  categories: Pick<AdminCategory, 'id' | 'name' | 'slug'>[];
  collections?: Pick<Collection, 'id' | 'name' | 'slug'>[];
  tags?: string[];
  fabricDetails?: string;
  careInstructions?: string;
  sustainabilityMetrics?: string;
  fitGuide?: string;
  sku?: string;
  stock?: number | null;
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
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  costPrice?: number | null;
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
  apartmentSuite?: string;
}

export const ALL_ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'] as const;
export type OrderStatus = typeof ALL_ORDER_STATUSES[number];

export const ALL_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;
export type PaymentStatus = typeof ALL_PAYMENT_STATUSES[number];


export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: OrderAddress;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  loan_name: string;
  lender_name: string;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  start_date: string; // YYYY-MM-DD
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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

export interface HeroSlide {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // Optional: use if no videoId
  videoId?: string;   // Optional: YouTube video ID
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
  heroVideoId?: string; // Fallback if no slides, or default video for slides without one
  heroImageUrl?: string; // Fallback if no videoId on slides or standalone hero
  artisanalRoots?: {
    title: string;
    description: string;
  };
  socialCommerceItems?: SocialCommerceItem[];
  error?: string; // For API error handling on client
}

export interface OurStoryContentData {
  hero: {
    title: string;
    description: string;
  };
  mission: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  craftsmanship: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  valuesSection: {
    title: string;
  };
  joinJourneySection: {
    title: string;
    description: string;
  };
  error?: string; // For API error handling
}

export interface UserPost {
  id: string;
  user_id: string;
  user_name?: string;
  user_avatar_url?: string;
  image_url: string;
  caption?: string;
  product_tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id?: string; 
  platform: string;
  url: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: string;
  socialLinks?: SocialLink[]; // Managed via FooterContent now
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
  createdAt: string;
  updatedAt?: string;
}

// Footer Content Types
export interface FooterNavItem {
  id: string; 
  name: string;
  href: string;
}

export interface FooterNavSection {
  id: string; 
  label: string;
  items: FooterNavItem[];
}

export interface FooterContentData {
  copyrightText?: string;
  navigationSections?: FooterNavSection[];
}

// Generic Page Content Type (for Privacy, Terms, etc.)
export interface PageContent {
  content: string; 
  error?: string; 
}

// Filter types for products page
export interface FilterOptionValue {
  value: string;
  label: string;
  color?: string; // For color swatches
}

export interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'color';
  options?: FilterOptionValue[];
  // For range type
  min?: number;
  max?: number;
  step?: number;
}
