import React, { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { TextInput } from "@/components/TextInput";
import { Text } from "@/components/Text";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import SvgIcon from "@/components/SvgIcon";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCart, cartItemKey } from "@/context/CartContext";
import { formatPrice } from "@/constants/data";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import DesktopStoreHeader from "@/components/DesktopStoreHeader";
import DesktopStoreFooter from "@/components/DesktopStoreFooter";

function BackChevronIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 640 640">
      <Path
        fill={color}
        d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"
      />
    </Svg>
  );
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const desktop = useDesktopWeb();
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryFee,
    discountAmount,
    total,
    coupon,
    applyCoupon,
    removeCoupon,
    itemCount,
  } = useCart();
  const topPad = insets.top;
  const bottomPad = insets.bottom;
  const couponParams = useLocalSearchParams<{ coupon?: string }>();
  const [couponInput, setCouponInput] = useState(couponParams.coupon || "");
  useEffect(() => {
    if (couponParams.coupon) setCouponInput(couponParams.coupon);
  }, [couponParams.coupon]);
  const [couponMsg, setCouponMsg] = useState("");

  const handleApplyCoupon = async () => {
    const result = await applyCoupon(couponInput.trim());
    if (result === "valid") {
      setCouponMsg("Coupon applied!");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (result === "invalid") setCouponMsg("Invalid coupon code");
    else setCouponMsg("Coupon already applied");
  };

  const bagSavings = items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, (item.product.originalPrice - item.product.price) * item.quantity),
    0,
  );
  const totalSavings = bagSavings + discountAmount;

  if (desktop) {
    return (
      <View testID="cart-screen" style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DesktopStoreHeader />
          <View style={styles.desktopWrap}>
            {items.length === 0 ? (
              <View style={[styles.desktopEmpty, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                  <SvgIcon name="bag-outline" size={44} color={colors.navy} />
                </View>
                <Text style={[styles.desktopEmptyTitle, { color: colors.foreground }]}>
                  Your Shopping Bag is Empty
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                  Discover new arrivals, curated edits and exclusive offers on FLOMA.
                </Text>
                <View style={styles.desktopEmptyActions}>
                  <TouchableOpacity
                    style={[styles.desktopGoldBtn, { backgroundColor: colors.gold }]}
                    onPress={() => router.push("/")}
                  >
                    <Text style={styles.desktopGoldBtnText}>CONTINUE SHOPPING</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.desktopOutlineBtn, { borderColor: colors.navy }]}
                    onPress={() => router.push("/wishlist")}
                  >
                    <Text style={[styles.desktopOutlineBtnText, { color: colors.navy }]}>
                      ADD FROM WISHLIST
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={[styles.desktopTopBar, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.desktopTitle, { color: colors.navy }]}>
                    MY BAG{" "}
                    <Text style={{ fontSize: 15, color: colors.mutedForeground, fontFamily: "GoogleSans_400Regular" }}>
                      ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/wishlist")}>
                    <Text style={[styles.desktopWishLink, { color: colors.link }]}>
                      + Add More From Wishlist
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.desktopGrid}>
                  {/* Left: Bag items */}
                  <View style={styles.desktopLeft}>
                    {items.map((item) => (
                      <View
                        key={cartItemKey(item)}
                        style={[
                          styles.desktopBagCard,
                          { borderColor: colors.border, backgroundColor: colors.card },
                        ]}
                      >
                        <TouchableOpacity onPress={() => router.push(`/product/${item.product.id}`)}>
                          <Image
                            source={item.product.image}
                            style={styles.desktopBagImage}
                            contentFit="cover"
                            transition={160}
                          />
                        </TouchableOpacity>

                        <View style={styles.desktopBagDetails}>
                          <Text style={[styles.desktopBagBrand, { color: colors.goldMuted }]}>
                            {(item.product.seller || "FLOMA").toUpperCase()}
                          </Text>
                          <TouchableOpacity onPress={() => router.push(`/product/${item.product.id}`)}>
                            <Text style={[styles.desktopBagName, { color: colors.foreground }]} numberOfLines={2}>
                              {item.product.name}
                            </Text>
                          </TouchableOpacity>
                          {!!item.variantLabel && (
                            <Text style={[styles.desktopBagMeta, { color: colors.mutedForeground }]}>
                              Option: {item.variantLabel}
                            </Text>
                          )}

                          <View style={styles.desktopQtyControls}>
                            <Text style={[styles.desktopQtyLabel, { color: colors.mutedForeground }]}>Qty:</Text>
                            <TouchableOpacity
                              style={[styles.qtyBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                              accessibilityRole="button"
                              accessibilityLabel={`Decrease quantity for ${item.variantLabel || item.product.name}`}
                              onPress={() => updateQuantity(cartItemKey(item), item.quantity - 1)}
                            >
                              <SvgIcon name="remove" size={14} color={colors.foreground} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={[styles.qtyBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                              accessibilityRole="button"
                              accessibilityLabel={`Increase quantity for ${item.variantLabel || item.product.name}`}
                              disabled={item.quantity >= item.product.stock}
                              onPress={() => updateQuantity(cartItemKey(item), item.quantity + 1)}
                            >
                              <SvgIcon name="add" size={14} color={colors.foreground} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.desktopBagActions}>
                            <TouchableOpacity onPress={() => removeItem(cartItemKey(item))}>
                              <Text style={[styles.desktopActionLink, { color: colors.link }]}>Delete</Text>
                            </TouchableOpacity>
                            <Text style={{ color: colors.border }}>|</Text>
                            <TouchableOpacity onPress={() => router.push("/wishlist")}>
                              <Text style={[styles.desktopActionLink, { color: colors.link }]}>Move to Wishlist</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.desktopBagPriceCol}>
                          <Text style={[styles.desktopBagPrice, { color: colors.foreground }]}>
                            {formatPrice(item.product.price * item.quantity)}
                          </Text>
                          {item.product.originalPrice > item.product.price && (
                            <View style={styles.desktopBagMrpRow}>
                              <Text style={[styles.itemOriginal, { color: colors.mutedForeground }]}>
                                {formatPrice(item.product.originalPrice * item.quantity)}
                              </Text>
                              <Text style={{ fontSize: 11.5, color: colors.gold, fontFamily: "GoogleSans_600SemiBold" }}>
                                ({item.product.discount}% off)
                              </Text>
                            </View>
                          )}
                          {item.product.originalPrice > item.product.price && (
                            <Text style={{ fontSize: 11, color: colors.success, marginTop: 4 }}>
                              You save {formatPrice((item.product.originalPrice - item.product.price) * item.quantity)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Right: Coupon + Order Summary */}
                  <View style={styles.desktopRight}>
                    <View
                      style={[
                        styles.desktopPanel,
                        { backgroundColor: colors.searchIvory, borderColor: colors.goldLine },
                      ]}
                    >
                      <Text style={[styles.desktopPanelTitle, { color: colors.navy }]}>
                        APPLY COUPON
                      </Text>
                      <View style={styles.couponRow}>
                        <TextInput
                          style={[
                            styles.couponInput,
                            {
                              backgroundColor: colors.card,
                              color: colors.foreground,
                              borderColor: colors.border,
                              borderRadius: 2,
                              fontFamily: "GoogleSans_400Regular",
                            },
                          ]}
                          placeholder="Enter coupon code"
                          placeholderTextColor={colors.mutedForeground}
                          value={couponInput}
                          onChangeText={setCouponInput}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity
                          style={[styles.applyBtn, { backgroundColor: colors.navy, borderRadius: 2 }]}
                          onPress={handleApplyCoupon}
                        >
                          <Text style={[styles.applyText, { color: "#FFFFFF" }]}>APPLY</Text>
                        </TouchableOpacity>
                      </View>
                      {couponMsg ? (
                        <Text
                          style={{
                            color: couponMsg.includes("applied") ? colors.success : colors.destructive,
                            fontSize: 12,
                            fontFamily: "GoogleSans_500Medium",
                            marginTop: 8,
                          }}
                        >
                          {couponMsg}
                        </Text>
                      ) : null}
                      {coupon ? (
                        <View style={styles.activeCoupon}>
                          <Text style={[styles.activeCouponText, { color: colors.success }]}>
                            Coupon "{coupon}" applied
                          </Text>
                          <TouchableOpacity onPress={removeCoupon}>
                            <SvgIcon name="close-circle" size={18} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                      <TouchableOpacity onPress={() => router.push("/offers")} style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 12, color: colors.link, fontFamily: "GoogleSans_600SemiBold" }}>
                          View available FLOMA coupons ›
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={[
                        styles.desktopPanel,
                        { backgroundColor: colors.muted, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.desktopPanelTitle, { color: colors.navy }]}>
                        ORDER DETAILS
                      </Text>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                          Bag Total
                        </Text>
                        <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                          {formatPrice(subtotal + bagSavings)}
                        </Text>
                      </View>
                      {bagSavings > 0 && (
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                            Bag Discount
                          </Text>
                          <Text style={[styles.summaryVal, { color: colors.gold }]}>
                            -{formatPrice(bagSavings)}
                          </Text>
                        </View>
                      )}
                      {discountAmount > 0 && (
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryKey, { color: colors.success }]}>
                            Coupon Savings
                          </Text>
                          <Text style={[styles.summaryVal, { color: colors.success }]}>
                            -{formatPrice(discountAmount)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>
                          Delivery Fee
                        </Text>
                        <Text
                          style={[
                            styles.summaryVal,
                            { color: deliveryFee === 0 ? colors.success : colors.foreground },
                          ]}
                        >
                          {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                        </Text>
                      </View>
                      <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />
                      <View style={styles.summaryRow}>
                        <Text style={[styles.totalKey, { color: colors.foreground }]}>Order Total</Text>
                        <Text style={[styles.totalVal, { color: colors.foreground }]}>
                          {formatPrice(total)}
                        </Text>
                      </View>
                      {totalSavings > 0 && (
                        <Text style={{ fontSize: 12, color: colors.success, marginTop: 4, fontFamily: "GoogleSans_600SemiBold" }}>
                          Total savings on this bag: {formatPrice(totalSavings)}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[styles.desktopGoldBtn, { backgroundColor: colors.gold, width: "100%", marginTop: 16 }]}
                        onPress={() => router.push("/checkout")}
                      >
                        <Text style={styles.desktopGoldBtnText}>PROCEED TO SHIPPING</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
          <DesktopStoreFooter />
        </ScrollView>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: colors.background, paddingTop: topPad + 20 },
        ]}
      >
        <View style={styles.emptyHeader}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            My Bag
          </Text>
        </View>
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <SvgIcon
              name="bag-outline"
              size={48}
              color={colors.mutedForeground}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Your bag is empty
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
          >
            Add items to start shopping
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/")}
          >
            <Text
              style={[styles.shopBtnText, { color: colors.primaryForeground }]}
            >
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      testID="cart-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <BackChevronIcon size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          My Bag ({itemCount})
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {items.map((item, idx) => (
            <View key={cartItemKey(item)}>
              {idx > 0 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
              )}
              <View style={styles.cartItem}>
                <Image
                  source={item.product.image}
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemName, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {item.product.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemSeller,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {item.variantLabel || `by ${item.product.seller}`}
                  </Text>
                  <View style={styles.itemPriceRow}>
                    <Text
                      style={[styles.itemPrice, { color: colors.foreground }]}
                    >
                      {formatPrice(item.product.price)}
                    </Text>
                    <Text
                      style={[
                        styles.itemOriginal,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {formatPrice(item.product.originalPrice)}
                    </Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease quantity for ${item.variantLabel || item.product.name}`}
                      onPress={() => {
                        updateQuantity(cartItemKey(item), item.quantity - 1);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <SvgIcon
                        name="remove"
                        size={16}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[styles.qtyText, { color: colors.foreground }]}
                    >
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase quantity for ${item.variantLabel || item.product.name}`}
                      disabled={item.quantity >= item.product.stock}
                      onPress={() => {
                        updateQuantity(cartItemKey(item), item.quantity + 1);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <SvgIcon name="add" size={16} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => {
                        removeItem(cartItemKey(item));
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                      }}
                    >
                      <SvgIcon
                        name="trash-outline"
                        size={18}
                        color={colors.destructive}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Coupon */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, marginTop: 8 },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Apply Coupon
          </Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[
                styles.couponInput,
                {
                  backgroundColor: colors.input,
                  color: colors.foreground,
                  borderColor: colors.border,
                  fontFamily: "GoogleSans_400Regular",
                },
              ]}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.mutedForeground}
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={handleApplyCoupon}
            >
              <Text
                style={[styles.applyText, { color: colors.primaryForeground }]}
              >
                Apply
              </Text>
            </TouchableOpacity>
          </View>
          {couponMsg ? (
            <Text
              style={{
                color: couponMsg.includes("applied")
                  ? colors.success
                  : colors.destructive,
                fontSize: 12,
                fontFamily: "GoogleSans_500Medium",
                marginTop: 6,
              }}
            >
              {couponMsg}
            </Text>
          ) : null}
          {coupon ? (
            <View style={styles.activeCoupon}>
              <Text
                style={[styles.activeCouponText, { color: colors.success }]}
              >
                Coupon "{coupon}" applied
              </Text>
              <TouchableOpacity onPress={removeCoupon}>
                <SvgIcon
                  name="close-circle"
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          ) : null}
          <Text style={[styles.couponHint, { color: colors.mutedForeground }]}>
            Sign in to apply a valid store coupon.
          </Text>
        </View>

        {/* Order Summary */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, marginTop: 8 },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryKey, { color: colors.mutedForeground }]}
            >
              Subtotal ({itemCount} items)
            </Text>
            <Text style={[styles.summaryVal, { color: colors.foreground }]}>
              {formatPrice(subtotal)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryKey, { color: colors.mutedForeground }]}
            >
              Delivery
            </Text>
            <Text
              style={[
                styles.summaryVal,
                {
                  color: deliveryFee === 0 ? colors.success : colors.foreground,
                },
              ]}
            >
              {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
            </Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: colors.success }]}>
                Coupon Discount
              </Text>
              <Text style={[styles.summaryVal, { color: colors.success }]}>
                -{formatPrice(discountAmount)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.border, marginVertical: 10 },
            ]}
          />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalKey, { color: colors.foreground }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalVal, { color: colors.foreground }]}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 + bottomPad }} />
      </ScrollView>

      {/* Checkout Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <View style={styles.footerInfo}>
          <Text style={[styles.footerTotal, { color: colors.foreground }]}>
            {formatPrice(total)}
          </Text>
          <Text style={[styles.footerSaved, { color: colors.success }]}>
            You save {formatPrice(discountAmount)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/checkout")}
        >
          <Text
            style={[styles.checkoutText, { color: colors.primaryForeground }]}
          >
            Proceed to Checkout
          </Text>
          <SvgIcon
            name="arrow-forward"
            size={18}
            color={colors.primaryForeground}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopWrap: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 28,
    minHeight: 520,
  },
  desktopTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 22,
  },
  desktopTitle: {
    fontSize: 20,
    letterSpacing: 1.2,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopWishLink: {
    fontSize: 13,
    fontFamily: "GoogleSans_600SemiBold",
  },
  desktopGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 28,
  },
  desktopLeft: {
    flex: 1,
    gap: 14,
  },
  desktopRight: {
    width: 360,
    gap: 16,
  },
  desktopBagCard: {
    flexDirection: "row",
    gap: 18,
    padding: 16,
    borderWidth: 1,
    borderRadius: 2,
  },
  desktopBagImage: {
    width: 112,
    height: 144,
    borderRadius: 2,
  },
  desktopBagDetails: {
    flex: 1,
    gap: 6,
  },
  desktopBagBrand: {
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopBagName: {
    fontSize: 15,
    fontFamily: "GoogleSans_500Medium",
    lineHeight: 21,
  },
  desktopBagMeta: {
    fontSize: 12,
  },
  desktopQtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  desktopQtyLabel: {
    fontSize: 12.5,
  },
  desktopBagActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  desktopActionLink: {
    fontSize: 12.5,
    fontFamily: "GoogleSans_600SemiBold",
  },
  desktopBagPriceCol: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  desktopBagPrice: {
    fontSize: 17,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopBagMrpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  desktopPanel: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 2,
  },
  desktopPanelTitle: {
    fontSize: 12.5,
    letterSpacing: 0.9,
    fontFamily: "GoogleSans_700Bold",
    marginBottom: 14,
  },
  desktopEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 72,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderRadius: 2,
    gap: 14,
  },
  desktopEmptyTitle: {
    fontSize: 22,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopEmptyActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
  },
  desktopGoldBtn: {
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopGoldBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopOutlineBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 2,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopOutlineBtnText: {
    fontSize: 12.5,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  empty: { flex: 1 },
  emptyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "GoogleSans_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "GoogleSans_400Regular" },
  shopBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  shopBtnText: { fontSize: 16, fontFamily: "GoogleSans_600SemiBold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: { fontSize: 22, fontFamily: "GoogleSans_700Bold" },
  section: { padding: 16 },
  divider: { height: 1, marginHorizontal: 0 },
  cartItem: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  itemImage: { width: 80, height: 80, borderRadius: 10 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: {
    fontSize: 14,
    fontFamily: "GoogleSans_500Medium",
    lineHeight: 20,
  },
  itemSeller: { fontSize: 11, fontFamily: "GoogleSans_400Regular" },
  itemPriceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemPrice: { fontSize: 15, fontFamily: "GoogleSans_700Bold" },
  itemOriginal: {
    fontSize: 12,
    fontFamily: "GoogleSans_400Regular",
    textDecorationLine: "line-through",
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontFamily: "GoogleSans_600SemiBold",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: { marginLeft: "auto" },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "GoogleSans_600SemiBold",
    marginBottom: 12,
  },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  applyBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { fontSize: 14, fontFamily: "GoogleSans_600SemiBold" },
  activeCoupon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  activeCouponText: { fontSize: 13, fontFamily: "GoogleSans_500Medium" },
  couponHint: {
    fontSize: 11,
    fontFamily: "GoogleSans_400Regular",
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryKey: { fontSize: 14, fontFamily: "GoogleSans_400Regular" },
  summaryVal: { fontSize: 14, fontFamily: "GoogleSans_500Medium" },
  totalKey: { fontSize: 16, fontFamily: "GoogleSans_700Bold" },
  totalVal: { fontSize: 18, fontFamily: "GoogleSans_700Bold" },
  footer: { padding: 16, gap: 10 },
  footerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerTotal: { fontSize: 20, fontFamily: "GoogleSans_700Bold" },
  footerSaved: { fontSize: 12, fontFamily: "GoogleSans_500Medium" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  checkoutText: { fontSize: 16, fontFamily: "GoogleSans_600SemiBold" },
});
