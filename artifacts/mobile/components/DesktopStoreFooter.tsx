import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Icon } from "./StoreIcon";
import { Text } from "./Text";
import { useColors } from "@/hooks/useColors";
import { useDesktopWeb } from "@/hooks/useDesktopWeb";

function FooterLink({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity accessibilityRole="link" onPress={onPress} style={s.link}>
      <Text style={s.linkText}>{children}</Text>
    </TouchableOpacity>
  );
}

const DIRECTORY_ROWS = [
  {
    heading: "MEN'S CLOTHING & FOOTWEAR",
    links: [
      { label: "Oversized T-Shirts", q: "T-Shirt" },
      { label: "Denim Jackets", q: "Jacket" },
      { label: "Utility Cargos", q: "Cargo" },
      { label: "Knit Polos", q: "Polo" },
      { label: "Zip Hoodies", q: "Hoodie" },
      { label: "Sneakers", category: "footwear" },
      { label: "Running Shoes", q: "Running" },
      { label: "Penny Loafers", q: "Loafers" },
      { label: "Chelsea Boots", q: "Boots" },
    ],
  },
  {
    heading: "WOMEN'S CLOTHING & STYLE",
    links: [
      { label: "Evening Dresses", q: "Dress" },
      { label: "Co-ord Sets", q: "Co-ord" },
      { label: "Crop Tops", q: "Top" },
      { label: "Wide Leg Jeans", q: "Jeans" },
      { label: "Knit Cardigans", q: "Cardigan" },
      { label: "All Women's", category: "women" },
    ],
  },
  {
    heading: "ACCESSORIES, BEAUTY & TECH",
    links: [
      { label: "Crossbody Bags", q: "Bag" },
      { label: "Sunglasses", q: "Sunglasses" },
      { label: "Minimal Watches", q: "Watch" },
      { label: "Backpacks", q: "Backpack" },
      { label: "Glow Serums", category: "beauty" },
      { label: "Fragrances", q: "Parfum" },
      { label: "Smartphones", category: "smartphones" },
      { label: "Audio & Headphones", category: "audio" },
      { label: "Home & Living", category: "home-living" },
    ],
  },
];

const FAQS = [
  {
    q: "What makes FLOMA's curation distinct?",
    a: "FLOMA brings together independent labels, contemporary essentials, footwear, beauty and modern living pieces vetted for craftsmanship, fit and everyday value.",
  },
  {
    q: "How do I redeem a FLOMA offer code?",
    a: "Visit the Offers page or check the offer strip on any product card, copy an active code such as DEMO10, and apply it directly inside your Shopping Bag before checkout.",
  },
  {
    q: "What are the delivery & return terms?",
    a: "Orders enjoy transparent doorstep tracking and easy returns or exchanges. Free shipping unlocks automatically once your bag meets the storefront threshold.",
  },
];

/** Ajio-inspired trust promises, editorial guide, directory links, and slate-navy footer for FLOMA. */
export function DesktopStoreFooter() {
  const desktop = useDesktopWeb();
  const c = useColors();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  if (!desktop) return null;

  const browseCategory = (category: string, title: string) =>
    router.push({ pathname: "/products", params: { category, title } });

  const searchTerm = (q: string) =>
    router.push({ pathname: "/products", params: { q } });

  return (
    <View style={s.root}>
      {/* Ajio-style dark editorial guide & FAQ strip */}
      <View style={s.editorialBand}>
        <View style={s.editorialInner}>
          <Text style={s.editorialHeading}>
            FLOMA Fashion &amp; Lifestyle: Curated Styles at Everyday Value
          </Text>
          <Text style={s.editorialCopy}>
            Discover wardrobe staples, statement silhouettes, precision footwear,
            clean beauty rituals, and modern living essentials on FLOMA. Browse
            seasonal edits, compare member offer prices, and shop seamlessly
            across every category.
          </Text>
          <View style={s.faqList}>
            {FAQS.map((item, idx) => {
              const expanded = openFaq === idx;
              return (
                <TouchableOpacity
                  key={item.q}
                  accessibilityRole="button"
                  onPress={() => setOpenFaq(expanded ? null : idx)}
                  style={s.faqItem}
                >
                  <View style={s.faqHeader}>
                    <Text style={s.faqQuestion}>{item.q}</Text>
                    <Icon
                      name={expanded ? "remove" : "add"}
                      size={16}
                      color="#D4BA98"
                    />
                  </View>
                  {expanded && <Text style={s.faqAnswer}>{item.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Ajio-style 3-column Trust Promises Strip */}
      <View style={[s.promises, { borderColor: c.border, backgroundColor: "#FAFAFA" }]}>
        <View style={s.promisesInner}>
          <View style={s.promise}>
            <View style={s.promiseIconCircle}>
              <Icon name="repeat-outline" size={26} color={c.navy} />
            </View>
            <View>
              <Text style={[s.promiseTitle, { color: c.navy }]}>
                EASY EXCHANGE
              </Text>
              <Text style={[s.promiseText, { color: c.mutedForeground }]}>
                Hassle-free support &amp; returns
              </Text>
            </View>
          </View>

          <View style={s.promise}>
            <View style={s.promiseIconCircle}>
              <Icon name="ribbon-outline" size={26} color={c.navy} />
            </View>
            <View>
              <Text style={[s.promiseTitle, { color: c.navy }]}>
                100% HANDPICKED
              </Text>
              <Text style={[s.promiseText, { color: c.mutedForeground }]}>
                Curated labels &amp; quality edits
              </Text>
            </View>
          </View>

          <View style={s.promise}>
            <View style={s.promiseIconCircle}>
              <Icon name="shield-checkmark-outline" size={26} color={c.navy} />
            </View>
            <View>
              <Text style={[s.promiseTitle, { color: c.navy }]}>
                ASSURED QUALITY
              </Text>
              <Text style={[s.promiseText, { color: c.mutedForeground }]}>
                Verified sellers &amp; safe checkout
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ajio Signature Deep Slate-Navy (#2C4152) Footer */}
      <View style={[s.darkFooter, { backgroundColor: c.navy }]}>
        {/* Quick Category Directory Strip */}
        <View style={s.directoryWrap}>
          {DIRECTORY_ROWS.map((row) => (
            <View key={row.heading} style={s.directoryRow}>
              <Text style={s.directoryHeading}>{row.heading}</Text>
              <View style={s.directoryLinks}>
                {row.links.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() =>
                      "category" in item && item.category
                        ? browseCategory(item.category, item.label)
                        : searchTerm(item.q || item.label)
                    }
                    style={s.directoryChip}
                  >
                    <Text style={s.directoryChipText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={s.footerDivider} />

        {/* 4-Column Footer Links */}
        <View style={s.footerInner}>
          <View style={s.footerColumn}>
            <Text style={s.columnTitle}>FLOMA</Text>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "about" } })}>
              Who We Are
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "terms" } })}>
              Terms &amp; Conditions
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "privacy" } })}>
              We Respect Your Privacy
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "payments" } })}>
              Fees &amp; Payments
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "returns" } })}>
              Returns &amp; Refunds Policy
            </FooterLink>
            <FooterLink onPress={() => router.push("/offers")}>
              Promotions Terms &amp; Conditions
            </FooterLink>
          </View>

          <View style={s.footerColumn}>
            <Text style={s.columnTitle}>Help</Text>
            <FooterLink onPress={() => router.push("/(tabs)/orders")}>
              Track Your Order
            </FooterLink>
            <FooterLink onPress={() => router.push("/help")}>
              Frequently Asked Questions
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "returns" } })}>
              Returns
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "shipping" } })}>
              Shipping &amp; Delivery
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "payments" } })}>
              Payments
            </FooterLink>
            <FooterLink onPress={() => router.push("/help")}>
              Customer Care
            </FooterLink>
            <FooterLink onPress={() => router.push({ pathname: "/help", params: { section: "coupons" } })}>
              How Do I Redeem My Coupon
            </FooterLink>
          </View>

          <View style={s.footerColumn}>
            <Text style={s.columnTitle}>Shop by</Text>
            <FooterLink onPress={() => router.push("/products")}>All</FooterLink>
            <FooterLink onPress={() => browseCategory("men", "Men")}>Men</FooterLink>
            <FooterLink onPress={() => browseCategory("women", "Women")}>Women</FooterLink>
            <FooterLink onPress={() => browseCategory("footwear", "Footwear")}>Footwear</FooterLink>
            <FooterLink onPress={() => browseCategory("accessories", "Accessories")}>Accessories</FooterLink>
            <FooterLink onPress={() => browseCategory("beauty", "Beauty")}>Beauty</FooterLink>
            <FooterLink onPress={() => browseCategory("home-living", "Home & Living")}>Home &amp; Living</FooterLink>
            <FooterLink onPress={() => router.push("/offers")}>Store Offers</FooterLink>
          </View>

          <View style={s.footerColumn}>
            <Text style={s.columnTitle}>Account &amp; Social</Text>
            <FooterLink onPress={() => router.push("/(tabs)/profile")}>My Account</FooterLink>
            <FooterLink onPress={() => router.push("/wishlist")}>My Wishlist</FooterLink>
            <FooterLink onPress={() => router.push("/(tabs)/cart")}>Shopping Bag</FooterLink>
            <FooterLink onPress={() => router.push("/addresses")}>Saved Addresses</FooterLink>
            <FooterLink onPress={() => router.push("/offers")}>FLOMA Luxe Offers</FooterLink>
          </View>
        </View>

        {/* Bottom Payment Methods & Security Bar */}
        <View style={s.footerBottom}>
          <View style={s.footerBottomInner}>
            <View style={s.paymentBlock}>
              <Text style={s.paymentHeading}>Payment methods</Text>
              <View style={s.paymentRow}>
                {["Net Banking", "Verified by VISA", "MasterCard", "Cash on Delivery", "UPI"].map(
                  (method) => (
                    <View key={method} style={s.paymentBadge}>
                      <Text style={s.paymentBadgeText}>{method}</Text>
                    </View>
                  ),
                )}
              </View>
            </View>
            <View style={s.secureBlock}>
              <Text style={s.paymentHeading}>Secure systems</Text>
              <View style={s.secureRow}>
                <Icon name="lock-closed" size={14} color="#D3DDE5" />
                <Text style={s.secureText}>256-BIT ENCRYPTED · © {new Date().getFullYear()} FLOMA</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { marginTop: 44 },
  editorialBand: {
    backgroundColor: "#2C2E30",
    paddingVertical: 32,
    paddingHorizontal: 28,
  },
  editorialInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  editorialHeading: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "GoogleSans_700Bold",
    marginBottom: 8,
  },
  editorialCopy: {
    color: "#C4C9CE",
    fontSize: 12.5,
    lineHeight: 20,
    maxWidth: 960,
  },
  faqList: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#404448",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#404448",
    paddingVertical: 11,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  faqQuestion: {
    color: "#F3F4F6",
    fontSize: 13,
    fontFamily: "GoogleSans_600SemiBold",
  },
  faqAnswer: {
    color: "#B4BBC2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 880,
  },
  promises: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 26,
    paddingHorizontal: 28,
  },
  promisesInner: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: 32,
  },
  promise: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  promiseIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  promiseTitle: {
    fontSize: 13,
    fontFamily: "GoogleSans_700Bold",
    letterSpacing: 0.7,
  },
  promiseText: {
    fontSize: 11.5,
    marginTop: 3,
  },
  darkFooter: {
    paddingTop: 34,
  },
  directoryWrap: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 16,
  },
  directoryRow: {
    gap: 8,
  },
  directoryHeading: {
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: "GoogleSans_700Bold",
  },
  directoryLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  directoryChip: {
    backgroundColor: "#233544",
    borderWidth: 1,
    borderColor: "#466178",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 2,
  },
  directoryChipText: {
    color: "#D3DDE5",
    fontSize: 11,
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#476074",
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    marginBottom: 28,
  },
  footerInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: 28,
    paddingBottom: 34,
    gap: 40,
  },
  footerColumn: {
    flex: 1,
    minWidth: 150,
  },
  columnTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: "GoogleSans_700Bold",
    marginBottom: 14,
    letterSpacing: 0.4,
  },
  link: {
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  linkText: {
    color: "#C8D5DF",
    fontSize: 12,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: "#476074",
    paddingVertical: 20,
    paddingHorizontal: 28,
  },
  footerBottomInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
  },
  paymentBlock: {
    gap: 8,
  },
  paymentHeading: {
    color: "#E5ECF1",
    fontSize: 11,
    fontFamily: "GoogleSans_600SemiBold",
  },
  paymentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentBadge: {
    borderWidth: 1,
    borderColor: "#5C788E",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 2,
    backgroundColor: "#243747",
  },
  paymentBadgeText: {
    color: "#E2EBF1",
    fontSize: 10.5,
    fontFamily: "GoogleSans_600SemiBold",
  },
  secureBlock: {
    alignItems: "flex-end",
    gap: 8,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secureText: {
    color: "#D3DDE5",
    fontSize: 11,
    fontFamily: "GoogleSans_500Medium",
  },
});

export default DesktopStoreFooter;

