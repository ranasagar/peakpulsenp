
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string; // Firebase displayName
  avatarUrl?: string; // Firebase photoURL or from Supabase
  roles: string[]; // e.g., ['customer', 'vip', 'affiliate', 'admin']
  wishlist?: string[]; // Array of product IDs
  bookmarked_post_ids?: string[]; // Array of post IDs
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  bio?: string;
}

export interface AdminCategory {
  id: string; // uuid from Supabase
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  aiImagePrompt?: string;
  parentId?: string | null;
  displayOrder?: number;
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

export interface ReviewImageItem {
  id: string;
  url: string;
  altText?: string;
}

export interface Review {
  id: string;
  product_id: string;
  product_name?: string;
  user_id: string;
  user_name?: string;
  user_avatar_url?: string;
  rating: number;
  title?: string | null;
  comment: string;
  images?: ReviewImageItem[] | null;
  status: 'pending' | 'approved' | 'rejected';
  verified_purchase?: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  slug?: string;
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
  start_date: string;
  status: string;
  notes?: string;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
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
  videoAutoplay?: boolean; // Added this line
  audioUrl?: string;
  altText?: string;
  dataAiHint?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  ctaButtonCustomBgColor?: string;
  ctaButtonCustomTextColor?: string;
  ctaButtonClassName?: string;
  duration?: number;
  displayOrder?: number;
  filterOverlay?: string;
  youtubeAuthorName?: string;
  youtubeAuthorLink?: string;
  _isPromo?: boolean; 
  _backgroundColor?: string; 
  _textColor?: string; 
}

export interface SocialCommerceItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText?: string;
  dataAiHint?: string;
  displayOrder?: number;
}

export interface ArtisanalRootsSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  dataAiHint?: string;
}

export interface HomepageContent {
  heroSlides?: HeroSlide[];
  heroVideoId?: string; 
  heroImageUrl?: string; 
  artisanalRoots?: {
    title: string;
    description: string;
    slides?: ArtisanalRootsSlide[];
  };
  socialCommerceItems?: SocialCommerceItem[];
  promotionalPostsSection?: {
    enabled?: boolean;
    title?: string;
    maxItems?: number;
    autoplay?: boolean; // Added
    delay?: number; // Added
    showArrows?: boolean; // Added
    showDots?: boolean; // Added
  };
  error?: string; 
}

export interface OurStorySection {
  title?: string;
  description?: string;
  paragraph1?: string;
  paragraph2?: string;
  imageUrl?: string;
  imageAltText?: string;
  imageAiHint?: string;
  instagramUsername?: string;
  facebookUsername?: string;
  twitterUsername?: string;
}

export interface OurStoryContentData {
  hero?: OurStorySection;
  mission?: OurStorySection;
  craftsmanship?: OurStorySection;
  valuesSection?: OurStorySection;
  joinJourneySection?: OurStorySection;
  error?: string;
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
  socialLinks?: SocialLink[];
  showExternalLinkWarning?: boolean;
  whatsappNumber?: string;
  instagramUsername?: string;
  facebookUsernameOrPageId?: string;
  headerLogoUrl?: string;
  headerSiteTitle?: string;
  heroVideoAutoplay?: boolean; // Global hero autoplay setting
}

export interface PageContent {
  content: string;
  error?: string; 
}

export interface FilterOptionValue {
  value: string;
  label: string;
  color?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'color';
  options?: FilterOptionValue[];
  min?: number;
  max?: number;
  step?: number;
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
  id: string;
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
  category_name?: string;
  category_slug?: string;
  cover_image_url?: string;
  ai_cover_image_prompt?: string;
  artist_name?: string;
  artist_statement?: string;
  gallery_images?: GalleryImageItem[];
  is_published?: boolean;
  collaboration_date?: string;
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
  collaboration_id?: string | null;
  collaboration_title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollaborationApplication {
  id?: string;
  user_id?: string | null;
  name: string;
  email: string;
  portfolio_link?: string | null;
  concept_description: string;
  collaboration_category_id?: string | null;
  status?: 'pending' | 'reviewed' | 'contacted' | 'approved' | 'rejected';
  admin_notes?: string | null;
  submitted_at?: string;
  updated_at?: string;
}

export interface PromotionalPost {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl: string;
  imageAltText?: string;
  dataAiHint?: string;
  ctaText?: string;
  ctaLink?: string;
  price?: number;
  discountPrice?: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  displayOrder?: number;
  backgroundColor?: string;
  textColor?: string;
  createdAt?: string;
  updatedAt?: string;
  sku?: string;
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
  like_count?: number;
  liked_by_user_ids?: string[];
  comment_count?: number;
  comments?: PostComment[];
  created_at: string;
  updated_at: string;
}

export interface StoryContentPiece {
  id: string;
  title: string;
  slug: string;
  content_html?: string;
  cover_image_url?: string;
  ai_cover_image_hint?: string;
  author_name?: string;
  is_published?: boolean;
  published_at?: string; // ISO string
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name?: string;
  user_avatar_url?: string;
  comment_text: string;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Notification System Types ---
export interface NotificationDataNewMessage {
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  messageSnippet: string;
  conversationId: string;
}
export interface NotificationDataOrderUpdate {
  orderId: string;
  newStatus: OrderStatus | PaymentStatus;
  productName?: string;
}
// Add more specific data types for other notifications as needed
// e.g., NewFollower, LikedPost, NewProductDrop, etc.
export type NotificationData = NotificationDataNewMessage | NotificationDataOrderUpdate | { [key: string]: any };
export const NotificationType = {
  NEW_MESSAGE: 'new_message',
  ORDER_UPDATE: 'order_update',
  // Add more types here
  // e.g., NEW_FOLLOWER: 'new_follower',
  // LIKED_POST: 'liked_post',
} as const;
export type NotificationTypeValues = typeof NotificationType[keyof typeof NotificationType];

export interface Notification {
  id: string; // UUID
  user_id: string; // Recipient User ID
  type: NotificationTypeValues; // Type of notification
  data: NotificationData; // JSONB data specific to the notification type
  link?: string; // Optional link for navigation (e.g., to order, to message)
  is_read: boolean;
  created_at: string; // ISO timestamp
}
// --- End Notification System Types ---

// Generic Metadata type, can be expanded
export interface Metadata {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  openGraph?: OpenGraph;
  twitter?: Twitter;
  robots?: Robots;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  // Add any other common meta tags you use
}

interface OpenGraph {
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  images?: OpenGraphImage[];
  type?: 'website' | 'article' | 'product';
  // For articles
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  // For products
  // 'product:brand'?: string;
  // 'product:availability'?: string;
  // 'product:condition'?: string;
  // 'product:price:amount'?: string;
  // 'product:price:currency'?: string;
}

interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface Twitter {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string; // @site
  creator?: string; // @creator
  title?: string;
  description?: string;
  images?: string[]; // Array of image URLs
}

interface Robots {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  googleBot?: Record<string, any>; // For more specific Googlebot directives
}

export interface PaymentGatewaySetting {
  gateway_key: string; // e.g., 'esewa_wallet', 'stripe_international'
  display_name: string;
  description?: string;
  icon_name?: string; // For mapping to Lucide icon name
  is_enabled: boolean;
  is_domestic_only?: boolean;
  is_international_only?: boolean;
  credentials_config?: Record<string, any>; // Placeholder for API keys, secrets, etc.
  environment?: 'test' | 'production';
  notes?: string;
  display_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

```