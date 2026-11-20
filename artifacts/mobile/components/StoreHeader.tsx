import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Share,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { TextInput } from "./TextInput";
import { Text } from "./Text";
import { Icon } from "./StoreIcon";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import { DesktopStoreHeader } from "./DesktopStoreHeader";

const LOGO_TRANSPARENT = require("@/assets/images/logo-transparent.png");

export function StoreHeader({
  query,
  onChangeQuery,
  onSearch,
  back = false,
  inverse = false,
  productName,
  onMore,
}: {
  query?: string;
  onChangeQuery?: (q: string) => void;
  onSearch?: (q: string) => void;
  back?: boolean;
  inverse?: boolean;
  productName?: string;
  onMore?: () => void;
}) {
  const c = useColors(),
    cart = useCart(),
    desktop = useDesktopWeb(),
    [local, setLocal] = useState(""),
    value = query ?? local,
    setText = onChangeQuery || setLocal,
    fg = inverse ? "#fff" : c.foreground;
  const search = () => {
    if (onSearch) onSearch(value);
    else router.push({ pathname: "/products", params: { q: value } });
  };
  // The native/mobile header stays intact. Only a wide browser gets the
  // marketplace navigation, so changing web UX cannot alter the app layout.
  if (desktop) {
    return (
      <DesktopStoreHeader
        query={query}
        onChangeQuery={onChangeQuery}
        onSearch={onSearch}
        back={back}
        productName={productName}
      />
    );
  }
  const iconPillStyle = inverse ? s.inverseActionPill : s.plainActionBtn;
  return (
    <View style={s.header}>
      {back ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={iconPillStyle}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        >
          <Icon name="chevron-back" color={fg} size={22} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="FLOMA Home"
          hitSlop={6}
          onPress={() => router.replace("/")}
          style={s.logoBtn}
        >
          <Image
            source={LOGO_TRANSPARENT}
            style={s.brandLogo}
            contentFit="contain"
          />
        </TouchableOpacity>
      )}
      <View
        style={[
          s.search,
          {
            backgroundColor: inverse ? "rgba(255,255,255,0.96)" : c.input,
            borderColor: inverse ? "rgba(255,255,255,0.45)" : c.border,
          },
          inverse ? s.searchShadowInverse : s.searchShadow,
        ]}
      >
        <Icon
          name="search-outline"
          size={17}
          color="#64748B"
          style={s.leadingIcon}
        />
        <TextInput
          accessibilityLabel="Search products"
          placeholder="Search styles, brands…"
          placeholderTextColor="#7C8594"
          value={value}
          onChangeText={setText}
          onSubmitEditing={search}
          returnKeyType="search"
          style={[s.input, { color: inverse ? "#0F172A" : c.foreground }]}
        />
        {value.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={6}
            onPress={() => setText("")}
            style={s.clearBtn}
          >
            <Icon name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Submit search"
          onPress={search}
          style={[
            s.submit,
            { backgroundColor: back ? "transparent" : c.primary },
          ]}
        >
          <Icon
            name={back ? "search-outline" : "arrow-forward"}
            size={16}
            color={back ? (inverse ? "#0F172A" : c.foreground) : "#FFFFFF"}
          />
        </TouchableOpacity>
      </View>
      {!back && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={6}
          style={iconPillStyle}
          onPress={() => router.push("/notifications")}
        >
          <Icon name="notifications-outline" color={fg} size={21} />
        </TouchableOpacity>
      )}
      {back && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Cart, ${cart.itemCount} items`}
          hitSlop={6}
          onPress={() => router.push("/(tabs)/cart")}
          style={[iconPillStyle, { position: "relative" }]}
        >
          <Icon name="cart-outline" color={fg} size={22} />
          {cart.itemCount > 0 && (
            <View style={[s.badge, { backgroundColor: c.accent }]}>
              <Text style={{ fontSize: 9, color: "#fff", fontFamily: "GoogleSans_700Bold" }}>
                {cart.itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={productName ? "Share product" : "Wishlist"}
        hitSlop={6}
        style={iconPillStyle}
        onPress={() =>
          productName
            ? void Share.share({ message: productName })
            : router.push("/wishlist")
        }
      >
        <Icon
          name={productName ? "share-outline" : "heart-outline"}
          color={fg}
          size={21}
        />
      </TouchableOpacity>
      {back && onMore && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="More product options"
          onPress={onMore}
          style={iconPillStyle}
          hitSlop={6}
        >
          <Icon name="ellipsis-horizontal" color={fg} size={21} />
        </TouchableOpacity>
      )}
    </View>
  );
}
export function DepartmentTabs({
  tabs,
  active,
  onChange,
  inverse = false,
}: {
  tabs: { id: string; name: string }[];
  active: string;
  onChange: (id: string) => void;
  inverse?: boolean;
}) {
  const c = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.tabs}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab.id === active }}
          onPress={() => onChange(tab.id)}
          style={[
            s.tab,
            {
              borderBottomColor:
                tab.id === active
                  ? inverse
                    ? "#fff"
                    : c.foreground
                  : "transparent",
            },
          ]}
        >
          <Text
            style={{
              color: inverse
                ? "#fff"
                : tab.id === active
                  ? c.foreground
                  : c.mutedForeground,
              fontSize: 14,
              fontFamily:
                tab.id === active
                  ? "GoogleSans_700Bold"
                  : "GoogleSans_400Regular",
            }}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  logoBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    flexShrink: 0,
  },
  brandLogo: {
    width: 30,
    height: 30,
    backgroundColor: "transparent",
  },
  plainActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inverseActionPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flex: 1,
    minWidth: 0,
    height: 41,
    borderWidth: 1,
    borderRadius: 21,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  searchShadow: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchShadowInverse: {
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  leadingIcon: {
    marginLeft: 12,
    marginRight: 6,
  },
  input: {
    flex: 1,
    minWidth: 0,
    flexBasis: 0,
    paddingLeft: 2,
    paddingRight: 4,
    fontSize: 13.5,
    fontFamily: "GoogleSans_400Regular",
    height: 40,
    outlineWidth: 0,
  } as any,
  clearBtn: {
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  submit: {
    width: 31,
    height: 31,
    flexShrink: 0,
    borderRadius: 16,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: { gap: 22, paddingHorizontal: 14, height: 42, alignItems: "center" },
  tab: { height: 37, paddingTop: 7, borderBottomWidth: 3 },
  badge: {
    position: "absolute",
    right: -1,
    top: -1,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
