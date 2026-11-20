import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { LoadState } from "@/components/ShopUI";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { StoreOffer } from "@/hooks/useOffers";
import { useColors } from "@/hooks/useColors";
import { formatPrice } from "@/constants/data";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import DesktopStoreHeader from "@/components/DesktopStoreHeader";
import DesktopStoreFooter from "@/components/DesktopStoreFooter";

export default function Offers() {
  const c = useColors();
  const desktop = useDesktopWeb();
  const query = useQuery({
    queryKey: ["offers"],
    queryFn: () => api.storefront.offers(),
  });

  const body = (
    <View
      style={
        desktop
          ? {
              width: "100%",
              maxWidth: 1120,
              alignSelf: "center",
              paddingHorizontal: 28,
              paddingVertical: 32,
              minHeight: 460,
            }
          : undefined
      }
    >
      <View
        style={
          desktop
            ? {
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                paddingBottom: 16,
                marginBottom: 24,
              }
            : { marginBottom: 20 }
        }
      >
        {desktop && (
          <Text
            style={{
              fontSize: 10.5,
              letterSpacing: 1.6,
              color: c.goldMuted,
              fontFamily: "GoogleSans_700Bold",
              marginBottom: 4,
            }}
          >
            FLOMA EXCLUSIVE SAVINGS
          </Text>
        )}
        <Text
          style={{
            fontSize: desktop ? 24 : 21,
            color: desktop ? c.navy : c.foreground,
            fontFamily: "GoogleSans_700Bold",
          }}
        >
          Offers & Coupons
        </Text>
      </View>

      {query.isPending ? (
        <LoadState loading />
      ) : query.isError ? (
        <LoadState
          error="load"
          retry={() => {
            void query.refetch();
          }}
        />
      ) : !query.data?.length ? (
        <LoadState empty="New offers are on their way" />
      ) : (
        <View
          style={
            desktop
              ? { flexDirection: "row", flexWrap: "wrap", gap: 20 }
              : undefined
          }
        >
          {query.data.map((o) => (
            <View
              key={o.id}
              style={{
                width: desktop ? ("48.5%" as any) : "100%",
                backgroundColor: desktop ? c.searchIvory : c.card,
                borderWidth: 1,
                borderStyle: desktop ? "dashed" : "solid",
                borderColor: desktop ? c.goldLine : c.border,
                padding: 22,
                marginBottom: desktop ? 0 : 14,
                borderRadius: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  color: c.gold,
                  fontFamily: "GoogleSans_700Bold",
                }}
              >
                {o.discountType === "percentage"
                  ? `${Number(o.discountValue)}% OFF`
                  : `${formatPrice(Number(o.discountValue))} OFF`}
              </Text>
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: c.navy,
                  backgroundColor: c.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: c.navy,
                    letterSpacing: 1.2,
                    fontFamily: "GoogleSans_700Bold",
                  }}
                >
                  {o.code}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12.5,
                  color: c.mutedForeground,
                  lineHeight: 20,
                  marginTop: 12,
                }}
              >
                {Number(o.minOrderValue) > 0
                  ? `On orders from ${formatPrice(Number(o.minOrderValue))}. `
                  : "No minimum order. "}
                {o.maxDiscount
                  ? `Maximum discount ${formatPrice(Number(o.maxDiscount))}. `
                  : ""}
                {o.validUntil
                  ? "Valid until " +
                    new Date(o.validUntil).toLocaleDateString("en-IN") +
                    "."
                  : ""}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/cart",
                    params: { coupon: o.code },
                  })
                }
                style={{
                  backgroundColor: desktop ? c.gold : c.primary,
                  padding: 13,
                  alignItems: "center",
                  marginTop: 18,
                  borderRadius: 2,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 12,
                    letterSpacing: 1,
                    fontFamily: "GoogleSans_700Bold",
                  }}
                >
                  USE THIS CODE
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: desktop ? c.background : c.muted }}
      contentContainerStyle={desktop ? undefined : { padding: 16 }}
    >
      {desktop && <DesktopStoreHeader />}
      {body}
      {desktop && <DesktopStoreFooter />}
    </ScrollView>
  );
}
