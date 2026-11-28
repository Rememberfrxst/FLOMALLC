import React from "react";
import { View, useWindowDimensions, type DimensionValue } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import StorefrontSkeleton from "./StorefrontSkeleton";
import { ProductGridSkeleton, Shimmer } from "./SkeletonLoader";

export function PageSkeleton({
  pathname,
  contentOnly = false,
}: {
  pathname: string;
  contentOnly?: boolean;
}) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const wishlist = useWishlist();
  const [, page, subpage] = pathname.split("/");
  const block = (
    height: number,
    width: DimensionValue = "100%",
    radius = 6,
  ) => (
    <View
      style={{ height, width, borderRadius: radius, backgroundColor: c.border }}
    />
  );
  const lines = (
    <View style={{ flex: 1, gap: 8 }}>
      {block(14, "72%")}
      {block(10, "47%")}
    </View>
  );
  const rows = (count: number, thumbnail = 0, round = false) =>
    Array.from({ length: count }, (_, i) => (
      <View
        key={i}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          minHeight: 42,
        }}
      >
        {thumbnail > 0 && block(thumbnail, thumbnail, round ? thumbnail : 6)}
        {lines}
      </View>
    ));
  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {block(28, 28, 14)}
      <View style={{ flex: 1 }}>{block(40, "100%", 22)}</View>
      {block(28, 28, 14)}
    </View>
  );
  const empty = (
    <View style={{ alignItems: "center", gap: 14, paddingVertical: 80 }}>
      {block(72, 72, 36)}
      {block(20, "50%")}
      {block(12, "68%")}
      {block(40, 150, 20)}
    </View>
  );
  const fields = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <View key={i} style={{ gap: 8 }}>
        {block(12, "28%")}
        {block(46)}
      </View>
    ));
  let body: React.ReactNode;
  if (!page)
    return (
      <StorefrontSkeleton
        desktop={false}
        heroHeight={Math.min(330, Math.max(180, width * 0.51))}
      />
    );
  switch (page) {
    case "products":
    case "category":
    case "fresh-fits":
      return (
        <View style={{ gap: 12, padding: 8 }}>
          {header}
          {block(20, "55%")}
          {block(38)}
          <ProductGridSkeleton />
        </View>
      );
    case "search":
      return (
        <View style={{ gap: 10, padding: 8 }}>
          {header}
          {block(38)}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ width: "31%", gap: 12 }}>{rows(7)}</View>
            <View style={{ flex: 1, gap: 12 }}>
              {block(20, "60%")}
              {block(100)}
              <ProductGridSkeleton />
            </View>
          </View>
        </View>
      );
    case "product":
      body = (
        <>
          {!contentOnly && header}
          {block(width - 28)}
          {block(16, "34%")}
          {block(22, "82%")}
          {block(20, "41%")}
          {block(44)}
        </>
      );
      break;
    case "wishlist":
      if (wishlist.items.length) return <ProductGridSkeleton />;
      body = empty;
      break;
    case "cart":
      body = itemCount ? (
        <>
          {block(25, "34%")}
          {rows(2, 88)}
          {block(48)}
          {rows(3)}
          {block(48)}
        </>
      ) : (
        <>
          {block(25, "34%")}
          {empty}
        </>
      );
      break;
    case "checkout":
      body =
        subpage === "success" ? (
          <>
            {empty}
            {rows(3)}
          </>
        ) : itemCount ? (
          <>
            {block(22, "42%")}
            {fields(2)}
            {rows(3)}
            {block(48)}
          </>
        ) : (
          empty
        );
      break;
    case "orders":
      body = user ? (
        <>
          {!contentOnly && (
            <>
              {block(24, "42%")}
              {block(40)}
            </>
          )}
          {rows(3, 76)}
        </>
      ) : (
        empty
      );
      break;
    case "order":
      body = (
        <>
          {block(26, "55%")}
          {block(76)}
          {rows(3, 60)}
          {block(18, "46%")}
          {rows(3)}
        </>
      );
      break;
    case "offers":
      body = (
        <>
          {!contentOnly && block(24, "52%")}
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                borderColor: c.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}
            >
              {block(22, "38%")}
              {block(14, "82%")}
              {block(12, "62%")}
              {block(30, "32%")}
            </View>
          ))}
        </>
      );
      break;
    case "notifications":
      body = user ? <>{rows(5, 40, true)}</> : empty;
      break;
    case "auth":
      body = (
        <>
          {block(32, "32%")}
          {block(24, "70%")}
          {block(12, "88%")}
          {block(44)}
          {fields(subpage === "register" ? 4 : 2)}
          {block(48)}
        </>
      );
      break;
    case "profile":
      body = (
        <>
          {rows(1, 64, true)}
          {block(62)}
          {rows(7, 28, true)}
        </>
      );
      break;
    case "addresses":
      body = user ? (
        <>
          {rows(2, 44)}
          {block(48)}
        </>
      ) : (
        empty
      );
      break;
    case "account":
      body = user ? (
        <>
          {fields(3)}
          {block(46)}
        </>
      ) : (
        empty
      );
      break;
    case "help":
    case "settings":
      body = (
        <>
          {block(22, "44%")}
          {rows(6, page === "settings" ? 28 : 0)}
        </>
      );
      break;
    case "seller":
      body = subpage ? (
        block(18, "58%")
      ) : user?.role === "admin" ? (
        <>
          {block(90)}
          {rows(4, 56)}
        </>
      ) : (
        empty
      );
      break;
    default:
      return null;
  }
  return (
    <View
      testID={`skeleton-${page}`}
      accessible
      accessibilityLabel="Loading page"
      aria-busy
    >
      <Shimmer>
        <View style={{ padding: 14, gap: 16 }}>{body}</View>
      </Shimmer>
    </View>
  );
}
