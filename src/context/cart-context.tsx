
"use client";

import type { Product, ProductVariant, CartItem, CartContextType } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'peakPulseCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true); // To handle initial load from localStorage
  const { toast } = useToast();

  // Load cart from localStorage on initial mount
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isCartLoading) { 
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [cartItems, isCartLoading]);

  const addToCart = useCallback((product: Product, quantity: number, selectedVariant?: ProductVariant) => {
    setCartItems(prevItems => {
      const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
      const existingItem = prevItems.find(item => item.id === cartItemId);

      const itemPrice = selectedVariant?.price || product.price;
      const itemName = selectedVariant ? `${product.name} (${selectedVariant.value})` : product.name;
      const itemImage = selectedVariant?.imageId
        ? product.images.find(img => img.id === selectedVariant.imageId)?.url
        : product.images[0]?.url;

      if (existingItem) {
        return prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: cartItemId,
            productId: product.id,
            variantId: selectedVariant?.id,
            name: itemName,
            price: itemPrice,
            quantity: quantity,
            imageUrl: itemImage || 'https://placehold.co/100x120.png',
            dataAiHint: product.images[0]?.dataAiHint || 'product fashion',
          },
        ];
      }
    });
    toast({
      title: "Added to Cart!",
      description: `${quantity} x ${selectedVariant ? `${product.name} (${selectedVariant.value})` : product.name}`,
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
      removeFromCart(itemId); // removeFromCart is already memoized and will call setCartItems
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [setCartItems, removeFromCart]); // Ensure removeFromCart is stable or included

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
