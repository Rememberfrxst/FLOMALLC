import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Product } from '@/constants/data';
import { api, ApiWishlistItem, mapApiProduct } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface WishlistContextType {
  items: Product[];
  toggle: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);
const STORAGE_KEY = '@griper_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      api.wishlist.get()
        .then((data) => {
          setItems(data.map((item: ApiWishlistItem) => mapApiProduct(item.product)));
        })
        .catch(() => {
          AsyncStorage.getItem(STORAGE_KEY).then(data => {
            if (data) setItems(JSON.parse(data) as Product[]);
          }).catch(() => {});
        });
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then(data => {
        if (data) setItems(JSON.parse(data) as Product[]);
      }).catch(() => {});
    }
  }, [user]);

  const toggle = useCallback(async (product: Product) => {
    const exists = items.some(p => p.id === product.id);
    const updated = exists ? items.filter(p => p.id !== product.id) : [...items, product];
    setItems(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});

    if (user) {
      try {
        if (exists) {
          await api.wishlist.remove(product.id);
        } else {
          await api.wishlist.add(product.id);
        }
      } catch {
        // Keep optimistic local wishlist saved if offline
      }
    }
  }, [items, user]);

  const isInWishlist = useCallback((id: string) => items.some(p => p.id === id), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
