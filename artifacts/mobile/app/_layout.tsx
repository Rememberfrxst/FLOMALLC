import React, { useEffect } from "react";
import { applyGlobalTypographyFix } from "@/constants/typography";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
} from "@expo-google-fonts/google-sans";
import { Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Shimmer } from "@/components/SkeletonLoader";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

// Fix Android font padding that causes text to shift up/down in every component
applyGlobalTypographyFix();

const queryClient = new QueryClient();

function PageEntrySkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = React.useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 420);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  const block = { backgroundColor: colors.border, borderRadius: 8 };
  return (
    <View
      testID="page-entry-skeleton"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
        },
      ]}
    >
      <Shimmer>
        <View style={{ gap: 20 }}>
          <View
            style={[block, { width: "62%", height: 32, borderRadius: 16 }]}
          />
          <View style={[block, { width: "100%", height: 152 }]} />
          {[0, 1, 2].map((row) => (
            <View
              key={row}
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              <View style={[block, { height: 56, width: 56 }]} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[block, { width: "78%", height: 14 }]} />
                <View style={[block, { width: "48%", height: 10 }]} />
              </View>
            </View>
          ))}
        </View>
      </Shimmer>
    </View>
  );
}

function RootLayoutNav() {
  const colors = useColors();
  const pathname = usePathname();
  const desktop = useDesktopWeb();
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.primary,
          // @ts-ignore - includeFontPadding is Android-specific but required for custom fonts
          headerTitleStyle: {
            fontFamily: "GoogleSans_600SemiBold",
            fontSize: 17,
            color: colors.foreground,
          },
          headerShadowVisible: false,
          headerBackTitle: "",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="offers" options={{ title: "Offers and Coupons" }} />
        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications" }}
        />
        <Stack.Screen name="help" options={{ title: "Customer Care" }} />
        <Stack.Screen
          name="account/index"
          options={{ title: "Edit Profile" }}
        />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
        <Stack.Screen
          name="checkout/index"
          options={{ title: "Checkout", headerBackTitle: "Cart" }}
        />
        <Stack.Screen
          name="checkout/success"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="order/[id]" options={{ title: "Order Details" }} />
        <Stack.Screen
          name="wishlist/index"
          options={{ title: "My Wishlist" }}
        />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="seller/index" options={{ title: "Seller Hub" }} />
        <Stack.Screen
          name="addresses/index"
          options={{ title: "Delivery addresses" }}
        />
        <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
      </Stack>
      {!desktop && <PageEntrySkeleton key={pathname} />}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Google Sans — used everywhere in the app
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
    // Inter Bold — kept only for the FLOMA logo wordmark on the home screen
    Inter_700Bold,
    // Ionicons — preloaded so it never falls back to Japanese/Chinese glyphs on Android
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <RootLayoutNav />
                    </GestureHandlerRootView>
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
