
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string; // Firebase displayName
  avatarUrl?: string; // Firebase photoURL or from Supabase
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
  parentId?: string | null;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isPrivate?: boolean;
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
  sku?: string;
  price: number; // Variant specific price, overrides base product price
  costPrice?: number | null;
  stock: number;
  imageId?: string; // Optional: ID of an image from product.images to show for this variant
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

// Represents a review image uploaded by a user
export interface ReviewImageItem {
  id: string; // Could be a generated ID or filename
  url: string;
  altText?: string; // Optional alt text provided by user
}

// Represents a product review
export interface Review {
  id: string; // UUID from Supabase
  product_id: string; // Foreign key to products table
  product_name?: string; // Joined from products table for display
  user_id: string; // Firebase UID, foreign key to users table
  user_name?: string; // Joined from users table for display
  user_avatar_url?: string; // Joined from users table for display
  rating: number; // 1-5
  title?: string;
  comment: string;
  images?: ReviewImageItem[]; // Array of image objects (JSONB in Supabase)
  status: 'pending' | 'approved' | 'rejected';
  verified_purchase?: boolean;
  createdAt: string; // ISO string (timestamptz)
  updatedAt: string; // ISO string (timestamptz)
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
  stock?: number | null; // Base stock if no variants, otherwise sum of variant stocks
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  availablePrintDesigns?: PrintDesign[];
  customizationConfig?: ProductCustomizationConfig;
  reviews?: Review[]; // For frontend display, fetched separately
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
  id: string; // Unique ID for the cart item (product.id + variant.id + customizationHash)
  productId: string;
  slug?: string;
  variantId?: string;
  name: string;
  price: number;
  costPrice?: number | null; // Store cost at time of adding to cart
  quantity: number;
  imageUrl?: string;
  dataAiHint?: string;
  customization?: CartItemCustomization;
}

export interface OrderAddress {
  street: string;
  city: string;
  state?: string; // Or region/province
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
  id: string; // Supabase UUID
  userId: string; // Firebase UID, TEXT in Supabase users table
  items: CartItem[]; // Stored as JSONB, each item should include its costPrice at time of sale
  totalAmount: number; // Numeric
  currency: string; // Text
  status: OrderStatus; // Text
  shippingAddress: OrderAddress; // Stored as JSONB
  paymentMethod?: string; // Text
  paymentStatus: PaymentStatus; // Text
  shippingMethod?: string; // Text
  trackingNumber?: string; // Text
  createdAt: string; // Timestamptz
  updatedAt: string; // Timestamptz
}

export interface Loan {
  id: string; // Supabase UUID
  loan_name: string;
  lender_name: string;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  start_date: string; // YYYY-MM-DD
  status: string; // e.g., 'Active', 'Paid Off', 'Pending', 'Defaulted', 'Restructured'
  notes?: string;
  createdAt?: string; // ISO string from Supabase
  updatedAt?: string; // ISO string from Supabase
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
  heroVideoId?: string; // Standalone fallback
  heroImageUrl?: string; // Standalone fallback
  artisanalRoots?: {
    title: string;
    description: string;
  };
  socialCommerceItems?: SocialCommerceItem[];
  error?: string; // For client-side error reporting if API fails
}

export interface OurStorySection {
  title?: string;
  description?: string; // For Hero, Join Journey
  paragraph1?: string; // For Mission, Craftsmanship
  paragraph2?: string; // For Mission, Craftsmanship
  imageUrl?: string;
  imageAltText?: string;
  imageAiHint?: string;
}

export interface OurStoryContentData {
  hero?: OurStorySection;
  mission?: OurStorySection;
  craftsmanship?: OurStorySection;
  valuesSection?: OurStorySection; // Might just be a title for a list of values
  joinJourneySection?: OurStorySection;
  error?: string; // For client-side error reporting if API fails
}


export interface UserPost {
  id: string; // Supabase UUID
  user_id: string; // Firebase UID (TEXT in Supabase)
  user_name?: string; // Joined from users table
  user_avatar_url?: string; // Joined from users table
  image_url: string;
  caption?: string;
  product_tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string; // Timestamptz
  updated_at: string; // Timestamptz
}

export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
}

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

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: string;
  socialLinks?: SocialLink[]; // Managed via footerContent now, but type retained for consistency
}

export interface PageContent { // For generic static pages like Privacy Policy, Terms, etc.
  content: string;
  error?: string; // For client-side error reporting
}

export interface FilterOptionValue {
  value: string;
  label: string;
  color?: string; // For color swatches
}

export interface FilterOption {
  id: string; // e.g., 'category', 'size', 'color', 'price'
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'color';
  options?: FilterOptionValue[]; // For checkbox, radio, color
  min?: number; // For range
  max?: number; // For range
  step?: number; // For range
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

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

// New Types for Design Collaborations
export interface DesignCollaborationCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  ai_image_prompt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryImageItem {
  id: string; // Can be a temporary client-side ID or a persistent one if stored separately
  url: string;
  altText?: string;
  dataAiHint?: string;
  displayOrder?: number;
}

export interface DesignCollaborationGallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category_id?: string | null;
  category_name?: string; // For display, joined in API
  cover_image_url?: string;
  ai_cover_image_prompt?: string;
  artist_name?: string;
  artist_statement?: string;
  gallery_images?: GalleryImageItem[]; // Stored as JSONB
  is_published?: boolean;
  collaboration_date?: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintOnDemandDesign {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image_url: string;
  ai_image_prompt?: string;
  price: number;
  is_for_sale?: boolean;
  sku?: string;
  collaboration_id?: string | null; // Optional link to a DesignCollaborationGallery
  collaboration_title?: string; // For display
  createdAt?: string;
  updatedAt?: string;
}

    