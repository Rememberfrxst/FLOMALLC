import { useStorefront } from "@/hooks/useStorefront";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Order, Product } from "@/constants/data";
import { DEMO_OFFERS } from "@/constants/demoCatalog";
import { api, ApiCartItem, getAccessToken, mapApiProduct } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  product: Product;
  quantity: number;
  cartItemId?: string;
  variantId?: string;
  variantLabel?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    options?: { variantId?: string; variantLabel?: string; quantity?: number },
  ) => Promise<void>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  coupon: string;
  couponDiscount: number;
  applyCoupon: (
    code: string,
  ) =>
    Promise<"valid" | "invalid" | "already"> | "valid" | "invalid" | "already";
  removeCoupon: () => void;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  orders: Order[];
  placeOrder: (
    paymentMethod: Order["paymentMethod"],
    address: Order["address"],
  ) => Promise<Order> | Order;
}

export const cartItemKey = (item: CartItem) =>
  item.cartItemId || `${item.product.id}:${item.variantId || ""}`;
function mapCartItem(item: ApiCartItem): CartItem & { cartItemId: string } {
  const product = mapApiProduct(item.product),
    modifier = Number(item.variant?.priceModifier || 0);
  return {
    cartItemId: item.id,
    variantId: item.variantId || undefined,
    variantLabel: item.variant
      ? `${item.variant.name}: ${item.variant.value}`
      : undefined,
    product: {
      ...product,
      price: product.price + modifier,
      originalPrice: product.originalPrice + modifier,
      stock: item.variant?.stock ?? product.stock,
    },
    quantity: item.quantity,
  };
}

export function mapApiOrder(o: any): Order {
  return {
    id: o.id,
    items: (o.items ?? []).map((i: any) => ({
      productId: i.productId,
      name: i.product?.name ?? "",
      price: parseFloat(i.unitPrice) || 0,
      quantity: i.quantity,
      image: i.product?.images?.[0]?.url ?? "",
    })),
    total: parseFloat(o.total) || 0,
    status: o.status,
    date: o.createdAt,
    estimatedDelivery: o.estimatedDelivery ?? "",
    paymentMethod: o.paymentMethod as any,
    address: o.address
      ? {
          id: o.address.id,
          name: "",
          line1: o.address.line1,
          city: o.address.city,
          state: o.address.state,
          pincode: o.address.pincode,
          phone: "",
          isDefault: false,
        }
      : {
          id: "",
          name: "",
          line1: "",
          city: "",
          state: "",
          pincode: "",
          phone: "",
          isDefault: false,
        },
  };
}

const CartContext = createContext<CartContextType | null>(null);
const CART_KEY = "@griper_cart";
const ORDERS_KEY = "@griper_orders";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const store = useStorefront();
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = user ? await getAccessToken() : null;
        if (user && token) {
          try {
            const guestData = await AsyncStorage.getItem(CART_KEY);
            if (guestData) {
              const guestItems = JSON.parse(guestData) as CartItem[];
              const remaining: CartItem[] = [];
              for (const item of guestItems) {
                try {
                  await api.cart.add(
                    item.product.id,
                    item.quantity,
                    item.variantId,
                  );
                } catch {
                  remaining.push(item);
                }
              }
              if (remaining.length)
                await AsyncStorage.setItem(CART_KEY, JSON.stringify(remaining));
              else await AsyncStorage.removeItem(CART_KEY);
            }
            const apiCart = await api.cart.get();
            if (apiCart && apiCart.items) {
              setItems(apiCart.items.map(mapCartItem));
              if ((apiCart as any).couponCode) {
                setCoupon((apiCart as any).couponCode);
                setCouponDiscount(0);
              }
            } else {
              setItems([]);
            }
            const apiOrders = await api.orders.list();
            setOrders(apiOrders.map(mapApiOrder));
            return;
          } catch {
            // Fall through to local AsyncStorage cache when offline
          }
        }
        const cartData = await AsyncStorage.getItem(CART_KEY);
        setItems(cartData ? (JSON.parse(cartData) as CartItem[]) : []);
        const ordersData = await AsyncStorage.getItem(ORDERS_KEY);
        setOrders(ordersData ? (JSON.parse(ordersData) as Order[]) : []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user]);

  const saveCart = async (newItems: CartItem[]) => {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
  };

  const saveOrders = async (newOrders: Order[]) => {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
  };

  const loadCartFromApi = async () => {
    try {
      const apiCart = await api.cart.get();
      if (apiCart && apiCart.items) {
        setItems(apiCart.items.map(mapCartItem));
      }
    } catch {}
  };

  const addItem = useCallback(
    async (
      product: Product,
      options?: {
        variantId?: string;
        variantLabel?: string;
        quantity?: number;
      },
    ) => {
      const quantity = options?.quantity || 1;
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > product.stock
      )
        throw new Error("The requested quantity is unavailable");
      const token = user ? await getAccessToken() : null;
      if (user && token) {
        try {
          await api.cart.add(product.id, quantity, options?.variantId);
          const result = await api.cart.get();
          setItems(result.items.map(mapCartItem));
          return;
        } catch (err: any) {
          const msg = err?.message || "";
          if (msg.startsWith("API Error 400") || /stock|quantity|available/i.test(msg)) {
            throw err;
          }
          // Offline/local fallback below
        }
      }
      const key = `${product.id}:${options?.variantId || ""}`;
      const previous = items.find((i) => cartItemKey(i) === key);
      if ((previous?.quantity || 0) + quantity > product.stock)
        throw new Error("There are no more units available");
      setItems((prev) => {
        const existing = prev.find((i) => cartItemKey(i) === key);
        if ((existing?.quantity || 0) + quantity > product.stock) return prev;
        const updated = existing
          ? prev.map((i) =>
              cartItemKey(i) === key
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            )
          : [
              ...prev,
              {
                product,
                quantity,
                variantId: options?.variantId,
                variantLabel: options?.variantLabel,
              },
            ];
        void saveCart(updated);
        return updated;
      });
    },
    [user, items],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const current = items.find(
        (i) =>
          cartItemKey(i) === productId ||
          (!i.variantId && i.product.id === productId),
      );
      const token = user ? await getAccessToken() : null;
      if (user && token && current?.cartItemId) {
        try {
          await api.cart.remove(current.cartItemId);
          await loadCartFromApi();
          return;
        } catch (e) {
          console.error("Could not remove item from server, updating locally", e);
        }
      }
      const updated = items.filter(
        (i) =>
          cartItemKey(i) !== productId &&
          (i.variantId || i.product.id !== productId),
      );
      setItems(updated);
      await saveCart(updated);
    },
    [user, items],
  );
  const updateQuantity = useCallback(
    async (productId: string, qty: number) => {
      if (qty < 1) {
        await removeItem(productId);
        return;
      }
      const current = items.find(
        (i) =>
          cartItemKey(i) === productId ||
          (!i.variantId && i.product.id === productId),
      );
      if (!current || qty > current.product.stock) return;
      const token = user ? await getAccessToken() : null;
      if (user && token && current.cartItemId) {
        try {
          await api.cart.update(current.cartItemId, qty);
          await loadCartFromApi();
          return;
        } catch (e) {
          console.error("Could not change quantity on server, updating locally", e);
        }
      }
      const updated = items.map((i) =>
        cartItemKey(i) === productId ||
        (!i.variantId && i.product.id === productId)
          ? { ...i, quantity: qty }
          : i,
      );
      setItems(updated);
      await saveCart(updated);
    },
    [user, items, removeItem],
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    setCoupon("");
    setCouponDiscount(0);
    await AsyncStorage.removeItem(CART_KEY).catch(() => {});
    const token = user ? await getAccessToken() : null;
    if (user && token) {
      try {
        await api.cart.clear();
      } catch (err) {
        console.error(err);
      }
    }
  }, [user]);

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );

  const applyDemoCoupon = useCallback(
    (rawCode: string): number | null => {
      const normalized = rawCode.trim().toUpperCase();
      const offer = DEMO_OFFERS.find((o) => o.code === normalized);
      if (!offer) return null;
      const minOrder = Number(offer.minOrderValue ?? 0);
      if (subtotal < minOrder) return null;
      const rawDiscount =
        offer.discountType === "percentage"
          ? Math.round((subtotal * Number(offer.discountValue)) / 100)
          : Number(offer.discountValue);
      const maxCap = offer.maxDiscount ? Number(offer.maxDiscount) : Infinity;
      return Math.max(0, Math.min(rawDiscount, maxCap));
    },
    [subtotal],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      if (coupon) return "already" as const;
      const normalized = code.trim().toUpperCase();
      if (!normalized) return "invalid" as const;
      const token = user ? await getAccessToken() : null;
      if (user && token) {
        try {
          const result = await api.cart.applyCoupon(normalized);
          setCoupon(result.code);
          setCouponDiscount(result.discount);
          return "valid" as const;
        } catch {
          // Fall through to demo coupon check if offline
        }
      }
      const fallbackDiscount = applyDemoCoupon(normalized);
      if (fallbackDiscount !== null) {
        setCoupon(normalized);
        setCouponDiscount(fallbackDiscount);
        return "valid" as const;
      }
      return "invalid" as const;
    },
    [coupon, user, applyDemoCoupon],
  );

  const removeCoupon = useCallback(() => {
    setCoupon("");
    setCouponDiscount(0);
  }, []);

  const deliveryFee =
    subtotal === 0 || subtotal >= store.freeShippingThreshold
      ? 0
      : store.deliveryFee;
  const discountAmount = Math.min(subtotal, couponDiscount);
  const total = subtotal + deliveryFee - discountAmount;
  useEffect(() => {
    if (!coupon) return;
    let active = true;
    getAccessToken()
      .then((token) => {
        if (user && token) {
          return api.cart
            .applyCoupon(coupon)
            .then((r) => {
              if (active) setCouponDiscount(r.discount);
            })
            .catch(() => {
              if (active) {
                const d = applyDemoCoupon(coupon);
                if (d !== null) setCouponDiscount(d);
                else {
                  setCoupon("");
                  setCouponDiscount(0);
                }
              }
            });
        }
        const d = applyDemoCoupon(coupon);
        if (active) {
          if (d !== null) setCouponDiscount(d);
          else {
            setCoupon("");
            setCouponDiscount(0);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [coupon, subtotal, user, applyDemoCoupon]);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const placeOrder = useCallback(
    async (
      paymentMethod: Order["paymentMethod"],
      address: Order["address"],
    ) => {
      if (!user) {
        throw new Error("Please sign in to place an order");
      }
      const token = await getAccessToken();
      if (token) {
        try {
          const res = await api.orders.place(
            address.id,
            paymentMethod,
            coupon || undefined,
          );
          const newOrder = mapApiOrder(res);
          setOrders((prev) => [newOrder, ...prev]);
          await clearCart();
          return newOrder;
        } catch (err: any) {
          if (/address|stock|empty|coupon|invalid/i.test(err?.message || "")) {
            throw err;
          }
        }
      }
      const localOrder: Order = {
        id: `FL-${Date.now().toString().slice(-6)}`,
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.image,
        })),
        total,
        status: "confirmed",
        date: new Date().toISOString(),
        estimatedDelivery: new Date(
          Date.now() + 4 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        paymentMethod,
        address,
      };
      const updatedOrders = [localOrder, ...orders];
      setOrders(updatedOrders);
      await saveOrders(updatedOrders);
      await clearCart();
      return localOrder;
    },
    [items, total, clearCart, user, coupon, orders],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        coupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        subtotal,
        deliveryFee,
        discountAmount,
        total,
        itemCount,
        orders,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
