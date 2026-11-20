import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SvgIcon from "@/components/SvgIcon";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/constants/data";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import DesktopStoreHeader from "@/components/DesktopStoreHeader";
import DesktopStoreFooter from "@/components/DesktopStoreFooter";

const PAYMENT_METHODS = [
  {
    key: "cod",
    label: "Cash on Delivery",
    icon: "cash-outline",
    sub: "Pay when your order arrives",
  },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["key"];

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const desktop = useDesktopWeb();
  const {
    subtotal,
    deliveryFee,
    discountAmount,
    total,
    items,
    placeOrder,
  } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placing, setPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user && items.length > 0 && Platform.OS !== "web") {
      Alert.alert("Sign In Required", "Please sign in to place your order", [
        { text: "Sign In", onPress: () => router.push("/auth/login") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [user, items.length]);

  const address =
    user?.addresses.find((a) => a.isDefault) || user?.addresses[0] || null;

  const handlePlaceOrder = async () => {
    setErrorMsg("");
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!address) {
      setErrorMsg("Please add a delivery address before placing your order.");
      router.push("/addresses");
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder(paymentMethod, address);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace({
        pathname: "/checkout/success",
        params: { orderId: order.id },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (desktop) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
        <DesktopStoreHeader />
        <View style={styles.desktopWrap}>
          {items.length === 0 ? (
            <View style={[styles.desktopEmpty, { borderColor: colors.border }]}>
              <SvgIcon name="bag-outline" size={46} color={colors.navy} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>Nothing in your shopping bag</Text>
              <TouchableOpacity
                style={[styles.desktopGoldBtn, { backgroundColor: colors.gold }]}
                onPress={() => router.replace("/")}
              >
                <Text style={styles.desktopGoldBtnText}>CONTINUE SHOPPING</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.desktopHeaderBar, { borderBottomColor: colors.border }]}>
                <Text style={[styles.desktopKicker, { color: colors.goldMuted }]}>FLOMA SECURE CHECKOUT</Text>
                <Text style={[styles.desktopTitle, { color: colors.navy }]}>DELIVERY & PAYMENT</Text>
              </View>
              <View style={styles.desktopGrid}>
                <View style={styles.desktopLeft}>
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 2 }]}>
                    <View style={styles.desktopCardTop}>
                      <Text style={[styles.desktopCardHeading, { color: colors.navy }]}>DELIVERY ADDRESS</Text>
                      <TouchableOpacity onPress={() => router.push(user ? "/addresses" : "/auth/login")}>
                        <Text style={{ color: colors.link, fontSize: 12.5, fontFamily: "GoogleSans_600SemiBold" }}>
                          {address ? "Change Address" : "+ Add Address"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {address ? (
                      <>
                        <View style={styles.addressHeader}>
                          <Text style={[styles.addressName, { color: colors.foreground }]}>
                            {address.name || user?.name || "Home"}
                          </Text>
                          {address.isDefault && (
                            <Text style={[styles.defaultBadge, { backgroundColor: colors.navy + "15", color: colors.navy }]}>
                              Default
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.addressText, { color: colors.mutedForeground }]}>{address.line1}</Text>
                        <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
                          {address.city}, {address.state} - {address.pincode}
                        </Text>
                        <Text style={[styles.addressPhone, { color: colors.mutedForeground }]}>
                          Phone: {address.phone || user?.phone || "N/A"}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                        {user ? "Please add a delivery address to continue." : "Sign in to select or add a delivery address."}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 2 }]}>
                    <Text style={[styles.desktopCardHeading, { color: colors.navy, marginBottom: 14 }]}>PAYMENT MODE</Text>
                    <View style={styles.paymentList}>
                      {PAYMENT_METHODS.map((pm) => (
                        <TouchableOpacity
                          key={pm.key}
                          style={[
                            styles.paymentRow,
                            {
                              borderRadius: 2,
                              borderColor: paymentMethod === pm.key ? colors.navy : colors.border,
                              backgroundColor: paymentMethod === pm.key ? colors.navy + "08" : colors.card,
                            },
                          ]}
                          onPress={() => setPaymentMethod(pm.key)}
                        >
                          <View style={[styles.paymentIcon, { backgroundColor: colors.muted }]}>
                            <SvgIcon name={pm.icon as any} size={22} color={colors.navy} />
                          </View>
                          <View style={styles.paymentInfo}>
                            <Text style={[styles.paymentLabel, { color: colors.foreground }]}>{pm.label}</Text>
                            <Text style={[styles.paymentSub, { color: colors.mutedForeground }]}>{pm.sub}</Text>
                          </View>
                          <View style={[styles.radio, { borderColor: paymentMethod === pm.key ? colors.navy : colors.border }]}>
                            {paymentMethod === pm.key && <View style={[styles.radioFill, { backgroundColor: colors.navy }]} />}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.desktopRight}>
                  <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: 2 }]}>
                    <Text style={[styles.desktopCardHeading, { color: colors.navy, marginBottom: 14 }]}>ORDER SUMMARY</Text>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: colors.mutedForeground }}>Subtotal</Text>
                      <Text style={{ color: colors.foreground }}>{formatPrice(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: colors.mutedForeground }}>Delivery Fee</Text>
                      <Text style={{ color: deliveryFee === 0 ? colors.success : colors.foreground }}>
                        {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                      </Text>
                    </View>
                    {discountAmount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={{ color: colors.success }}>Discount</Text>
                        <Text style={{ color: colors.success }}>-{formatPrice(discountAmount)}</Text>
                      </View>
                    )}
                    <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.totalLabel, { color: colors.foreground }]}>Order Total</Text>
                      <Text style={[styles.totalVal, { color: colors.foreground }]}>{formatPrice(total)}</Text>
                    </View>
                    {!!errorMsg && (
                      <View style={{ backgroundColor: colors.destructive + "14", borderColor: colors.destructive, borderWidth: 1, padding: 10, borderRadius: 2, marginTop: 12 }}>
                        <Text style={{ color: colors.destructive, fontSize: 12.5, fontFamily: "GoogleSans_500Medium" }}>
                          {errorMsg}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.desktopGoldBtn, { backgroundColor: colors.gold, width: "100%", marginTop: 18 }]}
                      onPress={handlePlaceOrder}
                      disabled={placing}
                    >
                      <Text style={styles.desktopGoldBtnText}>
                        {placing ? "PLACING ORDER..." : user ? "PLACE ORDER (COD)" : "SIGN IN TO ORDER"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
        <DesktopStoreFooter />
      </ScrollView>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <SvgIcon name="bag-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.foreground }]}>
          Nothing in cart
        </Text>
        <TouchableOpacity
          style={[styles.shopBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/")}
        >
          <Text
            style={[styles.shopBtnText, { color: colors.primaryForeground }]}
          >
            Start Shopping
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <TouchableOpacity
        onPress={() => router.push(user ? "/addresses" : "/auth/login")}
        style={{ padding: 18 }}
      >
        <Text style={{ color: colors.primary }}>
          {address
            ? "Change delivery address →"
            : "Add your delivery address →"}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Delivery Address
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.addressHeader}>
          <Text style={[styles.addressName, { color: colors.foreground }]}>
            {address?.name || user?.name || "Home"}
          </Text>
          {address?.isDefault && (
            <Text
              style={[
                styles.defaultBadge,
                {
                  backgroundColor: colors.primary + "15",
                  color: colors.primary,
                },
              ]}
            >
              Default
            </Text>
          )}
        </View>
        <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
          {address?.line1}
        </Text>
        <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
          {address?.city}, {address?.state} - {address?.pincode}
        </Text>
        <Text style={[styles.addressPhone, { color: colors.mutedForeground }]}>
          Phone: {address?.phone || user?.phone || "N/A"}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Payment Method
      </Text>
      <View style={styles.paymentList}>
        {PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.key}
            style={[
              styles.paymentRow,
              {
                borderColor:
                  paymentMethod === pm.key ? colors.primary : colors.border,
                backgroundColor:
                  paymentMethod === pm.key
                    ? colors.primary + "10"
                    : colors.card,
              },
            ]}
            onPress={() => setPaymentMethod(pm.key)}
          >
            <View
              style={[
                styles.paymentIcon,
                {
                  backgroundColor:
                    paymentMethod === pm.key
                      ? colors.primary + "20"
                      : colors.muted,
                },
              ]}
            >
              <SvgIcon
                name={pm.icon as any}
                size={22}
                color={
                  paymentMethod === pm.key
                    ? colors.primary
                    : colors.mutedForeground
                }
              />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: colors.foreground }]}>
                {pm.label}
              </Text>
              <Text
                style={[styles.paymentSub, { color: colors.mutedForeground }]}
              >
                {pm.sub}
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                {
                  borderColor:
                    paymentMethod === pm.key ? colors.primary : colors.border,
                },
              ]}
            >
              {paymentMethod === pm.key && (
                <View
                  style={[
                    styles.radioFill,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Order Summary
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.mutedForeground }}>Subtotal</Text>
          <Text style={{ color: colors.foreground }}>
            {formatPrice(subtotal)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.mutedForeground }}>Delivery Fee</Text>
          <Text style={{ color: colors.foreground }}>
            {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
          </Text>
        </View>
        {discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.primary }}>Discount</Text>
            <Text style={{ color: colors.primary }}>
              -{formatPrice(discountAmount)}
            </Text>
          </View>
        )}
        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>
            Total
          </Text>
          <Text style={[styles.totalVal, { color: colors.foreground }]}>
            {formatPrice(total)}
          </Text>
        </View>
      </View>

      {!!errorMsg && (
        <View style={{ backgroundColor: colors.destructive + "14", borderColor: colors.destructive, borderWidth: 1, padding: 12, borderRadius: 10, marginTop: 16 }}>
          <Text style={{ color: colors.destructive, fontSize: 13, fontFamily: "GoogleSans_500Medium" }}>
            {errorMsg}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.payBtn, { backgroundColor: colors.primary }]}
        onPress={handlePlaceOrder}
        disabled={placing}
      >
        <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
          {placing ? "Placing Order..." : user ? "Place Order (Cash on Delivery)" : "Sign In to Place Order"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  desktopWrap: { width: "100%", maxWidth: 1160, alignSelf: "center", paddingHorizontal: 28, paddingVertical: 28, minHeight: 500 },
  desktopHeaderBar: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 22 },
  desktopKicker: { fontSize: 10.5, letterSpacing: 1.5, fontFamily: "GoogleSans_700Bold", marginBottom: 4 },
  desktopTitle: { fontSize: 22, letterSpacing: 1.1, fontFamily: "GoogleSans_700Bold" },
  desktopGrid: { flexDirection: "row", gap: 28, alignItems: "flex-start" },
  desktopLeft: { flex: 1, gap: 18 },
  desktopRight: { width: 360 },
  desktopCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  desktopCardHeading: { fontSize: 12.5, letterSpacing: 0.9, fontFamily: "GoogleSans_700Bold" },
  desktopEmpty: { alignItems: "center", justifyContent: "center", paddingVertical: 70, borderWidth: 1, borderRadius: 2, gap: 14 },
  desktopGoldBtn: { paddingHorizontal: 26, paddingVertical: 14, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  desktopGoldBtnText: { color: "#FFFFFF", fontSize: 12.5, letterSpacing: 1, fontFamily: "GoogleSans_700Bold" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressName: { fontSize: 15, fontWeight: "600", marginRight: 8 },
  defaultBadge: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addressText: { fontSize: 14, marginBottom: 4 },
  addressPhone: { fontSize: 14, marginTop: 4 },
  paymentList: { gap: 12 },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 15, fontWeight: "600" },
  paymentSub: { fontSize: 12, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalVal: { fontSize: 18, fontWeight: "800" },
  payBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  payBtnText: { fontSize: 16, fontWeight: "700" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 20,
  },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  shopBtnText: { fontSize: 14, fontWeight: "600" },
});
