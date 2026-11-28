import React, { useCallback, useRef, useState } from "react";
import {
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
import { ProductGrid, LoadState, openBanner } from "@/components/ShopUI";
import { StoreHeader, DepartmentTabs } from "@/components/StoreHeader";
import CampaignCarousel from "@/components/CampaignCarousel";
import CategoryThumbnail from "@/components/CategoryThumbnail";
import StorefrontSkeleton from "@/components/StorefrontSkeleton";
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

function EditorialHeading({ title }: { title: string }) {
  const c = useColors();
  return (
    <View style={s.desktopDividerRow}>
      <View style={[s.desktopLine, { backgroundColor: c.goldLine }]} />
      <Text style={[s.desktopDiamond, { color: c.goldMuted }]}>✦</Text>
      <Text style={[s.desktopSectionTitle, { color: c.gold }]}>{title}</Text>
      <Text style={[s.desktopDiamond, { color: c.goldMuted }]}>✦</Text>
      <View style={[s.desktopLine, { backgroundColor: c.goldLine }]} />
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

function getPriceLabel(product: ApiProduct): string {
  const price = Number(product.price);
  const originalPrice = Number(product.compareAtPrice);
  const discount =
    originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
  return discount > 0 ? `${discount}% off` : formatPrice(price);
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
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      if (sequence === requestSequence.current) {
        setLoading(false);
        setInitialLoad(false);
        setRefreshing(false);
      }
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

  const refresh = () => {
    setRefreshing(true);
    void load();
  };

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
      if (sequence === requestSequence.current) setError(true);
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
    : Math.min(400, Math.max(220, width * 0.72));

  if (initialLoad) {
    return <StorefrontSkeleton desktop={desktop} heroHeight={heroHeight} />;
  }

  if (desktop) {
    const primaryOffer = offers[0];
    const findCategory = (slug: string) =>
      roots.find((category) => category.slug === slug);
    const men = findCategory("men");
    const women = findCategory("women");
    const footwear = findCategory("footwear");
    const accessories = findCategory("accessories");

    const productsIn = (...categories: (ApiCategory | undefined)[]) => {
      const ids = new Set(
        categories.flatMap((category) => (category ? [category.id] : [])),
      );
      const pending = [...ids];
      for (const id of pending) {
        for (const category of cats) {
          if (category.parentId === id && !ids.has(category.id)) {
            ids.add(category.id);
            pending.push(category.id);
          }
        }
      }
      return allLoaded.filter((product) =>
        ids.has(product.category?.id ?? product.categoryId ?? ""),
      );
    };
    const trends = [
      ...new Map(
        [...featured, ...best, ...products].map((product) => [
          product.id,
          product,
        ]),
      ).values(),
    ];
    const campaignWidth = Math.min(width - 48, 1320);

    const splitFeature = (
      heading: string,
      image: string,
      title: string,
      onPress: () => void,
      description?: string,
      reverse = false,
    ) => (
      <View style={s.desktopSection}>
        <EditorialHeading title={heading} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Shop ${title}`}
          onPress={onPress}
          style={[s.desktopFeature, reverse && s.desktopFeatureReverse]}
        >
          <Image
            source={image || undefined}
            style={s.desktopFeatureImage}
            contentFit="cover"
          />
          <View style={s.desktopFeatureCopy}>
            <Text style={s.desktopFeatureTitle} numberOfLines={2}>
              {title}
            </Text>
            {description && (
              <Text style={s.desktopFeatureDescription} numberOfLines={3}>
                {description}
              </Text>
            )}
            <Text style={s.desktopFeatureCta}>Shop the edit ›</Text>
          </View>
        </TouchableOpacity>
      </View>
    );

    const productRow = (title: string, items: ApiProduct[], columns = 5) =>
      items.length > 0 && (
        <View style={s.desktopSection}>
          <EditorialHeading title={title} />
          <View style={s.desktopEditorialRow}>
            {items.slice(0, columns).map((product) => (
              <TouchableOpacity
                key={product.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${product.name}`}
                onPress={() => router.push(`/product/${product.id}`)}
                style={[
                  s.desktopEditorialCard,
                  { maxWidth: columns === 4 ? "25%" : "20%" },
                ]}
              >
                <View style={s.desktopEditorialPhoto}>
                  <Image
                    source={getProductThumb(product) || undefined}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(22,15,17,0.9)"]}
                    style={s.desktopEditorialScrim}
                  />
                  <Text style={s.desktopPriceBadge}>
                    {getPriceLabel(product)}
                  </Text>
                </View>
                <View style={s.desktopEditorialCaption}>
                  <Text style={s.desktopEditorialBrand} numberOfLines={1}>
                    {product.brand || store.storeName}
                  </Text>
                  <Text style={s.desktopEditorialName} numberOfLines={1}>
                    {product.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

    return (
      <View
        testID="home-screen"
        style={{ flex: 1, backgroundColor: c.background }}
      >
        <StoreHeader
          query={query}
          onChangeQuery={setQuery}
          onSearch={(q) =>
            router.push({ pathname: "/products", params: { q } })
          }
        />

        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/offers")}
            style={s.desktopOfferStrip}
          >
            <Text style={s.desktopOfferText}>
              {primaryOffer
                ? `${
                    primaryOffer.discountType === "percentage"
                      ? `${Number(primaryOffer.discountValue)}%`
                      : formatPrice(Number(primaryOffer.discountValue))
                  } off with ${primaryOffer.code}`
                : "Explore store offers"}
            </Text>
            {primaryOffer && Number(primaryOffer.minOrderValue) > 0 && (
              <Text style={s.desktopOfferDetails}>
                Orders from {formatPrice(Number(primaryOffer.minOrderValue))}
              </Text>
            )}
            <Text style={s.desktopOfferLink}>View offers ›</Text>
          </TouchableOpacity>

          <View style={s.desktopContainer}>
            {banners.length > 0 && (
              <View style={s.desktopHeroFrame}>
                <CampaignCarousel
                  banners={banners}
                  height={heroHeight}
                  desktop
                  slideWidth={campaignWidth}
                />
              </View>
            )}
            <View style={[s.desktopBenefits, { borderColor: c.border }]}>
              <Text style={[s.desktopBenefitText, { color: c.foreground }]}>
                Free shipping from {formatPrice(store.freeShippingThreshold)}
              </Text>
              <Text style={[s.desktopBenefitText, { color: c.foreground }]}>
                {store.returnsHeadline}
              </Text>
            </View>
            {banners[1] &&
              splitFeature(
                "In the spotlight",
                banners[1].imageUrl,
                banners[1].title || "Featured collection",
                () => openBanner(banners[1]),
                banners[1].subtitle,
              )}
            {banners[2] &&
              splitFeature(
                "The season edit",
                banners[2].imageUrl,
                banners[2].title || "New season collection",
                () => openBanner(banners[2]),
                banners[2].subtitle,
                true,
              )}
            {productRow("Trending on FLOMA", trends, 4)}
            {men &&
              splitFeature(
                "Menswear",
                men.imageUrl || getProductThumb(productsIn(men)[0]),
                men.name,
                () => browse("popular", men.name, men.slug),
              )}
            {women &&
              splitFeature(
                "Womenswear",
                women.imageUrl || getProductThumb(productsIn(women)[0]),
                women.name,
                () => browse("popular", women.name, women.slug),
                undefined,
                true,
              )}
            {productRow("Clothing picks", productsIn(men, women))}
            {productRow(
              "Footwear & accessories",
              productsIn(footwear, accessories),
            )}

            {/* 7. EXPLORE THE FULL COLLECTION — Interactive Filtered Grid */}
            <View style={s.desktopSection}>
              <EditorialHeading title="SHOP THE COLLECTION" />
              <View style={[s.desktopCatalogHeader, { borderColor: c.border }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.desktopDeptPills}
                >
                  {[{ id: "", name: "All Styles" }, ...roots].map((cat) => {
                    const isActive = active === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id || "all"}
                        onPress={() => setActive(cat.id)}
                        style={[
                          s.desktopDeptTab,
                          {
                            borderBottomColor: isActive
                              ? c.navy
                              : "transparent",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.desktopDeptTabText,
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
                <View style={s.desktopFilterWrap}>
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
                    style={[s.desktopLoadMore, { borderColor: c.navy }]}
                  >
                    <Text style={[s.desktopLoadMoreText, { color: c.navy }]}>
                      {fetchingMore ? "LOADING STYLES…" : "LOAD MORE STYLES"}
                    </Text>
                  </TouchableOpacity>
                )}

                {roots.length > 0 && (
                  <View style={s.desktopViewAllRow}>
                    <TouchableOpacity
                      onPress={() => router.push("/products")}
                      style={[s.desktopViewAllBtn, { backgroundColor: c.navy }]}
                    >
                      <Text style={s.desktopViewAllText}>
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

  const tileSize = Math.min(92, (width - 52) / 5);
  const offer = offers[0];
  const discount = offer
    ? offer.discountType === "percentage"
      ? `${Number(offer.discountValue)}% off`
      : `${formatPrice(Number(offer.discountValue))} off`
    : null;
  const departments = [
    { id: "", name: "All" },
    ...roots.map((cat) => ({ id: cat.id, name: cat.name })),
    { id: "__fresh", name: "Fresh Fits" },
    { id: "__offers", name: "Offers" },
  ];
  const sections = [
    {
      title: "New arrivals",
      products: newest,
      sort: "newest",
      color: "#542235",
    },
    {
      title: "Best sellers",
      products: best,
      sort: "popular",
      color: "#233B38",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={[
          s.mobileHeader,
          {
            paddingTop: insets.top,
            backgroundColor: c.card,
            borderColor: c.border,
          },
        ]}
      >
        <StoreHeader
          query={query}
          onChangeQuery={setQuery}
          onSearch={(q) =>
            router.push({ pathname: "/products", params: { q } })
          }
        />
      </View>
      <ScrollView
        testID="home-screen"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.foreground}
          />
        }
      >
        <DepartmentTabs
          tabs={departments}
          active={active}
          onChange={(id) => {
            if (id === "__offers") router.push("/offers");
            else if (id === "__fresh") router.push("/(tabs)/fresh-fits");
            else setActive(id);
          }}
        />
        {banners.length > 0 && (
          <CampaignCarousel banners={banners} height={heroHeight} />
        )}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push("/offers")}
          style={s.savingsStrip}
        >
          <Icon name="pricetag-outline" size={17} color="#402716" />
          <Text style={s.savingsText}>
            {offer ? `${discount} with ${offer.code}` : "Shop store offers"}
          </Text>
          <Icon name="chevron-forward" size={17} color="#402716" />
        </TouchableOpacity>
        {displayTiles.length > 0 && (
          <View style={s.mobileSection}>
            <Text style={[s.mobileTitle, { color: c.foreground }]}>
              Shop by category
            </Text>
            <View style={s.categoryGrid}>
              {displayTiles.slice(0, 15).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Shop ${cat.name}`}
                  onPress={() => browse("popular", cat.name, cat.slug)}
                  style={s.categoryTile}
                >
                  <CategoryThumbnail
                    category={cat}
                    size={tileSize}
                    radius={tileSize / 2}
                  />
                  <Text
                    numberOfLines={2}
                    style={[s.categoryLabel, { color: c.foreground }]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <View style={[s.benefits, { backgroundColor: c.secondary }]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/help",
                params: { section: "shipping" },
              })
            }
            style={s.benefit}
          >
            <Icon name="car-outline" size={19} color={c.foreground} />
            <Text style={[s.benefitText, { color: c.foreground }]}>
              Free shipping from {formatPrice(store.freeShippingThreshold)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/help", params: { section: "returns" } })
            }
            style={s.benefit}
          >
            <Icon
              name="return-down-back-outline"
              size={19}
              color={c.foreground}
            />
            <Text style={[s.benefitText, { color: c.foreground }]}>
              {store.returnsHeadline}
            </Text>
          </TouchableOpacity>
        </View>

        {sections
          .filter((section) => section.products.length > 0)
          .map((section) => (
            <View
              key={section.sort}
              style={[s.collection, { backgroundColor: section.color }]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Shop all ${section.title.toLowerCase()}`}
                onPress={() => browse(section.sort, section.title, active)}
                style={s.collectionHead}
              >
                <Text style={[s.mobileTitle, { color: "#FFFFFF" }]}>
                  {section.title}
                </Text>
                <Text style={s.collectionLink}>Shop all ›</Text>
              </TouchableOpacity>
              <View style={s.collectionRow}>
                {section.products.slice(0, 3).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    accessibilityRole="button"
                    accessibilityLabel={product.name}
                    onPress={() => router.push(`/product/${product.id}`)}
                    style={[s.collectionItem, { backgroundColor: c.card }]}
                  >
                    <Image
                      source={getProductThumb(product) || undefined}
                      style={[
                        s.collectionImage,
                        { backgroundColor: c.secondary },
                      ]}
                      contentFit="cover"
                    />
                    <View style={s.collectionDetails}>
                      <Text
                        numberOfLines={1}
                        style={{ color: c.foreground, fontSize: 11 }}
                      >
                        {product.name}
                      </Text>
                      <Text
                        style={[s.collectionPrice, { color: c.foreground }]}
                      >
                        {formatPrice(Number(product.price))}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

        {banners.length > 1 && (
          <CampaignCarousel
            banners={banners.slice(1)}
            height={Math.max(170, width * 0.42)}
          />
        )}
        {featured.length > 0 && (
          <View style={s.mobileSection}>
            <Text style={[s.mobileTitle, { color: c.foreground }]}>
              Featured picks
            </Text>
            <ProductGrid products={featured.slice(0, 2).map(mapApiProduct)} />
          </View>
        )}

        <View
          style={[
            s.catalogueHeader,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text
            style={[
              s.mobileTitle,
              { color: c.foreground, paddingHorizontal: 12 },
            ]}
          >
            Recommended for you
          </Text>
          <ProductFiltersBar value={filters} onChange={setFilters} />
        </View>
        <View style={s.mobileSection}>
          {loading || error ? (
            <LoadState
              loading={loading}
              error={error ? "load" : null}
              retry={error ? load : undefined}
            />
          ) : products.length ? (
            <ProductGrid products={products.map(mapApiProduct)} />
          ) : (
            <LoadState empty="No products match these filters" />
          )}
          {more && !loading && !error && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={loadMore}
              disabled={fetchingMore}
              style={s.mobileLoadMore}
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
  desktopContainer: {
    width: "100%",
    maxWidth: 1368,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  desktopOfferStrip: {
    backgroundColor: "#522136",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  desktopOfferText: {
    color: "#FFF3D6",
    fontSize: 16,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopOfferDetails: { color: "#F4D9E1", fontSize: 13 },
  desktopOfferLink: {
    color: "#FFFFFF",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  desktopHeroFrame: { marginTop: 18, borderRadius: 18, overflow: "hidden" },
  desktopBenefits: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    paddingVertical: 14,
    marginTop: 12,
    borderBottomWidth: 1,
  },
  desktopBenefitText: { fontSize: 13, fontFamily: "GoogleSans_600SemiBold" },
  desktopSection: { marginTop: 34 },
  desktopDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 17,
  },
  desktopLine: { flex: 1, height: 1, maxWidth: 140 },
  desktopDiamond: { fontSize: 12 },
  desktopSectionTitle: {
    fontSize: 26,
    letterSpacing: -0.3,
    fontFamily: "GoogleSans_700Bold",
    textAlign: "center",
  },
  desktopFeature: {
    alignSelf: "center",
    width: "88%",
    minHeight: 248,
    aspectRatio: 3.45,
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3E7DB",
  },
  desktopFeatureReverse: { flexDirection: "row-reverse" },
  desktopFeatureImage: { flex: 3, backgroundColor: "#CDBDAF" },
  desktopFeatureCopy: {
    flex: 2,
    padding: 24,
    gap: 10,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  desktopFeatureTitle: {
    color: "#392534",
    fontSize: 29,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopFeatureDescription: { color: "#5F4654", fontSize: 14, lineHeight: 20 },
  desktopFeatureCta: {
    color: "#522136",
    fontSize: 14,
    fontFamily: "GoogleSans_700Bold",
    marginTop: 6,
  },
  desktopEditorialRow: { flexDirection: "row", gap: 14 },
  desktopEditorialCard: {
    flex: 1,
    minWidth: 0,
    padding: 2,
    borderWidth: 1,
    borderColor: "#BD8B37",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#E8C990",
  },
  desktopEditorialPhoto: {
    aspectRatio: 0.86,
    overflow: "hidden",
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    backgroundColor: "#D7C7B5",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 12,
  },
  desktopEditorialScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "44%",
  },
  desktopPriceBadge: {
    color: "#FFF4DA",
    backgroundColor: "#402434",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 17,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopEditorialCaption: {
    backgroundColor: "#FAECCE",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
  },
  desktopEditorialBrand: {
    color: "#402434",
    fontSize: 13,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopEditorialName: { color: "#563C43", fontSize: 12 },
  desktopCatalogHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: "#FAFAFA",
  },
  desktopDeptPills: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 22,
  },
  desktopDeptTab: {
    paddingVertical: 14,
    borderBottomWidth: 3,
  },
  desktopDeptTabText: {
    fontSize: 12,
    letterSpacing: 0.7,
  },
  desktopFilterWrap: {
    borderTopWidth: 1,
    borderTopColor: "#ECEEEF",
  },
  desktopLoadMore: {
    marginTop: 28,
    alignSelf: "center",
    borderWidth: 1.5,
    paddingHorizontal: 30,
    paddingVertical: 11,
  },
  desktopLoadMoreText: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopViewAllRow: {
    marginTop: 18,
    alignItems: "center",
  },
  desktopViewAllBtn: {
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  desktopViewAllText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    letterSpacing: 1.1,
    fontFamily: "GoogleSans_700Bold",
  },

  mobileHeader: { borderBottomWidth: StyleSheet.hairlineWidth },
  mobileSection: { padding: 12, gap: 12 },
  mobileTitle: {
    fontSize: 21,
    fontFamily: "GoogleSans_700Bold",
    letterSpacing: -0.45,
  },
  savingsStrip: {
    backgroundColor: "#F7D8A8",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  savingsText: {
    flex: 1,
    color: "#402716",
    fontSize: 14,
    fontFamily: "GoogleSans_700Bold",
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12 },
  categoryTile: {
    width: "20%",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  categoryLabel: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "GoogleSans_500Medium",
  },
  benefits: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
  },
  benefit: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { flex: 1, fontSize: 11, fontFamily: "GoogleSans_600SemiBold" },
  collection: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  collectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  collectionLink: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "GoogleSans_600SemiBold",
  },
  collectionRow: { flexDirection: "row", gap: 6 },
  collectionItem: { flex: 1, minWidth: 0, borderRadius: 4, overflow: "hidden" },
  collectionImage: { width: "100%", aspectRatio: 0.76 },
  collectionDetails: { padding: 6, gap: 2 },
  collectionPrice: { fontSize: 12, fontFamily: "GoogleSans_700Bold" },
  catalogueHeader: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    gap: 8,
    alignItems: "stretch",
  },
  mobileLoadMore: { padding: 18, alignItems: "center" },
});
