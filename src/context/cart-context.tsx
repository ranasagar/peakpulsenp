
"use client";

import type { Product, ProductVariant, CartItem, CartContextType, CartItemCustomization } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'peakPulseCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsCartLoading(true);
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    setIsCartLoading(false);
  }, []);

  useEffect(() => {
    if (!isCartLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [cartItems, isCartLoading]);

  const addToCart = useCallback((
    product: Product,
    quantity: number,
    selectedVariant?: ProductVariant,
    customization?: CartItemCustomization
  ) => {
    setCartItems(prevItems => {
      const baseItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
      // If customization is present, always treat as a new item by adding a timestamp for uniqueness.
      // If no customization, try to find an existing item to increment quantity.
      const cartItemId = customization
        ? `${baseItemId}-custom-${Date.now()}`
        : baseItemId;

      const existingItemIndex = customization
        ? -1 // Customized items are always new line items
        : prevItems.findIndex(item => item.id === cartItemId && !item.customization); // Only merge if existing is not customized

      const itemPrice = selectedVariant?.price ?? product.price;
      const itemCostPrice = selectedVariant?.costPrice ?? product.costPrice;
      const itemName = selectedVariant ? `${product.name} (${selectedVariant.value})` : product.name;
      const itemImage = selectedVariant?.imageId
        ? product.images.find(img => img.id === selectedVariant.imageId)?.url
        : product.images[0]?.url;

      if (existingItemIndex > -1) { // Item exists and neither new nor existing has customization
        return prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else { // New item or customized item
        return [
          ...prevItems,
          {
            id: cartItemId, // This ID will be unique for unique combinations
            productId: product.id,
            slug: product.slug, // Store slug for linking
            variantId: selectedVariant?.id,
            name: itemName,
            price: itemPrice,
            costPrice: itemCostPrice,
            quantity: quantity,
            imageUrl: itemImage || 'https://placehold.co/100x120.png',
            dataAiHint: product.images[0]?.dataAiHint || 'product fashion',
            customization: customization,
          },
        ];
      }
    });
    toast({
      title: "Added to Cart!",
      description: `${quantity} x ${selectedVariant ? `${product.name} (${selectedVariant.value})` : product.name}${customization ? ' (Customized)' : ''}`,
    });
  }, [setCartItems, toast]);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "The item has been removed from your cart.",
    });
  }, [setCartItems, toast]);

  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [setCartItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, [setCartItems]);

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartItemCount,
        subtotal,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        clearCart,
        isCartLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
