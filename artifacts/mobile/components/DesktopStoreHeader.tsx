import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { TextInput } from "./TextInput";
import { Text } from "./Text";
import { Icon } from "./StoreIcon";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useColors } from "@/hooks/useColors";
import {
  AJIO_NAV_MENUS,
  MenuGroup,
  MenuSubLink,
  TopNavMenu,
} from "@/constants/desktopNavData";

type HeaderProps = {
  query?: string;
  onChangeQuery?: (query: string) => void;
  onSearch?: (query: string) => void;
  back?: boolean;
  productName?: string;
};

type ShopByTab = "CATEGORIES" | "BRANDS";

/** Ajio-exact desktop web header with full hover mega-menu flyout for FLOMA. */
export function DesktopStoreHeader({
  query,
  onChangeQuery,
  onSearch,
}: HeaderProps) {
  const c = useColors();
  const { user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const [localQuery, setLocalQuery] = useState("");
  const [activeKey, setActiveKey] = useState<TopNavMenu["key"] | null>(null);
  const [shopByTab, setShopByTab] = useState<ShopByTab>("CATEGORIES");
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const value = query ?? localQuery;
  const activeMenu = AJIO_NAV_MENUS.find((m) => m.key === activeKey) ?? null;

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = (key: TopNavMenu["key"]) => {
    clearCloseTimer();
    if (activeKey !== key) {
      setActiveKey(key);
      setShopByTab("CATEGORIES");
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setActiveKey(null);
      setHoveredLink(null);
    }, 120);
  };

  const closeImmediately = () => {
    clearCloseTimer();
    setActiveKey(null);
    setHoveredLink(null);
  };

  const search = () => {
    const trimmed = value.trim();
    closeImmediately();
    if (onSearch) onSearch(trimmed);
    else router.push({ pathname: "/products", params: trimmed ? { q: trimmed } : {} });
  };

  const navigateFilter = (params: {
    category?: string;
    q?: string;
    sort?: string;
    title?: string;
  }) => {
    closeImmediately();
    router.push({
      pathname: "/products",
      params: {
        ...(params.category ? { category: params.category } : {}),
        ...(params.q ? { q: params.q } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        ...(params.title ? { title: params.title } : {}),
      },
    });
  };

  const webHover = (onEnter: () => void, onLeave?: () => void) =>
    Platform.OS === "web"
      ? ({
          onMouseEnter: onEnter,
          ...(onLeave ? { onMouseLeave: onLeave } : {}),
        } as any)
      : {};

  const columns: MenuGroup[][] = activeMenu
    ? shopByTab === "CATEGORIES"
      ? activeMenu.categoriesColumns
      : activeMenu.brandsColumns
    : [];

  return (
    <View
      {...webHover(clearCloseTimer, scheduleClose)}
      style={[
        s.shell,
        {
          backgroundColor: c.card,
          borderTopColor: c.navy,
        },
        Platform.OS === "web"
          ? ({
              position: "sticky",
              top: 0,
              boxShadow: "0 3px 6px rgba(0, 0, 0, 0.08)",
            } as any)
          : null,
      ]}
    >
      <View style={s.innerWrap}>
        {/* Top-Right Utility Row */}
        <View style={s.utilityRow}>
          <View style={s.utilityLinks}>
            {user ? (
              <>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => {
                    closeImmediately();
                    router.push("/(tabs)/profile");
                  }}
                >
                  <Text style={[s.utilityLink, { color: c.mutedForeground }]}>
                    Hi, {user.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => {
                    closeImmediately();
                    router.push("/(tabs)/orders");
                  }}
                >
                  <Text style={[s.utilityLink, { color: c.mutedForeground }]}>
                    My Orders
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                accessibilityRole="link"
                onPress={() => {
                  closeImmediately();
                  router.push("/auth/login");
                }}
              >
                <Text style={[s.utilityLink, { color: c.mutedForeground }]}>
                  Sign In / Join FLOMA
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => {
                closeImmediately();
                router.push("/help");
              }}
            >
              <Text style={[s.utilityLink, { color: c.mutedForeground }]}>
                Customer Care
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                closeImmediately();
                router.push("/offers");
              }}
              style={s.luxeBtn}
            >
              <Text style={s.luxeBtnText}>Visit FLOMALUXE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Header Row: Logo (Left) + Categories Nav + Search Pill & Icons (Right) */}
        <View style={s.mainRow}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="FLOMA Home"
            onPress={() => {
              closeImmediately();
              router.replace("/");
            }}
            style={s.logoWrap}
          >
            <Text numberOfLines={1} style={[s.logo, { color: c.navy }]}>
              FLOMA
            </Text>
          </TouchableOpacity>

          <View style={s.rightSection}>
            <View style={s.navLinks}>
              {AJIO_NAV_MENUS.map((menu) => {
                const isActive = activeKey === menu.key;
                return (
                  <Pressable
                    key={menu.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${menu.label} menu`}
                    onPress={() =>
                      navigateFilter({
                        category: menu.category,
                        title: menu.title,
                      })
                    }
                    onHoverIn={() => openMenu(menu.key)}
                    {...webHover(() => openMenu(menu.key))}
                    style={[
                      s.navItem,
                      isActive && {
                        borderBottomColor: c.navy,
                        borderBottomWidth: 3,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        s.navText,
                        {
                          color: isActive ? "#111111" : "#333333",
                          fontFamily: isActive
                            ? "GoogleSans_700Bold"
                            : "GoogleSans_500Medium",
                        },
                      ]}
                    >
                      {menu.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.scbCluster}>
              <View
                style={[
                  s.searchWrap,
                  {
                    backgroundColor: c.searchIvory,
                    borderColor: c.navy,
                  },
                ]}
              >
                <TextInput
                  accessibilityLabel="Search FLOMA"
                  placeholder="Search FLOMA"
                  placeholderTextColor="#6E7881"
                  value={value}
                  onChangeText={onChangeQuery || setLocalQuery}
                  onSubmitEditing={search}
                  returnKeyType="search"
                  style={[s.searchInput, { color: c.foreground }]}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                  onPress={search}
                  style={s.searchIconBtn}
                >
                  <Icon name="search-outline" size={18} color="#54626F" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Open wishlist, ${wishlist.items.length} items`}
                onPress={() => {
                  closeImmediately();
                  router.push("/wishlist");
                }}
                style={[s.circleBtn, { backgroundColor: c.navy }]}
              >
                <Icon name="heart-outline" size={18} color="#FFFFFF" />
                {wishlist.items.length > 0 && (
                  <View style={[s.badge, { backgroundColor: c.gold }]}>
                    <Text style={s.badgeText}>
                      {wishlist.items.length > 9 ? "9+" : wishlist.items.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Open bag, ${cart.itemCount} items`}
                onPress={() => {
                  closeImmediately();
                  router.push("/(tabs)/cart");
                }}
                style={[s.circleBtn, { backgroundColor: c.navy }]}
              >
                <Icon name="bag-handle-outline" size={18} color="#FFFFFF" />
                {cart.itemCount > 0 && (
                  <View style={[s.badge, { backgroundColor: c.gold }]}>
                    <Text style={s.badgeText}>
                      {cart.itemCount > 9 ? "9+" : cart.itemCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Ajio Hover Mega-Menu Flyout + Viewport Backdrop Overlay */}
      {activeMenu && (
        <View style={s.flyoutLayer} pointerEvents="box-none">
          {/* Dark dimmed overlay matching Ajio's dp-overlay */}
          <Pressable
            accessibilityLabel="Close category menu"
            onPress={closeImmediately}
            {...webHover(scheduleClose)}
            style={[
              s.backdropOverlay,
              Platform.OS === "web"
                ? ({
                    position: "fixed",
                    top: 90,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "auto",
                  } as any)
                : null,
            ]}
          />

          {/* White Multi-Column Mega-Menu Card */}
          <View
            {...webHover(clearCloseTimer, scheduleClose)}
            style={[
              s.flyoutCard,
              {
                backgroundColor: c.card,
                borderTopColor: c.border,
              },
              Platform.OS === "web"
                ? ({ boxShadow: "0 14px 32px rgba(0, 0, 0, 0.22)" } as any)
                : null,
            ]}
          >
            {/* Shop by: CATEGORIES | BRANDS Tab Row */}
            <View style={[s.shopByBar, { borderBottomColor: "#E8E8E8" }]}>
              <Text style={s.shopByLabel}>Shop by:</Text>
              {(["CATEGORIES", "BRANDS"] as const).map((tab) => {
                const selected = shopByTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setShopByTab(tab)}
                    onHoverIn={() => setShopByTab(tab)}
                    {...webHover(() => setShopByTab(tab))}
                    style={[
                      s.shopByTab,
                      selected && {
                        backgroundColor: "#F6F6F6",
                        borderBottomColor: c.navy,
                        borderBottomWidth: 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.shopByTabText,
                        {
                          color: selected ? "#151515" : "#666666",
                          fontFamily: selected
                            ? "GoogleSans_700Bold"
                            : "GoogleSans_500Medium",
                        },
                      ]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
              <TouchableOpacity
                onPress={() =>
                  navigateFilter({
                    category: activeMenu.category,
                    title: activeMenu.title,
                  })
                }
                style={s.viewAllChip}
              >
                <Text style={[s.viewAllChipText, { color: c.navy }]}>
                  VIEW ALL {activeMenu.label} ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Multi-Column Links Grid */}
            <View style={s.flyoutGrid}>
              {columns.map((colGroups, colIdx) => (
                <View key={`${activeMenu.key}-${shopByTab}-${colIdx}`} style={s.flyoutColumn}>
                  {colGroups.map((group) => {
                    const hasSubItems = !!(group.items && group.items.length > 0);
                    const groupKey = `${colIdx}-${group.title}`;
                    const groupHovered = hoveredLink === groupKey;
                    return (
                      <View
                        key={group.title}
                        style={hasSubItems ? s.groupBlock : s.standaloneBlock}
                      >
                        <Pressable
                          onPress={() =>
                            navigateFilter({
                              category: group.category || activeMenu.category,
                              q: group.q,
                              sort: group.sort,
                              title: group.title,
                            })
                          }
                          onHoverIn={() => setHoveredLink(groupKey)}
                          onHoverOut={() => setHoveredLink(null)}
                          style={s.groupTitleRow}
                        >
                          <Text
                            style={[
                              s.groupTitle,
                              {
                                color: groupHovered ? c.gold : "#222222",
                              },
                            ]}
                          >
                            {group.title}
                          </Text>
                          {group.tag && (
                            <View
                              style={[
                                s.tagPill,
                                {
                                  backgroundColor:
                                    group.tag === "HOT" ? "#D63838" : "#448E4D",
                                },
                              ]}
                            >
                              <Text style={s.tagPillText}>{group.tag}</Text>
                            </View>
                          )}
                        </Pressable>

                        {hasSubItems && (
                          <View style={s.subList}>
                            {group.items!.map((sub: MenuSubLink) => {
                              const subKey = `${groupKey}-${sub.label}`;
                              const subHovered = hoveredLink === subKey;
                              return (
                                <Pressable
                                  key={sub.label}
                                  onPress={() =>
                                    navigateFilter({
                                      category:
                                        sub.category ||
                                        group.category ||
                                        activeMenu.category,
                                      q: sub.q,
                                      sort: sub.sort,
                                      title: sub.title || sub.label,
                                    })
                                  }
                                  onHoverIn={() => setHoveredLink(subKey)}
                                  onHoverOut={() => setHoveredLink(null)}
                                  style={s.subLinkBtn}
                                >
                                  <Text
                                    style={[
                                      s.subLinkText,
                                      {
                                        color: subHovered ? c.navy : "#4A4A4A",
                                        fontFamily: subHovered
                                          ? "GoogleSans_600SemiBold"
                                          : "GoogleSans_400Regular",
                                        textDecorationLine: subHovered
                                          ? "underline"
                                          : "none",
                                      },
                                    ]}
                                  >
                                    {sub.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    borderTopWidth: 3,
    height: 90,
    zIndex: 9999,
    elevation: 20,
    position: "relative",
  },
  innerWrap: {
    width: "100%",
    maxWidth: 1260,
    height: "100%",
    alignSelf: "center",
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  utilityRow: {
    height: 28,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  utilityLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  utilityLink: {
    fontSize: 11.5,
    letterSpacing: 0.2,
    fontFamily: "GoogleSans_400Regular",
  },
  luxeBtn: {
    backgroundColor: "#000000",
    paddingHorizontal: 14,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  luxeBtnText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    letterSpacing: 0.7,
    fontFamily: "GoogleSans_600SemiBold",
  },
  mainRow: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  logoWrap: {
    paddingBottom: 6,
    flexShrink: 0,
  },
  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: 6,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    gap: 24,
    flexShrink: 1,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    gap: 24,
  },
  navItem: {
    height: "100%",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    paddingHorizontal: 4,
    paddingTop: 2,
    flexShrink: 0,
  },
  navText: {
    fontSize: 13.5,
    letterSpacing: 0.55,
  },
  scbCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  searchWrap: {
    height: 36,
    width: 260,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 6,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 34,
    fontSize: 12.5,
    fontFamily: "GoogleSans_400Regular",
    outlineWidth: 0,
  } as any,
  searchIconBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "GoogleSans_700Bold",
  },
  flyoutLayer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 10000,
  },
  backdropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2200,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
  },
  flyoutCard: {
    width: "96%",
    maxWidth: 1220,
    alignSelf: "center",
    borderTopWidth: 1,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    paddingBottom: 24,
    zIndex: 10001,
  },
  shopByBar: {
    height: 46,
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shopByLabel: {
    fontSize: 12.5,
    color: "#777777",
    marginRight: 8,
    fontFamily: "GoogleSans_400Regular",
  },
  shopByTab: {
    height: "100%",
    paddingHorizontal: 18,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  shopByTabText: {
    fontSize: 12.5,
    letterSpacing: 0.7,
  },
  viewAllChip: {
    marginLeft: "auto",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  viewAllChipText: {
    fontSize: 11.5,
    letterSpacing: 0.6,
    fontFamily: "GoogleSans_700Bold",
  },
  flyoutGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 20,
    alignItems: "flex-start",
  },
  flyoutColumn: {
    flex: 1,
    minWidth: 0,
    gap: 14,
  },
  standaloneBlock: {
    marginBottom: 0,
  },
  groupBlock: {
    marginBottom: 4,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  groupTitle: {
    fontSize: 11.5,
    letterSpacing: 0.45,
    fontFamily: "GoogleSans_700Bold",
  },
  tagPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  tagPillText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    letterSpacing: 0.5,
    fontFamily: "GoogleSans_700Bold",
  },
  subList: {
    marginTop: 4,
    gap: 2,
  },
  subLinkBtn: {
    paddingVertical: 2.5,
    alignSelf: "flex-start",
  },
  subLinkText: {
    fontSize: 11.8,
    lineHeight: 17,
  },
});

export default DesktopStoreHeader;
