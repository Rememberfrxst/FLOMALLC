import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "./Text";
import { Icon } from "./StoreIcon";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useOffers, bestOffer, offerPrice } from "@/hooks/useOffers";
import { Product, formatPrice } from "@/constants/data";

interface Props {
  product: Product;
  onPress: () => void;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
  style?: object;
  compact?: boolean;
  desktop?: boolean;
}

export default function ProductCard({
  product: p,
  onPress,
  isWishlisted,
  onWishlistToggle,
  style,
  compact = false,
  desktop = false,
}: Props) {
  const c = useColors();
  const cart = useCart();
  const offers = useOffers();
  const offer = bestOffer(p.price, offers);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setFailed(false), [p.image]);

  const quickAdd = async () => {
    if (p.variantCount) {
      onPress();
      return;
    }
    setBusy(true);
    setError("");
    try {
      await cart.addItem(p);
      setAdded(true);
    } catch (e: any) {
      setError(e.message || "Could not add item");
    } finally {
      setBusy(false);
    }
  };

  if (desktop) {
    const discountedOffer =
      offer && offerPrice(p.price, offer) < p.price
        ? offerPrice(p.price, offer)
        : null;

    return (
      <View style={[s.desktopCard, { backgroundColor: c.card }, style]}>
        <View style={[s.desktopPhoto, { backgroundColor: c.muted }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`View ${p.name}`}
            onPress={onPress}
            activeOpacity={0.94}
            style={StyleSheet.absoluteFill}
          >
            {p.image && !failed ? (
              <Image
                source={p.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={120}
                onError={() => setFailed(true)}
              />
            ) : (
              <View style={s.placeholder}>
                <Icon name="shirt-outline" size={38} color={c.mutedForeground} />
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 11, color: c.mutedForeground, marginTop: 6, paddingHorizontal: 12 }}
                >
                  {p.seller || "FLOMA"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {p.rating > 0 && (
            <View style={s.desktopRatingPill}>
              <Text style={s.desktopRatingText}>{p.rating.toFixed(1)}</Text>
              <Icon name="star" size={10} color="#FFFFFF" />
              {p.reviewCount > 0 && (
                <Text style={s.desktopRatingDivider}>| {p.reviewCount}</Text>
              )}
            </View>
          )}

          {onWishlistToggle && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${isWishlisted ? "Remove" : "Save"} ${p.name} ${isWishlisted ? "from" : "to"} wishlist`}
              accessibilityState={{ selected: !!isWishlisted }}
              onPress={onWishlistToggle}
              style={s.desktopHeart}
            >
              <Icon
                name={isWishlisted ? "heart" : "heart-outline"}
                size={17}
                color={isWishlisted ? c.crimson : "#151515"}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              p.variantCount ? `Quick view ${p.name}` : `Add ${p.name} to bag`
            }
            disabled={busy || (!p.variantCount && p.stock < 1)}
            onPress={quickAdd}
            style={[
              s.desktopQuickBar,
              { opacity: !p.variantCount && p.stock < 1 ? 0.45 : 1 },
            ]}
          >
            <Icon
              name={added ? "checkmark" : "bag-handle-outline"}
              size={14}
              color="#FFFFFF"
            />
            <Text style={s.desktopQuickText}>
              {added
                ? "ADDED TO BAG"
                : p.variantCount
                  ? "QUICK VIEW"
                  : "ADD TO BAG"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onPress} style={s.desktopInfo}>
          <Text numberOfLines={1} style={[s.desktopBrand, { color: c.goldMuted }]}>
            {(p.seller || "FLOMA").toUpperCase()}
          </Text>
          <Text numberOfLines={1} style={[s.desktopName, { color: c.foreground }]}>
            {p.name}
          </Text>
          <View style={s.desktopPriceRow}>
            <Text style={[s.desktopPrice, { color: c.foreground }]}>
              {formatPrice(p.price)}
            </Text>
            {p.originalPrice > p.price && (
              <Text style={[s.desktopOriginal, { color: c.mutedForeground }]}>
                {formatPrice(p.originalPrice)}
              </Text>
            )}
            {p.discount > 0 && (
              <Text style={[s.desktopDiscount, { color: c.gold }]}>
                ({p.discount}% off)
              </Text>
            )}
          </View>
          {discountedOffer !== null && (
            <Text style={[s.desktopOfferLine, { color: c.success }]}>
              Offer price {formatPrice(discountedOffer)}
            </Text>
          )}
          {p.stock < 1 && !p.variantCount && (
            <Text style={[s.desktopOfferLine, { color: c.destructive }]}>
              Out of stock
            </Text>
          )}
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={[s.desktopOfferLine, { color: c.destructive }]}
            >
              {error}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const button = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        p.variantCount
          ? `Choose options for ${p.name}`
          : `Add ${p.name} to cart`
      }
      disabled={busy || (!p.variantCount && p.stock < 1)}
      onPress={quickAdd}
      style={[
        s.cart,
        {
          borderColor: compact ? "transparent" : c.foreground,
          backgroundColor: compact ? "rgba(255,255,255,.88)" : c.card,
          opacity: !p.variantCount && p.stock < 1 ? 0.4 : 1,
        },
      ]}
    >
      <Icon
        name={added ? "checkmark" : "cart-outline"}
        size={19}
        color={compact ? "#111" : c.foreground}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[s.card, { backgroundColor: c.card }, style]}>
      <View style={[s.photo, { backgroundColor: c.muted }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`View ${p.name}`}
          onPress={onPress}
          activeOpacity={0.94}
          style={StyleSheet.absoluteFill}
        >
          {p.image && !failed ? (
            <Image
              source={p.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={120}
              onError={() => setFailed(true)}
            />
          ) : (
            <View style={s.placeholder}>
              <Icon name="image-outline" size={35} color={c.mutedForeground} />
            </View>
          )}
        </TouchableOpacity>
        {onWishlistToggle && !compact && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${isWishlisted ? "Remove" : "Save"} ${p.name} ${isWishlisted ? "from" : "to"} wishlist`}
            accessibilityState={{ selected: !!isWishlisted }}
            onPress={onWishlistToggle}
            style={s.heart}
          >
            <Icon
              name={isWishlisted ? "heart" : "heart-outline"}
              size={19}
              color="#111"
            />
          </TouchableOpacity>
        )}
        {compact && <View style={s.compactButton}>{button}</View>}
      </View>
      <View
        style={[
          s.info,
          compact && { paddingHorizontal: 2, paddingVertical: 8 },
        ]}
      >
        {!compact && (
          <TouchableOpacity onPress={onPress}>
            <Text numberOfLines={2} style={[s.name, { color: c.foreground }]}>
              {p.discount > 0 && (
                <Text style={{ color: c.accent, fontSize: 10 }}>
                  -{p.discount}%{" "}
                </Text>
              )}
              {p.name}
            </Text>
          </TouchableOpacity>
        )}
        <View style={s.priceRow}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              gap: 5,
              alignItems: "baseline",
              flexWrap: "wrap",
            }}
          >
            <Text
              style={[
                s.price,
                { color: c.accent, fontSize: compact ? 16 : 17 },
              ]}
            >
              {formatPrice(p.price)}
            </Text>
            {!compact && p.originalPrice > p.price && (
              <Text
                style={{
                  fontSize: 10,
                  color: c.mutedForeground,
                  textDecorationLine: "line-through",
                }}
              >
                {formatPrice(p.originalPrice)}
              </Text>
            )}
          </View>
          {!compact && button}
        </View>
        {!compact && offer && offerPrice(p.price, offer) < p.price && (
          <Text style={{ fontSize: 10, color: "#B8753F", marginTop: 7 }}>
            Offer Price{" "}
            <Text style={{ fontFamily: "GoogleSans_600SemiBold" }}>
              {formatPrice(offerPrice(p.price, offer))}*
            </Text>
          </Text>
        )}
        {!compact && p.stock < 1 && !p.variantCount && (
          <Text
            style={{ fontSize: 10, color: c.mutedForeground, marginTop: 5 }}
          >
            Out of stock
          </Text>
        )}
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ fontSize: 10, color: c.destructive, marginTop: 5 }}
          >
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { overflow: "hidden", borderRadius: 2 },
  photo: { aspectRatio: 0.76, width: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  info: { paddingHorizontal: 5, paddingTop: 7, paddingBottom: 13 },
  name: { fontSize: 11, lineHeight: 18, minHeight: 36 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  price: { fontFamily: "GoogleSans_700Bold" },
  heart: {
    position: "absolute",
    bottom: 8,
    right: 8,
    height: 28,
    width: 28,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cart: {
    height: 27,
    minWidth: 35,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  compactButton: { position: "absolute", bottom: 10, right: 9 },

  // Ajio-style Desktop Card
  desktopCard: {
    overflow: "hidden",
    borderRadius: 0,
  },
  desktopPhoto: {
    aspectRatio: 0.78,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  desktopRatingPill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(38, 120, 74, 0.92)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  desktopRatingText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopRatingDivider: {
    color: "#E5F3EB",
    fontSize: 10,
    fontFamily: "GoogleSans_400Regular",
  },
  desktopHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  desktopQuickBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
    backgroundColor: "rgba(44, 65, 82, 0.88)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  desktopQuickText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    letterSpacing: 0.9,
    fontFamily: "GoogleSans_600SemiBold",
  },
  desktopInfo: {
    paddingTop: 11,
    paddingBottom: 10,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  desktopBrand: {
    fontSize: 11.5,
    letterSpacing: 0.65,
    fontFamily: "GoogleSans_700Bold",
    textAlign: "center",
  },
  desktopName: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
    textAlign: "center",
    fontFamily: "GoogleSans_400Regular",
  },
  desktopPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  desktopPrice: {
    fontSize: 13.5,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopOriginal: {
    fontSize: 11.5,
    textDecorationLine: "line-through",
  },
  desktopDiscount: {
    fontSize: 11.5,
    fontFamily: "GoogleSans_600SemiBold",
  },
  desktopOfferLine: {
    fontSize: 11,
    fontFamily: "GoogleSans_600SemiBold",
    marginTop: 4,
    textAlign: "center",
  },
});
