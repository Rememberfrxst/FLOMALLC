import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./Text";
import { StoreHeader } from "./StoreHeader";
import { ProductGrid, LoadState } from "./ShopUI";
import ProductFiltersBar, { ProductFilters } from "./ProductFilters";
import { useColors } from "@/hooks/useColors";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import { DesktopStoreFooter } from "./DesktopStoreFooter";
import { Icon } from "./StoreIcon";
import { api, ApiCategory, mapApiProduct } from "@/services/api";
import type { Product } from "@/constants/data";
export default function ProductListing({
  categoryOverride,
  title: fixedTitle,
  defaultSort = "popular",
  embedded = false,
}: {
  categoryOverride?: string;
  title?: string;
  defaultSort?: string;
  embedded?: boolean;
}) {
  const c = useColors(),
    insets = useSafeAreaInsets(),
    desktop = useDesktopWeb(),
    { width } = useWindowDimensions(),
    params = useLocalSearchParams<{
      q?: string;
      category?: string;
      title?: string;
      sort?: string;
      slug?: string;
    }>(),
    category = categoryOverride ?? params.category ?? params.slug ?? "";
  const [query, setQuery] = useState(params.q || ""),
    [filters, setFilters] = useState<ProductFilters>({
      sort: params.sort || defaultSort,
    }),
    [page, setPage] = useState(1),
    [items, setItems] = useState<Product[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [more, setMore] = useState(false),
    [retry, setRetry] = useState(0),
    [categoryTitle, setCategoryTitle] = useState(""),
    [categories, setCategories] = useState<ApiCategory[]>([]),
    [openFilter, setOpenFilter] = useState<string | null>("category"),
    [gridCols, setGridCols] = useState<3 | 4>(4);
  useEffect(() => {
    setQuery(params.q || "");
  }, [params.q]);
  useEffect(() => {
    if (params.sort) {
      setFilters((current) => ({ ...current, sort: params.sort! }));
    }
  }, [params.sort]);
  useEffect(() => {
    api.categories
      .list()
      .then((cats) => {
        setCategories(cats);
        setCategoryTitle(
          cats.find((cat) => cat.id === category || cat.slug === category)
            ?.name || "",
        );
      })
      .catch(() => {});
  }, [category]);
  useEffect(
    () => setPage(1),
    [
      query,
      category,
      filters.sort,
      filters.minPrice,
      filters.maxPrice,
      filters.inStock,
    ],
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(false);
      const timer = setTimeout(
        () =>
          api.products
            .list({
              q: query,
              category,
              sort: filters.sort,
              page,
              limit: 20,
              ...(filters.minPrice !== undefined
                ? { minPrice: filters.minPrice }
                : {}),
              ...(filters.maxPrice !== undefined
                ? { maxPrice: filters.maxPrice }
                : {}),
              ...(filters.inStock ? { inStock: true } : {}),
            })
            .then((result) => {
              if (active) {
                setItems((prev) =>
                  page === 1
                    ? result.data.map(mapApiProduct)
                    : [...prev, ...result.data.map(mapApiProduct)],
                );
                setMore(result.data.length === 20);
              }
            })
            .catch(() => {
              if (active) setError(true);
            })
            .finally(() => {
              if (active) setLoading(false);
            }),
        220,
      );
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }, [
      query,
      category,
      filters.sort,
      filters.minPrice,
      filters.maxPrice,
      filters.inStock,
      page,
      retry,
    ]),
  );
  const title = query
    ? `Results for “${query}”`
    : fixedTitle || params.title || categoryTitle || "All products";
  const roots = categories.filter(
    (cat) => !cat.parentId || !categories.some((parent) => parent.id === cat.parentId),
  );
  const applyPrice = (minPrice?: number, maxPrice?: number) =>
    setFilters((current) => ({ ...current, minPrice, maxPrice }));
  const chooseCategory = (item?: ApiCategory) =>
    router.push({
      pathname: "/products",
      params: item
        ? { category: item.slug, title: item.name }
        : { title: "All products" },
    });

  if (desktop) {
    const sortLabel =
      filters.sort === "newest"
        ? "What's New"
        : filters.sort === "price_asc"
          ? "Price (lowest first)"
          : filters.sort === "price_desc"
            ? "Price (highest first)"
            : "Relevance";
    const desktopColumns = width >= 1200 ? gridCols : 3;
    const section = (key: string, label: string, content: React.ReactNode) => (
      <View style={[sDesktop.filterSection, { borderColor: c.border }]} key={key}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: openFilter === key }}
          onPress={() => setOpenFilter((current) => (current === key ? null : key))}
          style={sDesktop.filterHeading}
        >
          <Text style={[sDesktop.filterHeadingText, { color: c.navy }]}>{label}</Text>
          <Icon name={openFilter === key ? "remove" : "add"} size={16} color={c.mutedForeground} />
        </TouchableOpacity>
        {openFilter === key && <View style={sDesktop.filterContent}>{content}</View>}
      </View>
    );
    return (
      <View testID="product-listing" style={{ flex: 1, backgroundColor: c.background }}>
        <StoreHeader
          back={!embedded}
          query={query}
          onChangeQuery={setQuery}
          onSearch={setQuery}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>
          <View style={sDesktop.page}>
            <Text style={[sDesktop.breadcrumb, { color: c.mutedForeground }]}>Home  /  {title}</Text>
            <View style={sDesktop.titleCenter}>
              <Text style={[sDesktop.categoryKicker, { color: c.gold }]}>FLOMA CURATED</Text>
              <Text style={[sDesktop.title, { color: c.navy }]}>{title.toUpperCase()}</Text>
              <Text style={[sDesktop.count, { color: c.mutedForeground }]}>
                {loading ? "Finding the right styles…" : `${items.length}${more ? "+" : ""} Items Found`}
              </Text>
            </View>
            <View style={sDesktop.body}>
              <View style={[sDesktop.sidebar, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={sDesktop.sidebarTop}>
                  <Text style={[sDesktop.refine, { color: c.navy }]}>Refine By</Text>
                  <TouchableOpacity onPress={() => setFilters({ sort: "popular" })}>
                    <Text style={[sDesktop.resetText, { color: c.gold }]}>CLEAR ALL</Text>
                  </TouchableOpacity>
                </View>
                {section(
                  "category",
                  "Category",
                  <>
                    <TouchableOpacity onPress={() => chooseCategory()} style={sDesktop.filterChoice}>
                      <Icon name={!category ? "radio-button-on" : "radio-button-off"} size={16} color={!category ? c.navy : c.mutedForeground} />
                      <Text style={[sDesktop.choiceText, { color: c.foreground }]}>All Products</Text>
                    </TouchableOpacity>
                    {roots.map((item) => {
                      const selected = category === item.id || category === item.slug;
                      return (
                        <TouchableOpacity key={item.id} onPress={() => chooseCategory(item)} style={sDesktop.filterChoice}>
                          <Icon name={selected ? "radio-button-on" : "radio-button-off"} size={16} color={selected ? c.navy : c.mutedForeground} />
                          <Text style={[sDesktop.choiceText, { color: c.foreground }]}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>,
                )}
                {section(
                  "price",
                  "Price",
                  <>
                    {[
                      { label: "Any price", min: undefined, max: undefined },
                      { label: "Below ₹1,000", min: undefined, max: 1000 },
                      { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
                      { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
                      { label: "₹5,000 & above", min: 5000, max: undefined },
                    ].map((band) => {
                      const selected = filters.minPrice === band.min && filters.maxPrice === band.max;
                      return (
                        <TouchableOpacity key={band.label} onPress={() => applyPrice(band.min, band.max)} style={sDesktop.filterChoice}>
                          <Icon name={selected ? "radio-button-on" : "radio-button-off"} size={16} color={selected ? c.navy : c.mutedForeground} />
                          <Text style={[sDesktop.choiceText, { color: c.foreground }]}>{band.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>,
                )}
                {section(
                  "availability",
                  "Availability",
                  <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!filters.inStock }}
                    onPress={() => setFilters((current) => ({ ...current, inStock: !current.inStock }))}
                    style={sDesktop.filterChoice}
                  >
                    <Icon name={filters.inStock ? "checkbox" : "square-outline"} size={18} color={filters.inStock ? c.navy : c.mutedForeground} />
                    <Text style={[sDesktop.choiceText, { color: c.foreground }]}>In stock only</Text>
                  </TouchableOpacity>,
                )}
              </View>
              <View style={sDesktop.results}>
                <View style={[sDesktop.controlBar, { backgroundColor: "#FAFAFA", borderColor: c.border }]}>
                  <Text style={[sDesktop.controlNote, { color: c.navy }]}>
                    {loading ? "Loading…" : `${items.length}${more ? "+" : ""} Items Found`}
                  </Text>
                  <View style={sDesktop.gridToggle}>
                    <Text style={[sDesktop.sortLabel, { color: c.mutedForeground }]}>GRID</Text>
                    {([3, 4] as const).map((cols) => (
                      <TouchableOpacity
                        key={cols}
                        onPress={() => setGridCols(cols)}
                        style={[
                          sDesktop.gridBtn,
                          {
                            borderColor: gridCols === cols ? c.navy : c.border,
                            backgroundColor: gridCols === cols ? c.navy : "#FFFFFF",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 10, color: gridCols === cols ? "#FFFFFF" : c.foreground, fontFamily: "GoogleSans_700Bold" }}>
                          {cols}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={sDesktop.sortControls}>
                    <Text style={[sDesktop.sortLabel, { color: c.mutedForeground }]}>SORT BY</Text>
                    {[
                      { key: "popular", label: "Relevance" },
                      { key: "newest", label: "What's New" },
                      { key: "price_asc", label: "Price: Low-High" },
                      { key: "price_desc", label: "Price: High-Low" },
                    ].map((sort) => {
                      const activeSort = filters.sort === sort.key;
                      return (
                        <TouchableOpacity
                          key={sort.key}
                          onPress={() => setFilters((current) => ({ ...current, sort: sort.key }))}
                          style={[
                            sDesktop.sortButton,
                            {
                              borderColor: activeSort ? c.navy : c.border,
                              backgroundColor: activeSort ? c.navy : "#FFFFFF",
                            },
                          ]}
                        >
                          <Text style={[sDesktop.sortText, { color: activeSort ? "#FFFFFF" : c.foreground }]}>
                            {sort.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <Text style={[sDesktop.activeSort, { color: c.mutedForeground }]}>Sorted by: {sortLabel}</Text>
                {loading && page === 1 ? (
                  <LoadState loading />
                ) : error ? (
                  <LoadState error="load" retry={() => setRetry((n) => n + 1)} />
                ) : items.length ? (
                  <ProductGrid products={items} columns={desktopColumns} desktop />
                ) : (
                  <LoadState empty="No products match your search" />
                )}
                {more && !error && (
                  <TouchableOpacity onPress={() => setPage((p) => p + 1)} disabled={loading} style={[sDesktop.loadMore, { borderColor: c.navy }]}>
                    <Text style={[sDesktop.loadMoreText, { color: c.navy }]}>{loading ? "LOADING…" : "LOAD MORE STYLES"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          <DesktopStoreFooter />
        </ScrollView>
      </View>
    );
  }
  return (
    <View
      testID="product-listing"
      style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}
    >
      <StoreHeader
        back={!embedded}
        query={query}
        onChangeQuery={setQuery}
        onSearch={setQuery}
      />
      <Text
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 12,
          fontSize: 17,
          fontFamily: "GoogleSans_600SemiBold",
          color: c.foreground,
        }}
      >
        {title}
      </Text>
      <ProductFiltersBar value={filters} onChange={setFilters} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 6, paddingBottom: 25 }}
      >
        {loading && page === 1 ? (
          <LoadState loading />
        ) : error ? (
          <LoadState error="load" retry={() => setRetry((n) => n + 1)} />
        ) : items.length ? (
          <ProductGrid products={items} />
        ) : (
          <LoadState empty="No products match your search" />
        )}
        {more && !error && (
          <TouchableOpacity
            onPress={() => setPage((p) => p + 1)}
            disabled={loading}
            style={{ padding: 20, alignItems: "center" }}
          >
            <Text style={{ color: c.foreground, fontSize: 13 }}>
              {loading ? "Loading…" : "Load more products"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const sDesktop = StyleSheet.create({
  page: { width: "100%", maxWidth: 1320, alignSelf: "center", paddingHorizontal: 28, paddingTop: 20, paddingBottom: 36 },
  breadcrumb: { fontSize: 11, letterSpacing: 0.2 },
  titleCenter: { alignItems: "center", paddingTop: 14, paddingBottom: 24 },
  categoryKicker: { fontSize: 10.5, letterSpacing: 1.8, fontFamily: "GoogleSans_700Bold", marginBottom: 4 },
  title: { fontSize: 26, fontFamily: "GoogleSans_700Bold", letterSpacing: 1.5, textAlign: "center" },
  count: { fontSize: 12, marginTop: 4 },
  body: { flexDirection: "row", alignItems: "flex-start", gap: 26 },
  sidebar: { width: 235, borderWidth: 1, flexShrink: 0 },
  sidebarTop: { height: 50, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refine: { fontSize: 14, fontFamily: "GoogleSans_700Bold" },
  resetText: { fontSize: 10.5, letterSpacing: 0.6, fontFamily: "GoogleSans_700Bold" },
  filterSection: { borderTopWidth: 1, paddingHorizontal: 15 },
  filterHeading: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filterHeadingText: { fontSize: 12, fontFamily: "GoogleSans_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  filterContent: { paddingBottom: 13, gap: 8 },
  filterChoice: { minHeight: 24, flexDirection: "row", alignItems: "center", gap: 8 },
  choiceText: { fontSize: 12, flexShrink: 1 },
  results: { flex: 1, minWidth: 0 },
  controlBar: { minHeight: 48, borderTopWidth: 1, borderBottomWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  controlNote: { fontSize: 12, fontFamily: "GoogleSans_600SemiBold" },
  gridToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  gridBtn: { width: 26, height: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sortControls: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  sortLabel: { fontSize: 10.5, letterSpacing: 0.6, fontFamily: "GoogleSans_700Bold", marginRight: 2 },
  sortButton: { minHeight: 28, paddingHorizontal: 10, borderWidth: 1, justifyContent: "center" },
  sortText: { fontSize: 11, fontFamily: "GoogleSans_600SemiBold" },
  activeSort: { fontSize: 11, paddingTop: 12, paddingBottom: 14 },
  loadMore: { height: 42, minWidth: 190, paddingHorizontal: 22, alignSelf: "center", marginTop: 30, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  loadMoreText: { fontSize: 11.5, letterSpacing: 1, fontFamily: "GoogleSans_700Bold" },
});
