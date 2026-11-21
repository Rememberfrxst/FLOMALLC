import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Text } from "@/components/Text";
import { Icon } from "@/components/StoreIcon";
import { ProductGrid, LoadState } from "@/components/ShopUI";
import { StoreHeader, DepartmentTabs } from "@/components/StoreHeader";
import CampaignCarousel from "@/components/CampaignCarousel";
import CategoryThumbnail from "@/components/CategoryThumbnail";
import ProductFiltersBar, { ProductFilters } from "@/components/ProductFilters";
import { useColors } from "@/hooks/useColors";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import { useStorefront } from "@/hooks/useStorefront";
import { useOffers } from "@/hooks/useOffers";
import { DesktopStoreFooter } from "@/components/DesktopStoreFooter";
import {
  api,
  ApiProduct,
  ApiCategory,
  ApiBanner,
  mapApiProduct,
} from "@/services/api";
import { formatPrice } from "@/constants/data";

function AjioSectionDivider({ title }: { title: string }) {
  const c = useColors();
  return (
    <View style={s.ajioDividerRow}>
      <View style={[s.ajioLine, { backgroundColor: c.goldLine }]} />
      <Text style={[s.ajioDiamond, { color: c.goldMuted }]}>✦</Text>
      <Text style={[s.ajioSectionTitle, { color: c.gold }]}>{title}</Text>
      <Text style={[s.ajioDiamond, { color: c.goldMuted }]}>✦</Text>
      <View style={[s.ajioLine, { backgroundColor: c.goldLine }]} />
    </View>
  );
}

function getProductThumb(p?: ApiProduct): string {
  if (!p) return "";
  return (
    p.images?.find((i) => i.isPrimary)?.url ||
    p.images?.[0]?.url ||
    (p as ApiProduct & { imageUrl?: string }).imageUrl ||
    ""
  );
}

function getDiscountLabel(p?: ApiProduct, fallback = "CURATED PICK"): string {
  if (!p) return fallback;
  const price = parseFloat(p.price) || 0;
  const compare = parseFloat(p.compareAtPrice || "0") || 0;
  if (compare > price) {
    const pct = Math.round(((compare - price) / compare) * 100);
    if (pct >= 15) return `MIN. ${pct}% OFF*`;
  }
  return price > 0 && price <= 999 ? "UNDER ₹999*" : `AT ${formatPrice(price)}`;
}

export default function Home() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = useDesktopWeb();
  const store = useStorefront();
  const offers = useOffers();
  const requestSequence = useRef(0);

  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [newest, setNewest] = useState<ApiProduct[]>([]);
  const [best, setBest] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({ sort: "popular" });
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [headerSolid, setHeaderSolid] = useState(false);

  const params = {
    category: active,
    sort: filters.sort,
    ...(filters.minPrice !== undefined ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice !== undefined ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.inStock ? { inStock: true } : {}),
  };

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(false);
    try {
      const [p, cat, b, n, top] = await Promise.all([
        api.products.list({ ...params, limit: 20 }),
        api.categories.list(),
        api.banners.list(),
        api.products.list({ category: active, sort: "newest", limit: 8 }),
        api.products.list({ category: active, sort: "popular", limit: 12 }),
      ]);
      if (sequence !== requestSequence.current) return;
      setProducts(p.data);
      setCats(cat);
      setBanners(b);
      setNewest(n.data);
      setBest(top.data);
      setPage(1);
      setMore(p.data.length === 20);
    } catch {
      if (sequence === requestSequence.current) setError(true);
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [
    active,
    filters.sort,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
  ]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestSequence.current++;
      };
    }, [load]),
  );

  const loadMore = async () => {
    const sequence = requestSequence.current;
    setFetchingMore(true);
    try {
      const result = await api.products.list({
        ...params,
        page: page + 1,
        limit: 20,
      });
      if (sequence !== requestSequence.current) return;
      setProducts((p) => [...p, ...result.data]);
      setPage((p) => p + 1);
      setMore(result.data.length === 20);
    } catch {
      setError(true);
    } finally {
      setFetchingMore(false);
    }
  };

  const roots = cats.filter(
    (cat) =>
      !cat.parentId || !cats.some((parent) => parent.id === cat.parentId),
  );
  const tiles = active ? cats.filter((cat) => cat.parentId === active) : roots;
  const displayTiles = tiles.length ? tiles : roots;
  const browse = (sort: string, title: string, category = "") =>
    router.push({ pathname: "/products", params: { sort, title, category } });

  const allLoaded = [
    ...new Map(
      [...products, ...best, ...newest].map((p) => [p.id, p]),
    ).values(),
  ];
  const featured = allLoaded.filter((p) => p.isFeatured);
  const heroHeight = desktop
    ? Math.min(480, Math.max(360, width * 0.34))
    : width * 0.79 + insets.top;

  // ─── AJIO-EXACT DESKTOP WEB STOREFRONT ─────────────────────────────────────
  if (desktop) {
    const primaryOffer = offers[0];
    const secondaryOffer = offers[2] || offers[1] || offers[0];
    const catBySlug = (slug: string) =>
      roots.find((r) => r.slug.toLowerCase() === slug);

    const menCat = catBySlug("men");
    const womenCat = catBySlug("women");
    const footwearCat = catBySlug("footwear");
    const accessoriesCat = catBySlug("accessories");

    const byCatSlug = (slugs: string[]) =>
      allLoaded.filter((p) => {
        const catObj = cats.find((ct) => ct.id === p.categoryId);
        const sSlug = (p.category?.slug || catObj?.slug || "").toLowerCase();
        return slugs.includes(sSlug);
      });

    const topTrendItems = (featured.length >= 4 ? featured : allLoaded).slice(0, 4);
    const westernItems = (
      byCatSlug(["men", "women"]).length >= 5
        ? byCatSlug(["men", "women"])
        : allLoaded
    ).slice(0, 5);
    const footwearAccessItems = (
      byCatSlug(["footwear", "accessories"]).length >= 5
        ? byCatSlug(["footwear", "accessories"])
        : allLoaded.slice(5)
    ).slice(0, 5);

    const spotlightBanner = banners[1] || banners[0];
    const headlinerBanner = banners[2] || banners[0];

    return (
      <View
        testID="home-screen"
        style={{ flex: 1, backgroundColor: c.background }}
      >
        <StoreHeader
          query={query}
          onChangeQuery={setQuery}
          onSearch={(q) => router.push({ pathname: "/products", params: { q } })}
        />

        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          {/* Full-Width Hero Carousel immediately under header matching Ajio */}
          {banners.length > 0 && (
            <View style={{ backgroundColor: "#1F2937" }}>
              <CampaignCarousel
                banners={banners}
                height={heroHeight}
                desktop
                slideWidth={width}
              />
            </View>
          )}

          {/* Crimson Savings Ribbon below Hero matching Ajio video frames 00:07-00:08 */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/offers")}
            style={[s.ajioTopRibbon, { backgroundColor: c.crimson }]}
          >
            <View style={s.ajioTopRibbonInner}>
              <Text style={s.ajioTopRibbonTag}>FLOMA EXCLUSIVE</Text>
              <Text style={s.ajioTopRibbonHeadline}>
                {primaryOffer
                  ? `UP TO ${
                      primaryOffer.discountType === "percentage"
                        ? `${Number(primaryOffer.discountValue)}%`
                        : formatPrice(Number(primaryOffer.discountValue))
                    } SAVINGS*`
                  : "SEASON SALE LIVE NOW"}
              </Text>
              <View style={s.ajioTopRibbonCodeBox}>
                <Text style={s.ajioTopRibbonCode}>
                  USE CODE: {primaryOffer?.code || "DEMO10"}
                </Text>
              </View>
              <Text style={s.ajioTopRibbonMeta}>
                {primaryOffer && Number(primaryOffer.minOrderValue) > 0
                  ? `On orders above ${formatPrice(Number(primaryOffer.minOrderValue))}`
                  : "Limited time offer"}
              </Text>
              <Text style={s.ajioTopRibbonCta}>CLICK HERE TO KNOW MORE ›</Text>
            </View>
          </TouchableOpacity>

          {/* Slim Bank / Payment & Shipping Offer Strip */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/offers")}
            style={[s.ajioBankStrip, { borderColor: c.border, backgroundColor: "#FFFFFF" }]}
          >
            <View style={s.ajioBankInner}>
              <View style={s.ajioBankBadge}>
                <Text style={s.ajioBankBadgeText}>FLOMA PAY</Text>
              </View>
              <Text style={[s.ajioBankHeadline, { color: c.navy }]}>
                {primaryOffer
                  ? `EXTRA ${
                      primaryOffer.discountType === "percentage"
                        ? `${Number(primaryOffer.discountValue)}%`
                        : formatPrice(Number(primaryOffer.discountValue))
                    } INSTANT SAVINGS*`
                  : "INSTANT MEMBER SAVINGS*"}
              </Text>
              <Text style={[s.ajioBankSub, { color: c.mutedForeground }]}>
                FREE SHIPPING ABOVE ₹{store.freeShippingThreshold} · EASY RETURNS · CASH ON DELIVERY
              </Text>
            </View>
          </TouchableOpacity>

        <View style={s.ajioContainer}>
          {/* 1. SPONSORS' SPOTLIGHT */}
          {spotlightBanner && (
            <View style={s.ajioSection}>
              <AjioSectionDivider title="SPONSORS' SPOTLIGHT" />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => browse("popular", "Spotlight Collection")}
                style={s.ajioSplitHero}
              >
                <Image
                  source={{ uri: spotlightBanner.imageUrl }}
                  style={s.ajioSplitImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(15,23,42,0.1)", "rgba(15,23,42,0.55)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    s.ajioSplitCard,
                    Platform.OS === "web"
                      ? ({
                          backgroundImage:
                            "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.20) 100%)",
                          backdropFilter: "blur(26px) saturate(185%)",
                          WebkitBackdropFilter: "blur(26px) saturate(185%)",
                          boxShadow:
                            "0 20px 48px rgba(0, 0, 0, 0.28), inset 0 1.5px 1px rgba(255, 255, 255, 0.72), inset 0 -1px 2px rgba(255, 255, 255, 0.22)",
                        } as any)
                      : null,
                  ]}
                >
                  <Text style={[s.ajioSplitBrand, { color: "#FDE68A" }]}>
                    FLOMA CURATED
                  </Text>
                  <Text numberOfLines={2} style={[s.ajioSplitTitle, { color: "#FFFFFF" }]}>
                    {spotlightBanner.title || "THE NEW SEASON EDIT"}
                  </Text>
                  <View style={s.ajioSplitDivider} />
                  <Text style={s.ajioSplitOffer}>MIN. 40% OFF*</Text>
                  <View style={s.ajioSplitBtn}>
                    <Text style={s.ajioSplitBtnText}>
                      SHOP NOW ›
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. FASHION'S HEADLINERS */}
          {headlinerBanner && (
            <View style={s.ajioSection}>
              <AjioSectionDivider title="FASHION'S HEADLINERS" />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => browse("newest", "New Arrivals & Headliners")}
                style={s.ajioSplitHero}
              >
                <Image
                  source={{ uri: headlinerBanner.imageUrl }}
                  style={s.ajioSplitImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(15,23,42,0.08)", "rgba(15,23,42,0.52)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    s.ajioSplitCard,
                    Platform.OS === "web"
                      ? ({
                          backgroundImage:
                            "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.20) 100%)",
                          backdropFilter: "blur(26px) saturate(185%)",
                          WebkitBackdropFilter: "blur(26px) saturate(185%)",
                          boxShadow:
                            "0 20px 48px rgba(0, 0, 0, 0.28), inset 0 1.5px 1px rgba(255, 255, 255, 0.72), inset 0 -1px 2px rgba(255, 255, 255, 0.22)",
                        } as any)
                      : null,
                  ]}
                >
                  <Text style={[s.ajioSplitBrand, { color: "#FDE68A" }]}>
                    SEASON EDIT
                  </Text>
                  <Text numberOfLines={2} style={[s.ajioSplitTitle, { color: "#FFFFFF" }]}>
                    {headlinerBanner.title || "COLOR & STYLE EDIT"}
                  </Text>
                  <View style={s.ajioSplitDivider} />
                  <Text style={s.ajioSplitOffer}>MIN. 50% OFF*</Text>
                  <View style={s.ajioSplitBtn}>
                    <Text style={s.ajioSplitBtnText}>
                      SHOP NOW ›
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. TOP TRENDS — 4-Column Tall Editorial Cards */}
          {topTrendItems.length > 0 && (
            <View style={s.ajioSection}>
              <AjioSectionDivider title="TOP TRENDS" />
              <View style={s.ajio4ColRow}>
                {topTrendItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/product/${item.id}`)}
                    style={s.ajioTrendCard}
                  >
                    <Image
                      source={{ uri: getProductThumb(item) }}
                      style={s.ajioTrendImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(10,14,20,0.85)"]}
                      style={s.ajioTrendScrim}
                    />
                    <View style={s.ajioTrendOverlay}>
                      <Text style={s.ajioTrendOffer}>
                        {getDiscountLabel(item, "TRENDING")}
                      </Text>
                      <Text numberOfLines={1} style={s.ajioTrendSub}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={s.ajioTrendFooter}>
                      <Text numberOfLines={1} style={s.ajioTrendBrand}>
                        {(item.brand || "FLOMA").toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Mid-Page Savings Banner */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/offers")}
            style={[s.ajioMidBanner, { backgroundColor: c.crimson }]}
          >
            <Text style={s.ajioMidTitle}>
              {secondaryOffer
                ? `UP TO ${
                    secondaryOffer.discountType === "percentage"
                      ? `${Number(secondaryOffer.discountValue)}%`
                      : formatPrice(Number(secondaryOffer.discountValue))
                  } EXTRA SAVINGS*`
                : "UP TO 15% EXTRA SAVINGS*"}
            </Text>
            <Text style={s.ajioMidSub}>
              Apply coupon code {secondaryOffer?.code || "STYLE15"} at checkout · Eligible on curated edits across FLOMA
            </Text>
            <Text style={s.ajioMidCta}>CLICK HERE TO VIEW ALL OFFERS ›</Text>
          </TouchableOpacity>

          {/* 4. EXCLUSIVE MENSWEAR & DREAMY WOMENSWEAR */}
          {(menCat || womenCat) && (
            <View style={s.ajioDualSection}>
              {menCat && (
                <View style={s.ajioSection}>
                  <AjioSectionDivider title="EXCLUSIVE MENSWEAR" />
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => browse("popular", menCat.name, menCat.slug)}
                    style={s.ajioDeptBanner}
                  >
                    <Image
                      source={{ uri: menCat.imageUrl || getProductThumb(byCatSlug(["men"])[0]) }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["rgba(17,24,39,0.2)", "rgba(17,24,39,0.7)"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      style={[
                        s.ajioDeptCard,
                        Platform.OS === "web"
                          ? ({
                              backgroundImage:
                                "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.20) 100%)",
                              backdropFilter: "blur(26px) saturate(185%)",
                              WebkitBackdropFilter: "blur(26px) saturate(185%)",
                              boxShadow:
                                "0 20px 48px rgba(0, 0, 0, 0.28), inset 0 1.5px 1px rgba(255, 255, 255, 0.72), inset 0 -1px 2px rgba(255, 255, 255, 0.22)",
                            } as any)
                          : null,
                      ]}
                    >
                      <Text style={[s.ajioSplitBrand, { color: "#FDE68A" }]}>
                        FLOMA MEN
                      </Text>
                      <Text style={[s.ajioSplitTitle, { color: "#FFFFFF" }]}>
                        MENSWEAR EDIT
                      </Text>
                      <Text style={s.ajioSplitOffer}>MIN. 35% OFF*</Text>
                      <View style={s.ajioSplitBtn}>
                        <Text style={s.ajioSplitBtnText}>
                          EXPLORE MEN ›
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {womenCat && (
                <View style={s.ajioSection}>
                  <AjioSectionDivider title="DREAMY WOMENSWEAR" />
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => browse("popular", womenCat.name, womenCat.slug)}
                    style={s.ajioDeptBanner}
                  >
                    <Image
                      source={{ uri: womenCat.imageUrl || getProductThumb(byCatSlug(["women"])[0]) }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["rgba(17,24,39,0.2)", "rgba(17,24,39,0.7)"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      style={[
                        s.ajioDeptCard,
                        Platform.OS === "web"
                          ? ({
                              backgroundImage:
                                "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.20) 100%)",
                              backdropFilter: "blur(26px) saturate(185%)",
                              WebkitBackdropFilter: "blur(26px) saturate(185%)",
                              boxShadow:
                                "0 20px 48px rgba(0, 0, 0, 0.28), inset 0 1.5px 1px rgba(255, 255, 255, 0.72), inset 0 -1px 2px rgba(255, 255, 255, 0.22)",
                            } as any)
                          : null,
                      ]}
                    >
                      <Text style={[s.ajioSplitBrand, { color: "#FDE68A" }]}>
                        FLOMA WOMEN
                      </Text>
                      <Text style={[s.ajioSplitTitle, { color: "#FFFFFF" }]}>
                        WOMENSWEAR EDIT
                      </Text>
                      <Text style={s.ajioSplitOffer}>MIN. 40% OFF*</Text>
                      <View style={s.ajioSplitBtn}>
                        <Text style={s.ajioSplitBtnText}>
                          EXPLORE WOMEN ›
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* 5. WESTERNWEAR — 5-Column Style Tiles */}
          {westernItems.length > 0 && (
            <View style={s.ajioSection}>
              <AjioSectionDivider title="WESTERNWEAR" />
              <View style={s.ajio5ColRow}>
                {westernItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/product/${item.id}`)}
                    style={s.ajioTileCard}
                  >
                    <Image
                      source={{ uri: getProductThumb(item) }}
                      style={s.ajioTileImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(10,14,20,0.88)"]}
                      style={s.ajioTileScrim}
                    />
                    <View style={s.ajioTileTextWrap}>
                      <Text numberOfLines={1} style={s.ajioTileName}>
                        {item.name}
                      </Text>
                      <Text numberOfLines={1} style={s.ajioTileBrand}>
                        {(item.brand || "FLOMA").toUpperCase()}
                      </Text>
                      <Text style={s.ajioTileOffer}>
                        {getDiscountLabel(item)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 6. FOOTWEAR & ACCESSORIES — 5-Column Style Tiles */}
          {footwearAccessItems.length > 0 && (
            <View style={s.ajioSection}>
              <AjioSectionDivider title="FOOTWEAR & ACCESSORIES" />
              <View style={s.ajio5ColRow}>
                {footwearAccessItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/product/${item.id}`)}
                    style={s.ajioTileCard}
                  >
                    <Image
                      source={{ uri: getProductThumb(item) }}
                      style={s.ajioTileImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(10,14,20,0.88)"]}
                      style={s.ajioTileScrim}
                    />
                    <View style={s.ajioTileTextWrap}>
                      <Text numberOfLines={1} style={s.ajioTileName}>
                        {item.name}
                      </Text>
                      <Text numberOfLines={1} style={s.ajioTileBrand}>
                        {(item.brand || "FLOMA").toUpperCase()}
                      </Text>
                      <Text style={s.ajioTileOffer}>
                        {getDiscountLabel(item)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 7. EXPLORE THE FULL COLLECTION — Interactive Filtered Grid */}
          <View style={s.ajioSection}>
            <AjioSectionDivider title="SHOP THE COLLECTION" />
            <View style={[s.ajioCatalogHeader, { borderColor: c.border }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.ajioDeptPills}
              >
                {[{ id: "", name: "All Styles" }, ...roots].map((cat) => {
                  const isActive = active === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id || "all"}
                      onPress={() => setActive(cat.id)}
                      style={[
                        s.ajioDeptTab,
                        {
                          borderBottomColor: isActive ? c.navy : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.ajioDeptTabText,
                          {
                            color: isActive ? c.navy : c.mutedForeground,
                            fontFamily: isActive
                              ? "GoogleSans_700Bold"
                              : "GoogleSans_500Medium",
                          },
                        ]}
                      >
                        {cat.name.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={s.ajioFilterWrap}>
                <ProductFiltersBar value={filters} onChange={setFilters} />
              </View>
            </View>

            <View style={{ paddingTop: 22 }}>
              {loading || error ? (
                <LoadState
                  loading={loading}
                  error={error ? "load" : null}
                  retry={error ? load : undefined}
                />
              ) : products.length ? (
                <ProductGrid
                  products={products.map(mapApiProduct)}
                  columns={width >= 1400 ? 4 : 3}
                  desktop
                />
              ) : (
                <LoadState empty="No products match these filters" />
              )}

              {more && !error && (
                <TouchableOpacity
                  onPress={loadMore}
                  disabled={fetchingMore}
                  style={[s.ajioLoadMore, { borderColor: c.navy }]}
                >
                  <Text style={[s.ajioLoadMoreText, { color: c.navy }]}>
                    {fetchingMore ? "LOADING STYLES…" : "LOAD MORE STYLES"}
                  </Text>
                </TouchableOpacity>
              )}

              {(footwearCat || accessoriesCat) && (
                <View style={s.ajioViewAllRow}>
                  <TouchableOpacity
                    onPress={() => router.push("/products")}
                    style={[s.ajioViewAllBtn, { backgroundColor: c.navy }]}
                  >
                    <Text style={s.ajioViewAllText}>
                      BROWSE FULL CATALOGUE ›
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <DesktopStoreFooter />
      </ScrollView>
    </View>
    );
  }

  // ─── MOBILE / NATIVE STOREFRONT (Preserved Cleanly) ────────────────────────
  const collection = (
    title: string,
    list: ApiProduct[],
    sort: string,
    tint: string,
  ) => (
    <TouchableOpacity
      key={title}
      accessibilityRole="button"
      accessibilityLabel={`View ${title}`}
      onPress={() => browse(sort, title, active)}
      style={[s.collection, { backgroundColor: tint }]}
    >
      <View style={s.collectionHead}>
        <Text
          style={{
            fontSize: 15,
            color: c.foreground,
            fontFamily: "GoogleSans_700Bold",
            fontStyle: "italic",
          }}
        >
          {title}
        </Text>
        <Icon name="chevron-forward" size={20} />
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {list.slice(0, 2).map((p) => (
          <View key={p.id} style={{ flex: 1 }}>
            <Image
              source={{
                uri:
                  p.images?.[0]?.url ||
                  (p as ApiProduct & { imageUrl?: string }).imageUrl,
              }}
              style={{
                width: "100%",
                aspectRatio: 0.7,
                backgroundColor: c.secondary,
              }}
              contentFit="cover"
            />
            <Text
              style={{
                color: c.accent,
                fontFamily: "GoogleSans_700Bold",
                fontSize: 14,
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              {formatPrice(Number(p.price))}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={[
          s.stickyHeader,
          {
            paddingTop: insets.top,
            backgroundColor: headerSolid ? "#D4E4FF" : "transparent",
            borderBottomWidth: headerSolid ? 1 : 0,
            borderBottomColor: headerSolid ? "#C0D5F5" : "transparent",
          },
        ]}
      >
        <StoreHeader
          inverse={banners.length > 0 && !headerSolid}
          headerSolid={headerSolid}
          query={query}
          onChangeQuery={setQuery}
          onSearch={(q) =>
            router.push({ pathname: "/products", params: { q } })
          }
        />
      </View>

      <ScrollView
        testID="home-screen"
        style={{ flex: 1, backgroundColor: c.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 25 }}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const solid = y > 36;
          if (solid !== headerSolid) setHeaderSolid(solid);
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={c.foreground}
          />
        }
      >
        <View
          style={{
            height: banners.length ? heroHeight : insets.top + 103,
            backgroundColor: c.card,
          }}
        >
          {banners.length > 0 && (
            <CampaignCarousel
              banners={banners}
              height={heroHeight}
              headerSpace={insets.top + 99}
            />
          )}
          <View style={[s.heroHeader, { paddingTop: insets.top + 56 }]}>
            <DepartmentTabs
              inverse={banners.length > 0}
              tabs={[
                { id: "", name: "All" },
                ...roots.map((cat) => ({ id: cat.id, name: cat.name })),
                { id: "__fresh", name: "Fresh Fits" },
                { id: "__offers", name: "Offers" },
              ]}
              active={active}
              onChange={(id) =>
                id === "__offers"
                  ? router.push("/offers")
                  : id === "__fresh"
                    ? router.push("/(tabs)/fresh-fits")
                    : setActive(id)
              }
            />
          </View>
        </View>
      <View
        style={[
          s.benefits,
          { backgroundColor: "#FFF2D9", borderColor: "#F3DEC0" },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/help", params: { section: "shipping" } })
          }
          style={s.benefit}
        >
          <Icon name="car" size={17} color="#773E17" />
          <View>
            <Text style={s.benefitTitle}>Free Shipping</Text>
            <Text style={s.benefitSub}>
              Orders from ₹{store.freeShippingThreshold}*
            </Text>
          </View>
        </TouchableOpacity>
        <View style={{ height: 32, width: 1, backgroundColor: "#C6A47D" }} />
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/help", params: { section: "returns" } })
          }
          style={s.benefit}
        >
          <Icon name="return-down-back" size={17} color="#773E17" />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={s.benefitTitle}>
              {store.returnsHeadline}
            </Text>
            <Text style={s.benefitSub}>Customer care is here to help</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() =>
          offers.length
            ? router.push("/offers")
            : browse("popular", "Exclusive Picks")
        }
        style={s.exclusive}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.exclusiveTitle}>
            {store.storeName.toUpperCase()} Exclusive Picks
          </Text>
          <Text numberOfLines={2} style={s.exclusiveSub}>
            {store.announcement}
          </Text>
        </View>
        <View style={s.exclusiveCta}>
          <Text
            style={{
              color: "#C84267",
              fontSize: 9,
              fontFamily: "GoogleSans_700Bold",
              textAlign: "center",
            }}
          >
            {offers.length ? "SHOP\nSTORE OFFERS" : "EXPLORE\nTHE PICKS"}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={[s.categoryGrid, { backgroundColor: c.card }]}>
        {displayTiles.slice(0, 14).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => browse("popular", cat.name, cat.slug)}
            style={s.categoryTile}
          >
            <CategoryThumbnail
              category={cat}
              size={Math.max(51, (width - 50) / 5)}
              radius={23}
            />
            <Text
              numberOfLines={2}
              style={{
                fontSize: 11,
                color: c.mutedForeground,
                textAlign: "center",
                marginTop: 7,
                minHeight: 28,
              }}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          accessibilityLabel="View all offers"
          onPress={() => router.push("/offers")}
          style={s.categoryTile}
        >
          <View
            style={[
              s.offerBubble,
              {
                width: Math.max(51, (width - 50) / 5),
                height: Math.max(51, (width - 50) / 5),
              },
            ]}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                textAlign: "center",
                fontFamily: "GoogleSans_700Bold",
              }}
            >
              Store{"\n"}Offers
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: c.mutedForeground, marginTop: 7 }}>
            Offers
          </Text>
        </TouchableOpacity>
      </View>
      {roots.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.edits}
        >
          {roots.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              accessibilityLabel={`Shop ${cat.name}`}
              onPress={() => browse("popular", cat.name, cat.slug)}
              style={{ width: width * 0.225 }}
            >
              <CategoryThumbnail
                category={cat}
                size={width * 0.225}
                radius={2}
              />
              <View style={s.editCaption}>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    textAlign: "center",
                    fontFamily: "GoogleSans_600SemiBold",
                  }}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    textAlign: "center",
                    fontFamily: "GoogleSans_700Bold",
                    marginTop: 4,
                  }}
                >
                  Shop now
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {(newest.length > 0 || best.length > 0) && (
        <View style={[s.collections, { backgroundColor: c.muted }]}>
          {collection("New Arrivals", newest, "newest", c.secondary)}
          {collection(
            "Best Sellers",
            best,
            "popular",
            c.background === "#FFFFFF" ? "#FFF0F0" : c.secondary,
          )}
        </View>
      )}
      {featured.length > 0 && (
        <View style={s.featured}>
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontFamily: "GoogleSans_700Bold",
              marginBottom: 12,
            }}
          >
            Featured offers
          </Text>
          <ProductGrid
            products={featured.slice(0, 2).map(mapApiProduct)}
            columns={2}
          />
          {offers.length > 0 && (
            <Text style={{ fontSize: 9, color: "#FADFD5", paddingTop: 4 }}>
              * Coupon minimum spend and offer terms apply.
            </Text>
          )}
        </View>
      )}
      {banners.length > 1 && (
        <View style={{ paddingVertical: 8, backgroundColor: c.muted }}>
          <CampaignCarousel
            banners={banners.slice(1)}
            height={width * 0.38}
          />
        </View>
      )}
      <View style={{ paddingTop: 13, backgroundColor: c.card }}>
        <Text
          style={{
            fontSize: 19,
            color: c.foreground,
            textAlign: "center",
            fontFamily: "GoogleSans_600SemiBold",
            paddingVertical: 12,
          }}
        >
          Recommend
        </Text>
        <ProductFiltersBar value={filters} onChange={setFilters} />
      </View>
      <View style={{ paddingHorizontal: 6, paddingTop: 7 }}>
        {loading || error ? (
          <LoadState
            loading={loading}
            error={error ? "load" : null}
            retry={error ? load : undefined}
          />
        ) : products.length ? (
          <ProductGrid products={products.map(mapApiProduct)} columns={2} />
        ) : (
          <LoadState empty="No products match these filters" />
        )}
        {more && !error && (
          <TouchableOpacity
            onPress={loadMore}
            disabled={fetchingMore}
            style={{ padding: 18, alignItems: "center" }}
          >
            <Text style={{ fontSize: 13, color: c.foreground }}>
              {fetchingMore ? "Loading…" : "Load more products"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // Ajio Desktop Styles
  ajioTopRibbon: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  ajioTopRibbonInner: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  ajioTopRibbonTag: {
    color: "#FDE68A",
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioTopRibbonHeadline: {
    color: "#FFFFFF",
    fontSize: 16,
    letterSpacing: 0.6,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioTopRibbonCodeBox: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 2,
  },
  ajioTopRibbonCode: {
    color: "#A6192E",
    fontSize: 12,
    letterSpacing: 0.8,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioTopRibbonMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  ajioTopRibbonCta: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "GoogleSans_700Bold",
    textDecorationLine: "underline",
  },
  ajioBankStrip: {
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  ajioBankInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  ajioBankBadge: {
    backgroundColor: "#2C4152",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
  },
  ajioBankBadgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioBankHeadline: {
    fontSize: 14,
    letterSpacing: 0.6,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioBankSub: {
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  ajioContainer: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  ajioSection: {
    marginTop: 34,
  },
  ajioDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 20,
  },
  ajioLine: {
    flex: 1,
    height: 1,
    maxWidth: 320,
  },
  ajioDiamond: {
    fontSize: 12,
  },
  ajioSectionTitle: {
    fontSize: 22,
    letterSpacing: 2.2,
    fontFamily: "GoogleSans_700Bold",
    textAlign: "center",
  },
  ajioSplitHero: {
    height: 360,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 48,
  },
  ajioSplitImage: {
    ...StyleSheet.absoluteFillObject,
  },
  ajioSplitCard: {
    backgroundColor: "rgba(15, 23, 42, 0.30)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.50)",
    width: 340,
    paddingVertical: 26,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  ajioSplitBrand: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontFamily: "GoogleSans_700Bold",
    marginBottom: 6,
  },
  ajioSplitTitle: {
    fontSize: 20,
    textAlign: "center",
    fontFamily: "GoogleSans_700Bold",
    lineHeight: 26,
  },
  ajioSplitDivider: {
    width: 44,
    height: 1.5,
    backgroundColor: "rgba(253, 230, 138, 0.72)",
    marginVertical: 11,
  },
  ajioSplitOffer: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "GoogleSans_700Bold",
    marginBottom: 14,
  },
  ajioSplitBtn: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.62)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255, 255, 255, 0.20)",
  },
  ajioSplitBtnText: {
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  ajio4ColRow: {
    flexDirection: "row",
    gap: 16,
  },
  ajioTrendCard: {
    flex: 1,
    aspectRatio: 0.72,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  ajioTrendImage: {
    width: "100%",
    height: "100%",
  },
  ajioTrendScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 34,
    height: "52%",
  },
  ajioTrendOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 42,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  ajioTrendOffer: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "GoogleSans_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  ajioTrendSub: {
    color: "#E5E7EB",
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  ajioTrendFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    backgroundColor: "#14181D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  ajioTrendBrand: {
    color: "#F3E5AB",
    fontSize: 11.5,
    letterSpacing: 1.4,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioMidBanner: {
    marginTop: 34,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 5,
  },
  ajioMidTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioMidSub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12.5,
  },
  ajioMidCta: {
    color: "#FDE68A",
    fontSize: 11.5,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
    marginTop: 4,
  },
  ajioDualSection: {
    gap: 8,
  },
  ajioDeptBanner: {
    height: 310,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 44,
    backgroundColor: "#1F2937",
  },
  ajioDeptCard: {
    backgroundColor: "rgba(15, 23, 42, 0.30)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.50)",
    width: 310,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  ajio5ColRow: {
    flexDirection: "row",
    gap: 14,
  },
  ajioTileCard: {
    flex: 1,
    aspectRatio: 0.72,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  ajioTileImage: {
    width: "100%",
    height: "100%",
  },
  ajioTileScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "56%",
  },
  ajioTileTextWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    alignItems: "center",
  },
  ajioTileName: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontFamily: "GoogleSans_600SemiBold",
    textAlign: "center",
  },
  ajioTileBrand: {
    color: "#D4BA98",
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
    marginTop: 2,
  },
  ajioTileOffer: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: "GoogleSans_700Bold",
    marginTop: 4,
  },
  ajioCatalogHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: "#FAFAFA",
  },
  ajioDeptPills: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 22,
  },
  ajioDeptTab: {
    paddingVertical: 14,
    borderBottomWidth: 3,
  },
  ajioDeptTabText: {
    fontSize: 12,
    letterSpacing: 0.7,
  },
  ajioFilterWrap: {
    borderTopWidth: 1,
    borderTopColor: "#ECEEEF",
  },
  ajioLoadMore: {
    marginTop: 28,
    alignSelf: "center",
    borderWidth: 1.5,
    paddingHorizontal: 30,
    paddingVertical: 11,
  },
  ajioLoadMoreText: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  ajioViewAllRow: {
    marginTop: 18,
    alignItems: "center",
  },
  ajioViewAllBtn: {
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  ajioViewAllText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    letterSpacing: 1.1,
    fontFamily: "GoogleSans_700Bold",
  },

  // Mobile Styles
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  heroHeader: { position: "absolute", top: 0, left: 0, right: 0 },
  benefits: {
    margin: 6,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 3,
    flexDirection: "row",
    gap: 12,
  },
  benefit: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 9,
    alignItems: "flex-start",
  },
  benefitTitle: {
    fontSize: 12,
    color: "#864718",
    fontFamily: "GoogleSans_700Bold",
  },
  benefitSub: { fontSize: 10, color: "#864718", marginTop: 2 },
  exclusive: {
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginTop: 3,
  },
  exclusiveTitle: {
    fontSize: 14,
    fontFamily: "GoogleSans_700Bold",
    color: "#D84570",
  },
  exclusiveSub: { fontSize: 9, color: "#D66787", marginTop: 3 },
  exclusiveCta: {
    borderWidth: 1,
    borderColor: "#D84570",
    borderRadius: 4,
    padding: 7,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 7,
    paddingVertical: 12,
  },
  categoryTile: {
    width: "20%",
    alignItems: "center",
    paddingHorizontal: 3,
    paddingBottom: 5,
  },
  offerBubble: {
    borderRadius: 25,
    backgroundColor: "#EF251F",
    alignItems: "center",
    justifyContent: "center",
  },
  edits: { padding: 6, gap: 7 },
  editCaption: {
    backgroundColor: "#080808",
    paddingVertical: 8,
    paddingHorizontal: 3,
  },
  collections: {
    flexDirection: "row",
    gap: 7,
    padding: 6,
    paddingVertical: 12,
  },
  collection: { flex: 1, padding: 6, borderRadius: 7 },
  collectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
    marginTop: 6,
  },
  featured: {
    backgroundColor: "#8C2212",
    margin: 6,
    padding: 11,
    borderRadius: 4,
    marginVertical: 12,
  },
});
