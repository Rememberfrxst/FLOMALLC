import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { Icon } from "@/components/StoreIcon";
import { StoreHeader } from "@/components/StoreHeader";
import { DesktopStoreFooter } from "@/components/DesktopStoreFooter";
import { ProductGrid, LoadState } from "@/components/ShopUI";
import { useColors } from "@/hooks/useColors";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useStorefront } from "@/hooks/useStorefront";
import {
  useOffers,
  bestOffer,
  offerPrice,
  StoreOffer,
} from "@/hooks/useOffers";
import {
  api,
  ApiProduct,
  ApiProductImage,
  ApiProductVariant,
  ApiReview,
  mapApiProduct,
} from "@/services/api";
import { formatPrice } from "@/constants/data";
type Detail = ApiProduct & {
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  reviews?: ApiReview[];
};
function offerTerms(o: StoreOffer) {
  return `${o.discountType === "percentage" ? `${Number(o.discountValue)}% off` : `${formatPrice(Number(o.discountValue))} off`}${Number(o.minOrderValue) > 0 ? ` on orders from ${formatPrice(Number(o.minOrderValue))}` : ""}${o.maxDiscount ? `, up to ${formatPrice(Number(o.maxDiscount))}` : ""}. ${o.validUntil ? "Valid until " + new Date(o.validUntil).toLocaleDateString("en-IN") + "." : ""}`;
}
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    c = useColors(),
    insets = useSafeAreaInsets(),
    { width } = useWindowDimensions(),
    cart = useCart(),
    wish = useWishlist(),
    { user } = useAuth(),
    store = useStorefront(),
    offers = useOffers(),
    gallery = useRef<ScrollView>(null);
  const isDesktop = useDesktopWeb();
  const [raw, setRaw] = useState<Detail | null>(null),
    [related, setRelated] = useState<ApiProduct[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [slide, setSlide] = useState(0),
    [variantId, setVariantId] = useState(""),
    [qty, setQty] = useState(1),
    [busy, setBusy] = useState(false),
    [added, setAdded] = useState(false),
    [notice, setNotice] = useState(""),
    [expanded, setExpanded] = useState(false),
    [sheet, setSheet] = useState<
      "offers" | "more" | "guide" | "details" | null
    >(null),
    [photoOpen, setPhotoOpen] = useState(false),
    [photoIndex, setPhotoIndex] = useState(0);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const p = await api.products.get(id);
      setRaw(p);
      setSlide(0);
      setQty(1);
      setAdded(false);
      setNotice("");
      const available = p.variants.filter((v) => v.stock > 0);
      setVariantId(available.length === 1 ? available[0].id : "");
      let recommendations = await api.products.list({
        category: p.categoryId || "",
        sort: "popular",
        limit: 20,
      });
      if (recommendations.data.filter((item) => item.id !== id).length < 2)
        recommendations = await api.products.list({
          sort: "popular",
          limit: 20,
        });
      setRelated(recommendations.data.filter((item) => item.id !== id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useEffect(() => {
    setAdded(false);
  }, [variantId, qty]);
  if (loading || error || !raw)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          paddingTop: insets.top,
        }}
      >
        <StoreHeader back />
        <LoadState
          loading={loading}
          error={error ? "load" : null}
          retry={load}
        />
      </View>
    );
  const base = mapApiProduct(raw),
    variant = raw.variants.find((v) => v.id === variantId),
    modifier = Number(variant?.priceModifier || 0),
    p = {
      ...base,
      price: base.price + modifier,
      originalPrice: base.originalPrice + modifier,
      stock: variant?.stock ?? base.stock,
    },
    offer = bestOffer(p.price, offers),
    images = raw.images.length
      ? raw.images.map((i) => i.url)
      : base.image
        ? [base.image]
        : [],
    names = [...new Set(raw.variants.map((v) => v.name))],
    optionTitle = names.length === 1 ? names[0] : "Options",
    color =
      Object.entries(p.specifications).find(([key]) =>
        /colou?r/i.test(key),
      )?.[1] || (variant && /colou?r/i.test(variant.name) ? variant.value : ""),
    sizeGuide = Object.entries(p.specifications).filter(([key]) =>
      /size|measurement|fit/i.test(key),
    ),
    address = user?.addresses.find((a) => a.isDefault) || user?.addresses[0],
    galleryHeight = width * 1.31,
    desktopGalleryHeight = Math.min(650, Math.max(500, width * 0.46)),
    soldOut = raw.variants.length
      ? raw.variants.every((v) => v.stock < 1)
      : p.stock < 1,
    available = raw.variants.length
      ? !!variant && variant.stock > 0
      : p.stock > 0;
  const add = async () => {
    if (raw.variants.length && !variant) {
      setNotice(
        `Please select ${optionTitle.toLowerCase()} before adding to cart.`,
      );
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await cart.addItem(p, {
        variantId: variant?.id,
        variantLabel: variant ? `${variant.name}: ${variant.value}` : undefined,
        quantity: qty,
      });
      setAdded(true);
    } catch (e: any) {
      setNotice(e.message || "Could not add this item. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const help = (section: string) =>
    router.push({ pathname: "/help", params: { section } });
  if (isDesktop) {
    const activeImage = images[Math.min(slide, Math.max(images.length - 1, 0))];
    const priceReduced = p.originalPrice > p.price;
    const actionLabel = busy
      ? "ADDING…"
      : soldOut
        ? "OUT OF STOCK"
        : added
          ? "GO TO BAG"
          : raw.variants.length && !variant
            ? `SELECT ${optionTitle.toUpperCase()}`
            : "ADD TO BAG";
    return (
      <View
        testID="product-detail"
        style={{ flex: 1, backgroundColor: c.background }}
      >
        <StoreHeader
          back
          productName={`${p.name} — ${formatPrice(p.price)} on ${store.storeName}`}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>
          <View style={s.desktopPage}>
            <Text style={[s.desktopBreadcrumb, { color: c.mutedForeground }]}>
              Home  /  {raw.category?.name || "Shop"}  /  {p.name}
            </Text>
            <View style={s.desktopTop}>
              <View style={s.desktopGalleryArea}>
                <View style={s.desktopThumbRail}>
                  {images.map((url, index) => (
                    <TouchableOpacity
                      key={url + index}
                      accessibilityRole="button"
                      accessibilityLabel={`Show product image ${index + 1}`}
                      accessibilityState={{ selected: slide === index }}
                      onPress={() => setSlide(index)}
                      style={[
                        s.desktopThumb,
                        {
                          borderColor: slide === index ? c.navy : c.border,
                          borderWidth: slide === index ? 2 : 1,
                          backgroundColor: c.muted,
                        },
                      ]}
                    >
                      <Image source={{ uri: url }} style={s.desktopThumbImage} contentFit="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[s.desktopMainImage, { height: desktopGalleryHeight, backgroundColor: c.muted }]}>
                  {activeImage ? (
                    <Image source={{ uri: activeImage }} style={s.desktopImage} contentFit="cover" transition={140} />
                  ) : (
                    <View style={s.emptyImage}>
                      <Icon name="image-outline" size={54} color={c.mutedForeground} />
                      <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 10 }}>Product image coming soon</Text>
                    </View>
                  )}
                  {images.length > 1 && (
                    <>
                      <TouchableOpacity
                        accessibilityLabel="Previous image"
                        onPress={() => setSlide((slide - 1 + images.length) % images.length)}
                        style={[s.desktopImgArrow, { left: 12 }]}
                      >
                        <Icon name="chevron-back" size={18} color={c.navy} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel="Next image"
                        onPress={() => setSlide((slide + 1) % images.length)}
                        style={[s.desktopImgArrow, { right: 12 }]}
                      >
                        <Icon name="chevron-forward" size={18} color={c.navy} />
                      </TouchableOpacity>
                      <Text style={[s.desktopImageCount, { color: c.navy }]}>
                        {slide + 1} / {images.length}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <View style={[s.desktopPurchase, { backgroundColor: c.card }]}>
                {!!p.seller && <Text style={[s.desktopSeller, { color: c.goldMuted }]}>{p.seller}</Text>}
                <Text style={[s.desktopProductName, { color: c.foreground }]}>{p.name}</Text>
                {p.reviewCount > 0 && (
                  <View style={s.desktopRating}>
                    <View style={[s.desktopRatingPill, { backgroundColor: c.success }]}>
                      <Text style={s.desktopRatingText}>{p.rating.toFixed(1)} ★</Text>
                    </View>
                    <Text style={[s.desktopRatingCount, { color: c.mutedForeground }]}>{p.reviewCount} Ratings</Text>
                  </View>
                )}
                <View style={s.desktopPriceRow}>
                  <Text style={[s.desktopPrice, { color: c.foreground }]}>{formatPrice(p.price)}</Text>
                  {priceReduced && (
                    <Text style={[s.desktopOriginalPrice, { color: c.mutedForeground }]}>
                      MRP {formatPrice(p.originalPrice)}
                    </Text>
                  )}
                  {priceReduced && <Text style={[s.desktopDiscount, { color: c.gold }]}>({p.discount}% OFF)</Text>}
                </View>
                <Text style={[s.desktopTax, { color: c.mutedForeground }]}>Price inclusive of all taxes</Text>
                {offer && (
                  <TouchableOpacity
                    onPress={() => setSheet("offers")}
                    style={[s.desktopOffer, { borderColor: c.goldLine, backgroundColor: "#FDFBF6" }]}
                  >
                    <View style={[s.desktopOfferBadge, { backgroundColor: c.gold }]}>
                      <Text style={s.desktopOfferBadgeText}>{offer.code}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.desktopOfferTitle, { color: c.foreground }]}>
                        Get it for {formatPrice(offerPrice(p.price, offer))}
                      </Text>
                      <Text numberOfLines={1} style={[s.desktopOfferText, { color: c.mutedForeground }]}>
                        {offerTerms(offer)}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color={c.gold} />
                  </TouchableOpacity>
                )}
                {color && (
                  <View style={s.desktopOptionBlock}>
                    <Text style={[s.desktopLabel, { color: c.foreground }]}>Colour: <Text style={{ fontFamily: "GoogleSans_400Regular" }}>{color}</Text></Text>
                    {images[0] && (
                      <TouchableOpacity onPress={() => setSlide(0)} style={[s.desktopColourPreview, { borderColor: c.navy }]}>
                        <Image source={{ uri: images[0] }} style={s.desktopColourImage} contentFit="cover" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {raw.variants.length > 0 && (
                  <View style={s.desktopOptionBlock}>
                    <View style={s.desktopOptionHeading}>
                      <Text style={[s.desktopLabel, { color: c.foreground }]}>Select {optionTitle}</Text>
                      {sizeGuide.length > 0 && <TouchableOpacity onPress={() => setSheet("guide")}><Text style={[s.desktopGuide, { color: c.link }]}>Check Size Chart</Text></TouchableOpacity>}
                    </View>
                    <View style={s.desktopOptions}>
                      {raw.variants.map((v) => {
                        const isSelected = v.id === variantId;
                        return (
                          <TouchableOpacity
                            key={v.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected, disabled: v.stock < 1 }}
                            disabled={v.stock < 1}
                            onPress={() => { setVariantId(v.id); setQty((current) => Math.max(1, Math.min(current, v.stock))); setNotice(""); }}
                            style={[
                              s.desktopOption,
                              {
                                borderColor: isSelected ? c.navy : c.border,
                                backgroundColor: isSelected ? c.navy : "#FFFFFF",
                                opacity: v.stock < 1 ? 0.35 : 1,
                              },
                            ]}
                          >
                            <Text style={[s.desktopOptionText, { color: isSelected ? "#FFFFFF" : c.foreground }]}>
                              {names.length > 1 ? `${v.name}: ` : ""}{v.value}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
                <View style={[s.desktopDelivery, { borderTopColor: c.border, borderBottomColor: c.border }]}>
                  <Icon name="location-outline" size={19} color={c.navy} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.desktopDeliveryTitle, { color: c.foreground }]}>{address ? `Deliver to ${address.pincode}, ${address.city}` : "Select delivery pincode"}</Text>
                    <Text style={[s.desktopDeliveryText, { color: c.mutedForeground }]}>{store.returnsHeadline} · Cash on delivery available</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/addresses")}><Text style={[s.desktopGuide, { color: c.link }]}>{address ? "Change" : "Add"}</Text></TouchableOpacity>
                </View>
                <View style={s.desktopQtyRow}>
                  <Text style={[s.desktopLabel, { color: c.foreground }]}>Quantity</Text>
                  <View style={[s.stepper, { borderColor: c.border }]}>
                    <TouchableOpacity disabled={qty <= 1} onPress={() => setQty((current) => current - 1)} style={[s.step, { backgroundColor: c.muted, opacity: qty <= 1 ? 0.4 : 1 }]}><Icon name="remove" size={17} /></TouchableOpacity>
                    <Text style={{ fontSize: 13, width: 33, textAlign: "center", color: c.foreground }}>{qty}</Text>
                    <TouchableOpacity disabled={qty >= Math.min(p.stock || 1, 99)} onPress={() => setQty((current) => current + 1)} style={[s.step, { backgroundColor: c.muted }]}><Icon name="add" size={17} /></TouchableOpacity>
                  </View>
                </View>
                {!!notice && <Text accessibilityRole="alert" style={{ color: c.destructive, fontSize: 12, marginBottom: 11 }}>{notice}</Text>}
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={busy || soldOut}
                  onPress={() => (added ? router.push("/(tabs)/cart") : void add())}
                  style={[s.desktopAdd, { backgroundColor: c.gold, opacity: soldOut ? 0.42 : 1 }]}
                >
                  <Icon name={added ? "bag-check-outline" : "bag-handle-outline"} size={18} color="#FFFFFF" />
                  <Text style={[s.desktopAddText, { color: "#FFFFFF" }]}>{actionLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: wish.isInWishlist(p.id) }}
                  onPress={() => wish.toggle(base)}
                  style={[s.desktopWish, { borderColor: c.navy }]}
                >
                  <Icon name={wish.isInWishlist(p.id) ? "heart" : "heart-outline"} size={18} color={wish.isInWishlist(p.id) ? c.crimson : c.navy} />
                  <Text style={[s.desktopWishText, { color: c.navy }]}>{wish.isInWishlist(p.id) ? "SAVED TO WISHLIST" : "SAVE TO WISHLIST"}</Text>
                </TouchableOpacity>
                <View style={s.desktopProductDetailsInline}>
                  <Text style={[s.desktopSectionTitle, { color: c.navy }]}>Product Details</Text>
                  <Text style={[s.desktopDescription, { color: c.mutedForeground }]}>{p.description || "Product details will be added soon."}</Text>
                  {!!Object.keys(p.specifications).length && (
                    <View style={s.desktopSpecs}>
                      {Object.entries(p.specifications).map(([key, value]) => (
                        <View key={key} style={[s.desktopSpec, { borderColor: c.border }]}>
                          <Text style={[s.desktopSpecKey, { color: c.mutedForeground }]}>{key}</Text>
                          <Text style={[s.desktopSpecValue, { color: c.foreground }]}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={[s.desktopTrust, { borderColor: c.border, backgroundColor: "#FAFAFA" }]}>
              {[
                ["return-down-back-outline", "EASY EXCHANGE", "Clear return & exchange support for eligible orders"],
                ["shield-checkmark-outline", "100% HANDPICKED", "Curated brands & protected payment checkout"],
                ["car-outline", "ASSURED DELIVERY", "Track your order from dispatch to doorstep"],
              ].map(([icon, title, copy]) => (
                <View key={title} style={s.desktopTrustItem}>
                  <Icon name={icon as any} size={24} color={c.navy} />
                  <View>
                    <Text style={[s.desktopTrustTitle, { color: c.navy }]}>{title}</Text>
                    <Text style={[s.desktopTrustCopy, { color: c.mutedForeground }]}>{copy}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={s.desktopBelow}>
              <View style={[s.desktopReviewBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[s.desktopSectionTitle, { color: c.navy }]}>Customer Ratings &amp; Reviews</Text>
                <View style={s.desktopReviewSummary}>
                  <Text style={[s.desktopReviewScore, { color: c.navy }]}>{p.rating ? p.rating.toFixed(1) : "—"}</Text>
                  <Icon name="star" size={24} color={c.star} />
                  <Text style={[s.desktopReviewCount, { color: c.mutedForeground }]}>{p.reviewCount ? `${p.reviewCount} verified customer ratings` : "No ratings yet"}</Text>
                </View>
                {raw.reviews?.slice(0, 3).map((review) => (
                  <View key={review.id} style={[s.desktopReview, { borderColor: c.border }]}>
                    <Text style={[s.desktopReviewTitle, { color: c.foreground }]}>{review.rating}/5 · {review.title}</Text>
                    <Text style={[s.desktopReviewText, { color: c.mutedForeground }]}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            </View>
            {related.length > 0 && (
              <View style={s.desktopRelated}>
                <View style={s.desktopRelatedTitleRow}>
                  <Text style={[s.desktopSectionTitle, { color: c.navy }]}>SIMILAR STYLES</Text>
                  <TouchableOpacity onPress={() => router.push("/products")}>
                    <Text style={[s.desktopGuide, { color: c.gold }]}>VIEW ALL ›</Text>
                  </TouchableOpacity>
                </View>
                <ProductGrid products={related.slice(0, 4).map(mapApiProduct)} columns={4} desktop />
              </View>
            )}
          </View>
          <DesktopStoreFooter />
        </ScrollView>
      </View>
    );
  }
  return (
    <View
      testID="product-detail"
      style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}
    >
      <StoreHeader
        back
        productName={`${p.name} — ${formatPrice(p.price)} on ${store.storeName}`}
        onMore={() => setSheet("more")}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 14 }}
      >
        <View style={{ height: galleryHeight, backgroundColor: c.muted }}>
          <ScrollView
            ref={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setSlide(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {images.map((url, i) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Open product image ${i + 1}`}
                key={url + i}
                activeOpacity={0.95}
                onPress={() => {
                  setPhotoIndex(i);
                  setPhotoOpen(true);
                }}
              >
                <Image
                  source={{ uri: url }}
                  style={{ width, height: galleryHeight }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!images.length && (
            <View style={s.emptyImage}>
              <Icon name="image-outline" size={50} color={c.mutedForeground} />
              <Text
                style={{
                  color: c.mutedForeground,
                  fontSize: 12,
                  marginTop: 10,
                }}
              >
                Product image coming soon
              </Text>
            </View>
          )}
          {images.length > 1 && (
            <TouchableOpacity
              accessibilityLabel="Open product gallery"
              onPress={() => {
                setPhotoIndex(slide);
                setPhotoOpen(true);
              }}
              style={s.galleryButton}
            >
              <Icon name="copy-outline" size={21} color="#111" />
            </TouchableOpacity>
          )}
          {images.length > 0 && (
            <View style={s.counter}>
              <Text style={{ color: "#fff", fontSize: 13 }}>
                {slide + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>
        <View style={s.info}>
          <View style={s.priceLine}>
            <Text
              style={{
                color: c.accent,
                fontSize: 21,
                fontFamily: "GoogleSans_700Bold",
              }}
            >
              {formatPrice(p.price)}
            </Text>
            {p.originalPrice > p.price && (
              <Text
                style={{
                  fontSize: 12,
                  color: c.mutedForeground,
                  textDecorationLine: "line-through",
                }}
              >
                {formatPrice(p.originalPrice)}
              </Text>
            )}
            <Text style={{ color: c.mutedForeground, fontSize: 10 }}>
              Price inclusive of all taxes
            </Text>
          </View>
          {offer && (
            <View style={s.offerBlock}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={{
                    color: c.accent,
                    fontSize: 14,
                    fontFamily: "GoogleSans_600SemiBold",
                  }}
                >
                  Offer Price {formatPrice(offerPrice(p.price, offer))}*
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Offer terms for ${offer.code}`}
                  onPress={() => setSheet("offers")}
                  style={[s.code, { borderColor: c.accent }]}
                >
                  <Text
                    style={{
                      color: c.accent,
                      fontSize: 12,
                      fontFamily: "GoogleSans_600SemiBold",
                    }}
                  >
                    {offer.code}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: c.mutedForeground,
                  lineHeight: 17,
                  marginTop: 8,
                }}
              >
                {offerTerms(offer)}{" "}
                <Text
                  onPress={() => setSheet("offers")}
                  style={{ color: c.link }}
                >
                  T&C
                </Text>
              </Text>
              {offers.length > 1 && (
                <TouchableOpacity
                  onPress={() => setSheet("offers")}
                  style={s.moreOffers}
                >
                  <Text style={{ fontSize: 11, color: "#A7662C" }}>
                    +{offers.length - 1} more offers ›
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <Text style={[s.productName, { color: c.foreground }]}>{p.name}</Text>
          {p.reviewCount > 0 && (
            <View
              style={{
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Icon name="star" color={c.star} size={12} />
              <Text style={{ fontSize: 10, color: c.mutedForeground }}>
                {p.rating.toFixed(1)} · {p.reviewCount}{" "}
                {p.reviewCount === 1 ? "rating" : "ratings"}
              </Text>
            </View>
          )}
          {color && (
            <View style={{ marginTop: 19 }}>
              <Text style={[s.label, { color: c.foreground }]}>
                Color: {color}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View color photo"
                onPress={() => {
                  gallery.current?.scrollTo({ x: 0, animated: true });
                  setSlide(0);
                  setPhotoIndex(0);
                  setPhotoOpen(true);
                }}
                style={{
                  alignSelf: "flex-start",
                  borderWidth: 1,
                  borderColor: c.foreground,
                  marginTop: 10,
                }}
                disabled={!images.length}
              >
                {images[0] && (
                  <Image
                    source={{ uri: images[0] }}
                    style={{ width: 41, height: 54 }}
                    contentFit="cover"
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
          {raw.variants.length > 0 && (
            <View style={{ marginTop: 22 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 13,
                }}
              >
                <Text style={[s.label, { color: c.foreground }]}>
                  {optionTitle}
                </Text>
                {sizeGuide.length > 0 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setSheet("guide")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="resize-outline" color={c.link} size={13} />
                    <Text style={{ color: c.link, fontSize: 12 }}>
                      Size Guide ›
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {raw.variants.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${v.name} ${v.value}${v.stock < 1 ? ", unavailable" : ""}`}
                    accessibilityState={{
                      selected: v.id === variantId,
                      disabled: v.stock < 1,
                    }}
                    disabled={v.stock < 1}
                    onPress={() => {
                      setVariantId(v.id);
                      setQty((q) => Math.max(1, Math.min(q, v.stock)));
                      setNotice("");
                    }}
                    style={[
                      s.option,
                      {
                        borderColor:
                          v.id === variantId ? c.foreground : c.border,
                        borderStyle: v.stock < 1 ? "dashed" : "solid",
                        opacity: v.stock < 1 ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: c.foreground, fontSize: 12 }}>
                      {names.length > 1 ? `${v.name}: ` : ""}
                      {v.value}
                    </Text>
                    {v.stock > 0 && v.stock <= 5 && (
                      <Text style={{ fontSize: 9, color: "#B87540" }}>
                        Almost sold out!
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={s.quantity}>
            <Text style={[s.label, { color: c.foreground }]}>Qty</Text>
            <View style={[s.stepper, { borderColor: c.border }]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                disabled={qty <= 1}
                onPress={() => setQty((q) => q - 1)}
                style={[
                  s.step,
                  { backgroundColor: c.muted, opacity: qty <= 1 ? 0.4 : 1 },
                ]}
              >
                <Icon name="remove" size={18} />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 13,
                  width: 31,
                  textAlign: "center",
                  color: c.foreground,
                }}
              >
                {qty}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                disabled={qty >= Math.min(p.stock || 1, 99)}
                onPress={() => setQty((q) => q + 1)}
                style={[s.step, { backgroundColor: c.muted }]}
              >
                <Icon name="add" size={18} />
              </TouchableOpacity>
            </View>
            {!raw.variants.length && p.stock < 1 && (
              <Text style={{ color: c.destructive, fontSize: 11 }}>
                Out of stock
              </Text>
            )}
          </View>
          {!!notice && (
            <Text
              accessibilityRole="alert"
              style={{ color: c.destructive, fontSize: 12, marginTop: 12 }}
            >
              {notice}
            </Text>
          )}
        </View>
        <View style={[s.trust, { borderColor: c.muted }]}>
          {[
            {
              icon: "ribbon-outline",
              label: "Product details",
              press: () => setSheet("details"),
            },
            {
              icon: "return-down-back-outline",
              label: "Easy Returns",
              press: () => help("returns"),
            },
            {
              icon: "car-outline",
              label: "Free Shipping*",
              press: () => help("shipping"),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.press}
              style={{ flex: 1, alignItems: "center", gap: 10 }}
            >
              <Icon name={item.icon as any} size={23} />
              <Text style={{ color: c.foreground, fontSize: 11 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[s.delivery, { borderColor: c.muted }]}>
          <Text style={[s.heading, { color: c.foreground }]}>
            Delivery & Return Details
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change delivery address"
            onPress={() => router.push("/addresses")}
            style={[s.address, { borderColor: c.border }]}
          >
            <Text
              style={{
                color: address ? c.foreground : c.mutedForeground,
                fontSize: 12,
                flex: 1,
              }}
            >
              {address
                ? `${address.pincode} · ${address.city}`
                : "Select a delivery address"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "GoogleSans_600SemiBold",
                color: c.link,
              }}
            >
              {address ? "Change" : "Add"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => help("returns")}
            style={[s.detailRow, { borderColor: c.border }]}
          >
            <Icon name="return-down-back-outline" size={22} />
            <View>
              <Text style={[s.label, { color: c.foreground }]}>
                {store.returnsHeadline}
              </Text>
              <Text style={{ fontSize: 11, color: c.link, marginTop: 4 }}>
                Return Policies
              </Text>
            </View>
          </TouchableOpacity>
          <View style={[s.detailRow, { borderColor: "transparent" }]}>
            <Icon name="cash-outline" size={22} />
            <Text style={[s.label, { color: c.foreground }]}>
              Cash on Delivery Available
            </Text>
          </View>
        </View>
        <View style={[s.description, { borderColor: c.muted }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Product description"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
          >
            <Text style={[s.label, { color: c.foreground }]}>Description</Text>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: c.mutedForeground,
                fontSize: 11,
                textAlign: "right",
              }}
            >
              {Object.values(p.specifications).slice(0, 3).join(", ") ||
                p.description}
            </Text>
            <Icon
              name={expanded ? "chevron-up" : "chevron-forward"}
              size={17}
            />
          </TouchableOpacity>
          {expanded && (
            <View style={{ paddingTop: 14 }}>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 20,
                  color: c.mutedForeground,
                }}
              >
                {p.description || "Product details will be added soon."}
              </Text>
              {Object.entries(p.specifications).map(([k, v]) => (
                <View key={k} style={[s.spec, { borderColor: c.border }]}>
                  <Text
                    style={{ fontSize: 12, color: c.mutedForeground, flex: 1 }}
                  >
                    {k}
                  </Text>
                  <Text style={{ fontSize: 12, color: c.foreground, flex: 1 }}>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {raw.reviews && raw.reviews.length > 0 && (
          <View style={[s.description, { borderColor: c.muted }]}>
            <Text style={[s.heading, { color: c.foreground }]}>
              Customer reviews
            </Text>
            {raw.reviews.map((r) => (
              <View key={r.id} style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "GoogleSans_600SemiBold",
                    color: c.foreground,
                  }}
                >
                  {r.rating}/5 {r.title}
                </Text>
                <Text
                  style={{
                    color: c.mutedForeground,
                    fontSize: 12,
                    lineHeight: 18,
                    marginTop: 4,
                  }}
                >
                  {r.comment}
                </Text>
              </View>
            ))}
          </View>
        )}
        {related.length > 0 && (
          <View style={{ padding: 6 }}>
            <Text
              style={[
                s.heading,
                { color: c.foreground, padding: 7, paddingVertical: 14 },
              ]}
            >
              You May Also Like
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 7,
                marginBottom: 12,
              }}
            >
              {color && (
                <View style={{ backgroundColor: c.primary, padding: 10 }}>
                  <Text style={{ fontSize: 11, color: c.primaryForeground }}>
                    Colour: {color}
                  </Text>
                </View>
              )}
              {p.seller && (
                <View style={{ backgroundColor: c.muted, padding: 10 }}>
                  <Text style={{ fontSize: 11, color: c.foreground }}>
                    {p.seller}
                  </Text>
                </View>
              )}
            </View>
            <ProductGrid products={related.map(mapApiProduct)} />
          </View>
        )}
      </ScrollView>
      <View
        style={[
          s.bottom,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Save product to wishlist"
          accessibilityState={{ selected: wish.isInWishlist(p.id) }}
          onPress={() => wish.toggle(base)}
          style={[s.wishlist, { borderColor: c.border }]}
        >
          <Icon
            name={wish.isInWishlist(p.id) ? "heart" : "heart-outline"}
            size={23}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={added ? "View cart" : "Add to cart"}
          disabled={busy || soldOut}
          onPress={() => (added ? router.push("/(tabs)/cart") : void add())}
          style={[
            s.add,
            {
              backgroundColor: c.primary,
              opacity: soldOut ? 0.4 : 1,
            },
          ]}
        >
          <Icon
            name={added ? "checkmark" : "cart-outline"}
            color={c.primaryForeground}
            size={22}
          />
          <Text
            style={{
              fontSize: 14,
              color: c.primaryForeground,
              fontFamily: "GoogleSans_600SemiBold",
            }}
          >
            {busy
              ? "Adding…"
              : soldOut
                ? "Out of Stock"
                : added
                  ? "Added to Cart"
                  : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={photoOpen}
        animationType="fade"
        onRequestClose={() => setPhotoOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#080808",
            paddingTop: insets.top,
          }}
        >
          <View
            style={{
              height: 50,
              paddingHorizontal: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 13, color: "#fff" }}>
              {photoIndex + 1} / {images.length}
            </Text>
            <TouchableOpacity
              accessibilityLabel="Close product gallery"
              onPress={() => setPhotoOpen(false)}
            >
              <Icon name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            contentOffset={{ x: photoIndex * width, y: 0 }}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {images.map((url, i) => (
              <View key={url + i} style={{ width, justifyContent: "center" }}>
                <Image
                  source={{ uri: url }}
                  style={{ width, height: galleryHeight }}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <Pressable
          onPress={() => setSheet(null)}
          style={[s.overlay, { backgroundColor: c.overlay }]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              s.sheet,
              {
                backgroundColor: c.card,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <Text style={[s.heading, { color: c.foreground }]}>
                {sheet === "offers"
                  ? "Available offers"
                  : sheet === "guide"
                    ? "Size Guide"
                    : sheet === "more"
                      ? "Product options"
                      : "Product details"}
              </Text>
              <TouchableOpacity
                accessibilityLabel="Close product options"
                onPress={() => setSheet(null)}
              >
                <Icon name="close" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {sheet === "offers" ? (
                offers.length ? (
                  offers.map((o) => (
                    <View
                      key={o.id}
                      style={[s.offerCard, { borderColor: c.border }]}
                    >
                      <Text
                        style={{
                          color: c.accent,
                          fontFamily: "GoogleSans_700Bold",
                          fontSize: 15,
                        }}
                      >
                        {o.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: c.mutedForeground,
                          lineHeight: 19,
                          marginTop: 8,
                        }}
                      >
                        {offerTerms(o)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSheet(null);
                          router.push({
                            pathname: "/(tabs)/cart",
                            params: { coupon: o.code },
                          });
                        }}
                        style={{ alignSelf: "flex-start", marginTop: 12 }}
                      >
                        <Text style={{ color: c.link, fontSize: 12 }}>
                          Use at checkout ›
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: c.mutedForeground }}>
                    No active offers right now.
                  </Text>
                )
              ) : sheet === "more" ? (
                <>
                  {[
                    {
                      label: wish.isInWishlist(p.id)
                        ? "Remove from wishlist"
                        : "Save to wishlist",
                      press: () => {
                        wish.toggle(base);
                        setSheet(null);
                      },
                    },
                    {
                      label: "View all offers",
                      press: () => setSheet("offers"),
                    },
                    {
                      label: "Customer care",
                      press: () => {
                        setSheet(null);
                        help("support");
                      },
                    },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={item.press}
                      style={{
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderColor: c.border,
                      }}
                    >
                      <Text style={{ color: c.foreground, fontSize: 14 }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      lineHeight: 21,
                    }}
                  >
                    {sheet === "guide"
                      ? "Measurements and fit information supplied for this product."
                      : p.description}
                  </Text>
                  {(sheet === "guide"
                    ? sizeGuide
                    : Object.entries(p.specifications)
                  ).map(([k, v]) => (
                    <View key={k} style={[s.spec, { borderColor: c.border }]}>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontSize: 12,
                          flex: 1,
                        }}
                      >
                        {k}
                      </Text>
                      <Text
                        style={{ color: c.foreground, fontSize: 12, flex: 1 }}
                      >
                        {v}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  desktopPage: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 42,
  },
  desktopBreadcrumb: { fontSize: 11, letterSpacing: 0.2, marginBottom: 19 },
  desktopTop: { flexDirection: "row", alignItems: "flex-start", gap: 40 },
  desktopGalleryArea: { flex: 1, minWidth: 0, flexDirection: "row", gap: 16 },
  desktopThumbRail: { width: 74, gap: 12 },
  desktopThumb: { width: 74, height: 92, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  desktopThumbImage: { width: "100%", height: "100%" },
  desktopMainImage: { flex: 1, minWidth: 0, position: "relative", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  desktopImage: { width: "100%", height: "100%" },
  desktopImgArrow: { position: "absolute", top: "50%", marginTop: -18, width: 34, height: 36, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center" },
  desktopImageCount: { position: "absolute", right: 14, bottom: 13, fontSize: 11, fontFamily: "GoogleSans_600SemiBold", backgroundColor: "#FFFFFFE6", paddingHorizontal: 10, paddingVertical: 4 },
  desktopPurchase: { width: 410, flexShrink: 0, paddingHorizontal: 8 },
  desktopSeller: { fontSize: 12.5, letterSpacing: 0.9, textTransform: "uppercase", fontFamily: "GoogleSans_700Bold" },
  desktopProductName: { fontSize: 20, lineHeight: 28, fontFamily: "GoogleSans_500Medium", marginTop: 6 },
  desktopRating: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  desktopRatingPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  desktopRatingText: { color: "#fff", fontSize: 11, fontFamily: "GoogleSans_700Bold" },
  desktopRatingCount: { fontSize: 12 },
  desktopPriceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 9, marginTop: 18 },
  desktopPrice: { fontSize: 24, fontFamily: "GoogleSans_700Bold" },
  desktopOriginalPrice: { fontSize: 13, textDecorationLine: "line-through" },
  desktopDiscount: { fontSize: 13, fontFamily: "GoogleSans_700Bold" },
  desktopTax: { fontSize: 11, marginTop: 4 },
  desktopOffer: { marginTop: 18, borderWidth: 1, borderStyle: "dashed", padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  desktopOfferBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  desktopOfferBadgeText: { color: "#FFFFFF", fontSize: 11, fontFamily: "GoogleSans_700Bold", letterSpacing: 0.6 },
  desktopOfferTitle: { fontSize: 13, fontFamily: "GoogleSans_700Bold" },
  desktopOfferText: { fontSize: 11, marginTop: 3 },
  desktopOptionBlock: { marginTop: 20 },
  desktopOptionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  desktopLabel: { fontSize: 12.5, fontFamily: "GoogleSans_700Bold" },
  desktopColourPreview: { width: 52, height: 64, borderWidth: 1.5, marginTop: 8 },
  desktopColourImage: { width: "100%", height: "100%" },
  desktopGuide: { fontSize: 11.5, fontFamily: "GoogleSans_600SemiBold" },
  desktopOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  desktopOption: { minWidth: 46, minHeight: 38, borderWidth: 1, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  desktopOptionText: { fontSize: 12, fontFamily: "GoogleSans_600SemiBold" },
  desktopDelivery: { marginTop: 22, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  desktopDeliveryTitle: { fontSize: 12, fontFamily: "GoogleSans_600SemiBold" },
  desktopDeliveryText: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  desktopQtyRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 18, marginBottom: 16 },
  desktopAdd: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  desktopAddText: { fontSize: 13, fontFamily: "GoogleSans_700Bold", textTransform: "uppercase", letterSpacing: 1 },
  desktopWish: { height: 44, marginTop: 10, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  desktopWishText: { fontSize: 12, letterSpacing: 0.9, fontFamily: "GoogleSans_700Bold" },
  desktopProductDetailsInline: { marginTop: 26, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#E6E7E8" },
  desktopTrust: { minHeight: 96, marginTop: 36, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 26, gap: 28 },
  desktopTrustItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  desktopTrustTitle: { fontSize: 12, letterSpacing: 0.6, fontFamily: "GoogleSans_700Bold" },
  desktopTrustCopy: { fontSize: 11, lineHeight: 15, marginTop: 3, maxWidth: 200 },
  desktopBelow: { marginTop: 28 },
  desktopDetails: { flex: 1.35, minWidth: 0, borderWidth: 1, padding: 21 },
  desktopReviewBox: { borderWidth: 1, padding: 22 },
  desktopSectionTitle: { fontSize: 16, letterSpacing: 0.6, fontFamily: "GoogleSans_700Bold" },
  desktopDescription: { fontSize: 12.5, lineHeight: 20, marginTop: 10 },
  desktopSpecs: { marginTop: 14 },
  desktopSpec: { minHeight: 36, flexDirection: "row", alignItems: "center", borderTopWidth: 1, gap: 18 },
  desktopSpecKey: { width: "40%", fontSize: 11.5 },
  desktopSpecValue: { flex: 1, fontSize: 11.5, fontFamily: "GoogleSans_600SemiBold" },
  desktopReviewSummary: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  desktopReviewScore: { fontSize: 28, fontFamily: "GoogleSans_700Bold" },
  desktopReviewCount: { fontSize: 12, marginLeft: 4 },
  desktopReview: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  desktopReviewTitle: { fontSize: 12, fontFamily: "GoogleSans_600SemiBold" },
  desktopReviewText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  desktopRelated: { marginTop: 42 },
  desktopRelatedTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  emptyImage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryButton: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    right: 13,
    bottom: 12,
    backgroundColor: "#0008",
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  info: { paddingHorizontal: 13, paddingTop: 13, paddingBottom: 20 },
  priceLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flexWrap: "wrap",
  },
  offerBlock: { marginTop: 21, marginBottom: 20 },
  code: {
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  moreOffers: {
    borderWidth: 1,
    borderColor: "#BB804C",
    alignSelf: "flex-start",
    padding: 4,
    marginTop: 9,
  },
  productName: {
    fontSize: 14,
    fontFamily: "GoogleSans_700Bold",
    lineHeight: 21,
    marginTop: 16,
  },
  label: { fontSize: 13, fontFamily: "GoogleSans_600SemiBold" },
  heading: { fontSize: 15, fontFamily: "GoogleSans_700Bold" },
  option: {
    borderWidth: 1,
    borderRadius: 20,
    minWidth: 47,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 22,
  },
  stepper: {
    borderWidth: 1,
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  step: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  trust: {
    borderTopWidth: 8,
    borderBottomWidth: 8,
    paddingVertical: 22,
    flexDirection: "row",
  },
  delivery: { borderBottomWidth: 8, padding: 13, paddingTop: 20 },
  address: {
    marginTop: 16,
    marginBottom: 11,
    borderWidth: 1,
    height: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  description: { padding: 14, paddingVertical: 18, borderBottomWidth: 8 },
  spec: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bottom: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 10,
  },
  wishlist: {
    width: 48,
    height: 43,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  add: {
    height: 43,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "78%",
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  offerCard: { padding: 15, borderWidth: 1, marginBottom: 12 },
});
