import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Text } from "@/components/Text";
import { useColors } from "@/hooks/useColors";
import { useStorefront } from "@/hooks/useStorefront";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import DesktopStoreHeader from "@/components/DesktopStoreHeader";
import DesktopStoreFooter from "@/components/DesktopStoreFooter";

export default function Help() {
  const { section = "support" } = useLocalSearchParams<{ section?: string }>(),
    c = useColors(),
    desktop = useDesktopWeb(),
    store = useStorefront();
  const content: Record<string, { title: string; body: string }> = {
    returns: { title: store.returnsHeadline, body: store.returnsPolicy },
    shipping: {
      title: "Delivery and Shipping Policy",
      body: `${store.shippingPolicy}\n\nStandard delivery: ₹${store.deliveryFee}. Free delivery on orders from ₹${store.freeShippingThreshold}.`,
    },
    privacy: { title: "We Respect Your Privacy", body: store.privacyPolicy },
    terms: { title: "Terms & Conditions", body: store.termsOfService },
    about: { title: "Who We Are", body: store.aboutStore },
    payments: {
      title: "Payment and Refund Modes",
      body: `Cash on delivery is available at checkout. Your order’s payment status is shown in your order details.\n\nFor refunds, contact customer care with your order number.\n\n${store.returnsPolicy}`,
    },
    coupons: {
      title: "How Do I Redeem My Coupon?",
      body: "Open Offers and Coupons to find an active code. Add eligible products to your cart, sign in, then enter the code in Apply Coupon. Minimum order value, expiry dates and redemption limits apply. Your final savings are confirmed at checkout.",
    },
    support: {
      title: "Customer Care",
      body: "Need help with a product, delivery, return or your account? Contact our team with the details and your order number, if available.",
    },
    download: {
      title: "Download the App",
      body: "Take your saved products and orders with you.",
    },
  };
  const page = content[section] || content.support;
  return (
    <>
      <Stack.Screen options={{ title: page.title }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={desktop ? undefined : { padding: 22, paddingBottom: 40 }}
      >
        {desktop && <DesktopStoreHeader />}
        <View
          style={
            desktop
              ? {
                  width: "100%",
                  maxWidth: 920,
                  alignSelf: "center",
                  paddingHorizontal: 28,
                  paddingVertical: 36,
                  minHeight: 440,
                }
              : undefined
          }
        >
          {desktop && (
            <Text
              style={{
                fontSize: 10.5,
                letterSpacing: 1.5,
                color: c.gold,
                fontFamily: "GoogleSans_700Bold",
                marginBottom: 6,
              }}
            >
              FLOMA CUSTOMER CARE
            </Text>
          )}
          <Text
            style={{
              fontSize: desktop ? 26 : 22,
              color: desktop ? c.navy : c.foreground,
              fontFamily: "GoogleSans_700Bold",
              marginBottom: 20,
            }}
          >
            {page.title}
          </Text>
          <Text
            style={{ fontSize: 14.5, lineHeight: 25, color: c.mutedForeground }}
          >
            {page.body}
          </Text>
          {section === "coupons" && (
            <TouchableOpacity
              onPress={() => router.push("/offers")}
              style={{ paddingVertical: 20 }}
            >
              <Text style={{ color: c.link, fontSize: 14, fontFamily: "GoogleSans_600SemiBold" }}>
                View available coupons ›
              </Text>
            </TouchableOpacity>
          )}
          {section === "download" && !!store.downloadUrl && (
            <TouchableOpacity
              onPress={() => {
                void Linking.openURL(store.downloadUrl);
              }}
              style={{ paddingVertical: 20 }}
            >
              <Text style={{ color: c.link }}>Open app download ›</Text>
            </TouchableOpacity>
          )}
          <View
            style={{
              borderTopWidth: 1,
              borderColor: c.border,
              paddingTop: 24,
              marginTop: 28,
            }}
          >
            <Text style={{ fontSize: 13, color: c.foreground, marginBottom: 10 }}>
              We’re here to help
            </Text>
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => {
                void Linking.openURL(
                  `mailto:${store.supportEmail}?subject=${encodeURIComponent(page.title)}`,
                );
              }}
            >
              <Text style={{ fontSize: 14, color: c.link, fontFamily: "GoogleSans_600SemiBold" }}>
                {store.supportEmail}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {desktop && <DesktopStoreFooter />}
      </ScrollView>
    </>
  );
}
