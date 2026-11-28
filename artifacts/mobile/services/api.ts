/**
 * Central API client for the Meta E-Commerce mobile app.
 * Handles base URL, JWT injection, token refresh on 401, and typed requests.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

function resolveDevHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    (
      Constants as {
        manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
      }
    ).manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost,
    (Constants as { expoGoConfig?: { hostUri?: string } }).expoGoConfig
      ?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = candidate?.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }

  return null;
}

/** Resolve API base URL for dev (LAN/emulator) and production. */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return stripTrailingSlash(envUrl);

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  const devHost = resolveDevHost();
  if (devHost) {
    return `http://${devHost}:${API_PORT}/api`;
  }

  // Android emulator: 10.0.2.2 maps to the host machine's localhost.
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  return `http://localhost:${API_PORT}/api`;
}

/** Quick connectivity check — useful for surfacing API errors in the UI. */
export async function checkApiConnection(): Promise<{
  ok: boolean;
  url: string;
  error?: string;
}> {
  const url = getApiBaseUrl();
  try {
    const res = await fetch(`${url}/healthz`, { method: "GET" });
    if (!res.ok) {
      return { ok: false, url, error: `Server responded with ${res.status}` };
    }
    return { ok: true, url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network request failed";
    return { ok: false, url, error: message };
  }
}

if (__DEV__) {
  console.log("[API] Using base URL:", getApiBaseUrl());
}

const TOKEN_KEY = "@griper_access_token";
const REFRESH_KEY = "@griper_refresh_token";

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        await AsyncStorage.setItem(REFRESH_KEY, data.refreshToken);
      }
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

import {
  DEMO_BANNERS,
  DEMO_CATEGORIES,
  DEMO_OFFERS,
  DEMO_PRODUCTS,
  DEMO_STOREFRONT,
  filterDemoProducts,
  getDemoProductById,
} from "@/constants/demoCatalog";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 7000,
): Promise<Response> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (init.signal?.aborted) cancel();
  else init.signal?.addEventListener("abort", cancel);
  const timer = setTimeout(cancel, timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", cancel);
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, timeoutMs = 7000 } = options;

  const buildHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (auth) {
      const token = await getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const doFetch = async (headers: Record<string, string>): Promise<Response> =>
    fetchWithTimeout(
      `${getApiBaseUrl()}${path}`,
      {
        method,
        signal: options.signal,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      timeoutMs,
    );

  let headers = await buildHeaders();
  let res = await doFetch(headers);

  // Attempt token refresh on 401
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await doFetch(headers);
    }
  }

  if (!res.ok) {
    let errorMessage = `API Error ${res.status}`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const errData = await res.json();
        errorMessage = errData.error ?? errData.message ?? errorMessage;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Server returned a non-JSON response");
  }

  return res.json() as Promise<T>;
}

// ─── Typed API helpers ──────────────────────────────────────────────────────

export const api = {
  // Storefront & Offers (with instant bundled demo fallback)
  storefront: {
    get: async () => {
      try {
        return await apiRequest<typeof DEMO_STOREFRONT>("/storefront", {
          auth: false,
        });
      } catch {
        return DEMO_STOREFRONT;
      }
    },
    offers: async () => {
      try {
        const list = await apiRequest<typeof DEMO_OFFERS>(
          "/storefront/offers",
          { auth: false },
        );
        return list.length > 0 ? list : DEMO_OFFERS;
      } catch {
        return DEMO_OFFERS;
      }
    },
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ user: ApiUser; accessToken: string; refreshToken: string }>(
        "/auth/login",
        { method: "POST", body: { email, password }, auth: false },
      ),
    register: (name: string, email: string, phone: string, password: string) =>
      apiRequest<{ user: ApiUser; accessToken: string; refreshToken: string }>(
        "/auth/register",
        { method: "POST", body: { name, email, phone, password }, auth: false },
      ),
    google: (payload: {
      idToken?: string;
      accessToken?: string;
      email?: string;
      name?: string;
      avatarUrl?: string;
    }) =>
      apiRequest<{ user: ApiUser; accessToken: string; refreshToken: string }>(
        "/auth/google",
        { method: "POST", body: payload, auth: false },
      ),
    me: () => apiRequest<ApiUser>("/auth/me"),
    updateProfile: (body: { name: string; phone?: string }) =>
      apiRequest<ApiUser>("/auth/profile", { method: "PATCH", body }),
    logout: () => apiRequest("/auth/logout", { method: "POST" }),
    refresh: (refreshToken: string) =>
      apiRequest<{ accessToken: string; refreshToken?: string }>(
        "/auth/refresh",
        { method: "POST", body: { refreshToken }, auth: false },
      ),
  },

  // Products
  products: {
    list: async (params?: Record<string, string | number | boolean>, signal?: AbortSignal) => {
      const qs = params
        ? "?" +
          new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== "" && v !== undefined && v !== null)
              .map(([k, v]) => [k, String(v)]),
          ).toString()
        : "";
      try {
        const res = await apiRequest<{
          data: ApiProduct[];
          total: number;
          page: number;
          limit: number;
        }>(`/products${qs}`, { auth: false, signal });
        if (
          res.data.length === 0 &&
          !params?.q &&
          !params?.minPrice &&
          !params?.maxPrice &&
          (!params?.page || Number(params.page) === 1)
        ) {
          return filterDemoProducts(params) as {
            data: ApiProduct[];
            total: number;
            page: number;
            limit: number;
          };
        }
        return res;
      } catch (error) {
        if (signal?.aborted) throw error;
        return filterDemoProducts(params) as {
          data: ApiProduct[];
          total: number;
          page: number;
          limit: number;
        };
      }
    },
    get: async (id: string) => {
      try {
        return await apiRequest<
          ApiProduct & {
            images: ApiProductImage[];
            variants: ApiProductVariant[];
          }
        >(`/products/${id}`, { auth: false });
      } catch {
        const fallback = getDemoProductById(id);
        if (fallback) {
          return fallback as unknown as ApiProduct & {
            images: ApiProductImage[];
            variants: ApiProductVariant[];
          };
        }
        throw new Error("Product not found");
      }
    },
    reviews: async (id: string) => {
      try {
        return await apiRequest<ApiReview[]>(`/products/${id}/reviews`, {
          auth: false,
        });
      } catch {
        return [];
      }
    },
    addReview: (
      id: string,
      body: { rating: number; title?: string; comment?: string },
    ) => apiRequest(`/products/${id}/reviews`, { method: "POST", body }),
  },

  // Categories
  categories: {
    list: async () => {
      try {
        const list = await apiRequest<ApiCategory[]>("/categories", {
          auth: false,
        });
        return list.length > 0 ? list : (DEMO_CATEGORIES as ApiCategory[]);
      } catch {
        return DEMO_CATEGORIES as ApiCategory[];
      }
    },
  },

  // Banners
  banners: {
    list: async () => {
      try {
        const list = await apiRequest<ApiBanner[]>("/banners", { auth: false });
        return list.length > 0 ? list : (DEMO_BANNERS as ApiBanner[]);
      } catch {
        return DEMO_BANNERS as ApiBanner[];
      }
    },
  },

  // Cart
  cart: {
    get: () => apiRequest<{ items: ApiCartItem[] }>("/cart"),
    add: (productId: string, quantity: number, variantId?: string) =>
      apiRequest("/cart", {
        method: "POST",
        body: { productId, quantity, variantId },
      }),
    update: (itemId: string, quantity: number) =>
      apiRequest(`/cart/${itemId}`, { method: "PATCH", body: { quantity } }),
    remove: (itemId: string) =>
      apiRequest(`/cart/${itemId}`, { method: "DELETE" }),
    clear: () => apiRequest("/cart", { method: "DELETE" }),
    applyCoupon: (code: string) =>
      apiRequest<{ discount: number; discountType: string; code: string }>(
        "/cart/apply-coupon",
        { method: "POST", body: { code } },
      ),
  },

  // Wishlist
  wishlist: {
    get: () => apiRequest<ApiWishlistItem[]>("/wishlist"),
    add: (productId: string) =>
      apiRequest("/wishlist", { method: "POST", body: { productId } }),
    remove: (productId: string) =>
      apiRequest(`/wishlist/${productId}`, { method: "DELETE" }),
  },

  // Addresses
  addresses: {
    list: () => apiRequest<ApiAddress[]>("/addresses"),
    add: (body: Omit<ApiAddress, "id" | "userId" | "createdAt">) =>
      apiRequest<ApiAddress>("/addresses", { method: "POST", body }),
    update: (id: string, body: Partial<ApiAddress>) =>
      apiRequest<ApiAddress>(`/addresses/${id}`, { method: "PUT", body }),
    delete: (id: string) =>
      apiRequest(`/addresses/${id}`, { method: "DELETE" }),
    setDefault: (id: string) =>
      apiRequest(`/addresses/${id}/default`, { method: "PATCH" }),
  },

  // Orders
  orders: {
    list: () => apiRequest<ApiOrder[]>("/orders"),
    get: (id: string) =>
      apiRequest<ApiOrder & { items: ApiOrderItem[] }>(`/orders/${id}`),
    place: (addressId: string, paymentMethod: string, couponCode?: string) =>
      apiRequest<ApiOrder>("/orders", {
        method: "POST",
        body: { addressId, paymentMethod, couponCode },
      }),
    cancel: (id: string) =>
      apiRequest(`/orders/${id}/cancel`, { method: "POST" }),
  },

  // Notifications
  notifications: {
    list: () => apiRequest<ApiNotification[]>("/notifications"),
    markRead: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
      apiRequest("/notifications/read-all", { method: "PATCH" }),
  },

  // Image Uploads (Presigned S3)
  uploads: {
    /**
     * Get presigned PUT URLs to upload images directly to S3.
     * The server never handles raw binary data.
     */
    presign: (
      files: { fileName: string; contentType: string; size: number }[],
      folder: "products" | "avatars" | "banners" = "products",
    ) =>
      apiRequest<{
        uploads: { presignedUrl: string; key: string; publicUrl: string }[];
      }>("/uploads/presign", { method: "POST", body: { files, folder } }),

    /** Upload file bytes directly to S3 using a presigned URL (no auth header needed). */
    putToS3: async (
      presignedUrl: string,
      file: Blob,
      contentType: string,
    ): Promise<void> => {
      const res = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
    },

    /** After S3 PUT succeeds, register the image in the DB. */
    confirmProductImage: (
      productId: string,
      key: string,
      altText?: string,
      isPrimary?: boolean,
    ) =>
      apiRequest("/uploads/confirm-product-image", {
        method: "POST",
        body: { productId, key, altText, isPrimary },
      }),

    /** Delete an image from both S3 and DB. */
    deleteProductImage: (imageId: string) =>
      apiRequest(`/uploads/product-image/${imageId}`, { method: "DELETE" }),

    /** Get a presigned URL to upload an avatar for the current user. */
    avatarPresign: (fileName: string, contentType: string, size: number) =>
      apiRequest<{ presignedUrl: string; key: string; publicUrl: string }>(
        "/uploads/avatar-presign",
        { method: "POST", body: { fileName, contentType, size } },
      ),

    /** After avatar S3 PUT succeeds, persist the new avatarUrl. */
    confirmAvatar: (key: string) =>
      apiRequest<{ avatarUrl: string }>("/uploads/confirm-avatar", {
        method: "POST",
        body: { key },
      }),
  },

  // Recommendations
  recommendations: {
    track: (action: string, productId?: string, searchQuery?: string) =>
      apiRequest("/recommendations/track", {
        method: "POST",
        body: { action, productId, searchQuery },
      }).catch(() => undefined),
    forYou: async () => {
      try {
        return await apiRequest<{ data: ApiProduct[] }>(
          "/recommendations/for-you",
        );
      } catch {
        return {
          data: DEMO_PRODUCTS.filter((p) => p.isFeatured) as unknown as ApiProduct[],
        };
      }
    },
    similar: async (productId: string) => {
      try {
        return await apiRequest<{ data: ApiProduct[] }>(
          `/recommendations/similar/${productId}`,
        );
      } catch {
        return {
          data: DEMO_PRODUCTS.filter((p) => p.id !== productId).slice(
            0,
            8,
          ) as unknown as ApiProduct[],
        };
      }
    },
    trending: async () => {
      try {
        return await apiRequest<{ data: ApiProduct[] }>(
          "/recommendations/trending",
        );
      } catch {
        return {
          data: [...DEMO_PRODUCTS]
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10) as unknown as ApiProduct[],
        };
      }
    },
    recentlyViewed: async () => {
      try {
        return await apiRequest<{ data: ApiProduct[] }>(
          "/recommendations/recently-viewed",
        );
      } catch {
        return { data: [] };
      }
    },
  },

  // Payments (Razorpay)
  payments: {
    createOrder: (orderId: string) =>
      apiRequest<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        orderId: string;
        key_id: string;
      }>("/payments/create-order", { method: "POST", body: { orderId } }),

    verify: (params: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId: string;
    }) =>
      apiRequest<{ success: boolean; orderId: string; paymentId: string }>(
        "/payments/verify",
        { method: "POST", body: params },
      ),

    refund: (orderId: string) =>
      apiRequest("/payments/refund", { method: "POST", body: { orderId } }),
  },
};

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "seller" | "admin";
  isVerified: boolean;
  avatarUrl?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  categoryId?: string;
  sellerId?: string;
  brand?: string;
  sku?: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  avgRating: string;
  totalReviews: number;
  totalSold: number;
  specifications?: Record<string, string>;
  tags?: string[];
  images?: ApiProductImage[];
  variants?: ApiProductVariant[];
  variantCount?: number;
  category?: ApiCategory;
}

export interface ApiProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ApiProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier: string;
  stock: number;
  sku?: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
}

export interface ApiBanner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkType?: string;
  linkValue?: string;
  isActive: boolean;
}

export interface ApiCartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: ApiProduct;
  variant?: ApiProductVariant;
}

export interface ApiWishlistItem {
  id: string;
  productId: string;
  product: ApiProduct;
}

export interface ApiAddress {
  id: string;
  userId: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ApiOrder {
  id: string;
  userId: string;
  orderNumber: string;
  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";
  subtotal: string;
  discount: string;
  shippingFee: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: ApiOrderItem[];
  address?: ApiAddress;
}

export interface ApiOrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product?: ApiProduct;
}

export interface ApiReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
  user?: { name: string; avatarUrl?: string };
}

export interface ApiNotification {
  id: string;
  title: string;
  body?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Mappers: API → App types ────────────────────────────────────────────────

import { Product, Category } from "@/constants/data";

export function mapApiProduct(p: ApiProduct & { imageUrl?: string }): Product {
  const price = parseFloat(p.price) || 0;
  const originalPrice = parseFloat(p.compareAtPrice ?? "0") || price;
  const discount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  const primaryImage = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
  const imageUrl = p.imageUrl || primaryImage?.url || "";

  return {
    id: p.id,
    name: p.name,
    price,
    originalPrice,
    discount,
    rating: parseFloat(p.avgRating) || 0,
    reviewCount: p.totalReviews ?? 0,
    category: p.category?.slug ?? p.categoryId ?? "",
    subcategory: "",
    seller: p.brand ?? "FLOMA",
    sellerId: p.sellerId ?? "",
    stock: p.stock ?? 0,
    description: p.description ?? "",
    image: imageUrl,
    tags: p.tags ?? [],
    isExpress: false,
    specifications: p.specifications ?? {},
    variantCount: p.variants?.length ?? p.variantCount ?? 0,
  };
}

export function mapApiCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? "🛍️",
    color: c.color ?? "#6366f1",
    color2: c.color ?? "#818cf8",
  };
}
