import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Text } from "@/components/Text";
import { Icon } from "@/components/StoreIcon";
import CampaignCarousel from "@/components/CampaignCarousel";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useStorefront } from "@/hooks/useStorefront";
import { api, ApiBanner } from "@/services/api";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import DesktopStoreHeader from "@/components/DesktopStoreHeader";
import DesktopStoreFooter from "@/components/DesktopStoreFooter";

export default function Me() {
  const c = useColors(),
    insets = useSafeAreaInsets(),
    desktop = useDesktopWeb(),
    { user, logout } = useAuth(),
    store = useStorefront();
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      api.banners
        .list()
        .then((b) => {
          if (active) setBanners(b);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );
  const help = (section: string) =>
      router.push({ pathname: "/help", params: { section } }),
    row = (title: string, onPress: () => void, subtitle?: string) => (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={title}
        key={title}
        onPress={onPress}
        style={[s.row, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.foreground, fontSize: 14 }}>{title}</Text>
          {subtitle && (
            <Text
              style={{ fontSize: 11, color: c.mutedForeground, marginTop: 3 }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <Icon name="chevron-forward" size={18} color={c.mutedForeground} />
      </TouchableOpacity>
    );
  const signOut = () => {
    if (Platform.OS === "web") {
      setConfirmingLogout(true);
    } else {
      Alert.alert("Log out?", "You can sign in again any time.", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: logout },
      ]);
    }
  };

  if (desktop) {
    return (
      <ScrollView
        testID="profile-screen"
        style={{ flex: 1, backgroundColor: c.background }}
        showsVerticalScrollIndicator={false}
      >
        <DesktopStoreHeader />
        <View style={s.desktopWrap}>
          <View style={[s.desktopBanner, { backgroundColor: "#EFF4F7", borderColor: c.border }]}>
            <View style={[s.avatar, { backgroundColor: c.navy }]}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 88, height: 88, borderRadius: 46 }}
                  contentFit="cover"
                />
              ) : (
                <Text style={{ fontSize: 36, color: "#fff", fontFamily: "GoogleSans_700Bold" }}>
                  {(user?.name?.trim()?.[0] || "F").toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 10.5, letterSpacing: 1.5, color: c.gold, fontFamily: "GoogleSans_700Bold" }}>
                MY FLOMA ACCOUNT
              </Text>
              <Text style={{ fontSize: 22, color: c.navy, fontFamily: "GoogleSans_700Bold" }}>
                {user?.name || "Welcome to " + store.storeName}
              </Text>
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                {user?.email || "Sign in to track orders, saved wishlist & personalized coupons"}
              </Text>
              {user?.phone && (
                <Text style={{ fontSize: 12.5, color: c.mutedForeground }}>
                  {user.phone}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[s.desktopPrimaryBtn, { backgroundColor: c.gold }]}
                onPress={() => router.push(user ? "/account" : "/auth/login")}
              >
                <Text style={s.desktopPrimaryBtnText}>
                  {user ? "EDIT PROFILE" : "SIGN IN / JOIN"}
                </Text>
              </TouchableOpacity>
              {user && !confirmingLogout && (
                <TouchableOpacity
                  style={[s.desktopOutlineBtn, { borderColor: c.navy }]}
                  onPress={signOut}
                >
                  <Text style={[s.desktopOutlineBtnText, { color: c.navy }]}>
                    LOGOUT
                  </Text>
                </TouchableOpacity>
              )}
              {user && confirmingLogout && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity
                    style={[s.desktopPrimaryBtn, { backgroundColor: c.destructive }]}
                    onPress={() => {
                      setConfirmingLogout(false);
                      void logout();
                    }}
                  >
                    <Text style={s.desktopPrimaryBtnText}>CONFIRM LOGOUT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.desktopOutlineBtn, { borderColor: c.border }]}
                    onPress={() => setConfirmingLogout(false)}
                  >
                    <Text style={[s.desktopOutlineBtnText, { color: c.foreground }]}>
                      CANCEL
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={s.desktopColumns}>
            <View style={[s.desktopCol, { borderColor: c.border }]}>
              <Text style={[s.desktopColHeading, { color: c.navy, borderBottomColor: c.border }]}>
                ORDERS & PREFERENCES
              </Text>
              {row("Orders and Refunds", () => router.push("/(tabs)/orders"))}
              {row("My Wishlist", () => router.push("/wishlist"))}
              {row(
                "Offers and Coupons",
                () => router.push("/offers"),
                "Explore available savings on your next order",
              )}
              {row("Saved Addresses", () => router.push("/addresses"))}
              {row("Notifications", () => router.push("/notifications"))}
              {row("Preferences", () => router.push("/settings"), "Appearance and language")}
            </View>

            <View style={[s.desktopCol, { borderColor: c.border }]}>
              <Text style={[s.desktopColHeading, { color: c.navy, borderBottomColor: c.border }]}>
                HELP & STORE POLICIES
              </Text>
              {row("Customer Care", () => help("support"))}
              {row("Payment and Refund Modes", () => help("payments"))}
              {row("How To Return", () => help("returns"))}
              {row("How Do I Redeem My Coupon?", () => help("coupons"))}
              {row("Delivery and Shipping Policy", () => help("shipping"))}
              {row("Terms & Conditions", () => help("terms"))}
              {row("We Respect Your Privacy", () => help("privacy"))}
              {row("Who We Are", () => help("about"))}
            </View>
          </View>
        </View>
        <DesktopStoreFooter />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      testID="profile-screen"
      style={{ flex: 1, backgroundColor: c.muted }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 25 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.header, { backgroundColor: c.card }]}>
        <Text
          style={{
            fontSize: 18,
            color: c.foreground,
            fontFamily: "GoogleSans_600SemiBold",
          }}
        >
          My Account
        </Text>
      </View>
      <View
        style={[
          s.profile,
          {
            backgroundColor:
              c.background === "#FFFFFF" ? "#EFF4F7" : c.secondary,
          },
        ]}
      >
        <View style={[s.avatar, { backgroundColor: c.navy }]}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={{ width: 88, height: 88, borderRadius: 46 }}
              contentFit="cover"
            />
          ) : (
            <Text style={{ fontSize: 38, color: "#fff" }}>
              {(user?.name?.trim()?.[0] || "F").toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={{
              fontSize: 17,
              color: c.foreground,
              fontFamily: "GoogleSans_600SemiBold",
            }}
          >
            {user?.name || "Welcome to " + store.storeName}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, color: c.mutedForeground }}
          >
            {user?.email || "Sign in to manage your account"}
          </Text>
          {user?.phone && (
            <Text style={{ fontSize: 12, color: c.mutedForeground }}>
              {user.phone}
            </Text>
          )}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={user ? "Edit profile" : "Sign in"}
          onPress={() => router.push(user ? "/account" : "/auth/login")}
        >
          <Text
            style={{
              color: c.link,
              fontSize: 13,
              fontFamily: "GoogleSans_600SemiBold",
            }}
          >
            {user ? "Edit" : "Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={s.group}>
        {row("Orders and Refunds", () => router.push("/(tabs)/orders"))}
        {row("Customer Care", () => help("support"))}
        {row("My Wishlist", () => router.push("/wishlist"))}
        {row(
          "Offers and Coupons",
          () => router.push("/offers"),
          "Explore available savings on your next order",
        )}
      </View>
      {banners.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <CampaignCarousel banners={banners} height={120} />
        </View>
      )}
      <View style={s.group}>
        {row("Payment and Refund Modes", () => help("payments"))}
        {row("Address", () => router.push("/addresses"))}
        {row("Notifications", () => router.push("/notifications"))}
        {row(
          "Preferences",
          () => router.push("/settings"),
          "Appearance and language",
        )}
      </View>
      <View style={s.group}>
        {row("How To Return", () => help("returns"))}
        {row("How Do I Redeem My Coupon?", () => help("coupons"))}
        {row("Terms & Conditions", () => help("terms"))}
        {row("Returns & Refunds Policy", () => help("returns"))}
        {row("We Respect Your Privacy", () => help("privacy"))}
        {row("Delivery and Shipping Policy", () => help("shipping"))}
        {row("Who We Are", () => help("about"))}
        {!!store.downloadUrl && row("Download the App", () => help("download"))}
      </View>
      <View style={{ padding: 17, backgroundColor: c.card, marginTop: 9 }}>
        {confirmingLogout && user ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setConfirmingLogout(false);
                void logout();
              }}
              style={[s.logout, { flex: 1, borderColor: c.destructive, backgroundColor: c.destructive }]}
            >
              <Text style={{ fontSize: 14, color: "#FFFFFF", fontFamily: "GoogleSans_600SemiBold" }}>
                Confirm Logout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setConfirmingLogout(false)}
              style={[s.logout, { flex: 1, borderColor: c.border }]}
            >
              <Text style={{ fontSize: 14, color: c.foreground, fontFamily: "GoogleSans_600SemiBold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => (user ? signOut() : router.push("/auth/login"))}
            style={[s.logout, { borderColor: c.foreground }]}
          >
            <Text
              style={{
                fontSize: 14,
                color: c.foreground,
                fontFamily: "GoogleSans_600SemiBold",
              }}
            >
              {user ? "Logout" : "Sign In / Create Account"}
            </Text>
          </TouchableOpacity>
        )}
        <Text
          style={{
            fontSize: 11,
            color: c.mutedForeground,
            textAlign: "center",
            marginTop: 14,
          }}
        >
          Version {Constants.expoConfig?.version || "1.2.0"}
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  desktopWrap: {
    width: "100%",
    maxWidth: 1160,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 28,
    gap: 24,
  },
  desktopBanner: {
    padding: 28,
    borderWidth: 1,
    borderRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  desktopPrimaryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopOutlineBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 2,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopOutlineBtnText: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: "GoogleSans_700Bold",
  },
  desktopColumns: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  desktopCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    overflow: "hidden",
  },
  desktopColHeading: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: "GoogleSans_700Bold",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    backgroundColor: "#FAFAFA",
  },
  header: { height: 62, justifyContent: "center", paddingHorizontal: 27 },
  profile: {
    paddingHorizontal: 17,
    paddingVertical: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 46,
    backgroundColor: "#2C4152",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 17,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 57,
  },
  group: { marginTop: 8 },
  logout: {
    height: 47,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
