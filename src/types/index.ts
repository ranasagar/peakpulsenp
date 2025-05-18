
import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string; // Firebase UID
  email: string;
  name?: string; // Firebase displayName
  avatarUrl?: string; // Firebase photoURL
  roles: string[]; // e.g., ['customer', 'vip', 'affiliate', 'admin'] - needs separate logic to populate
  // E-commerce specific fields (would be stored in Firestore/RTDB, not directly on Firebase Auth user)
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
  id: string; // Typically productId or variantId. For products with variants, this should be unique per variant (e.g., `${productId}-${variantId}`)
  productId: string;
  variantId?: string; // Identifier for the specific variant (e.g., size, color)
  name: string; // Product name, potentially with variant info (e.g., "Himalayan Breeze Jacket (M, Blue)")
  price: number; // Price of this specific item/variant
  quantity: number;
  imageUrl?: string; // Image for this item/variant
  dataAiHint?: string; // For placeholder image hints
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
  userId: string; // ID of the user who placed the order
  items: CartItem[]; // Array of items in the order
  totalAmount: number; // Total amount of the order
  currency: string; // e.g., 'NPR', 'USD'
  status: OrderStatus;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress; // Optional, if different from shipping
  paymentMethod?: string; // e.g., 'Credit Card', 'eSewa', 'COD'
  paymentStatus: PaymentStatus;
  shippingMethod?: string; // e.g., 'Standard Shipping', 'Express Shipping'
  trackingNumber?: string; // For shipped orders
  createdAt: string; // ISO string date when the order was created
  updatedAt: string; // ISO string date when the order was last updated
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

// Cart Context Types
export interface CartContextType {
  cartItems: CartItem[];
  cartItemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity: number, selectedVariant?: ProductVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  isCartLoading: boolean;
}
