import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Text } from "./Text";
import { useColors } from "@/hooks/useColors";

const edits = [
  {
    name: "T-shirts",
    query: "t-shirt",
    art: require("../assets/campaigns/tee.webp"),
  },
  {
    name: "Denim",
    query: "jeans",
    art: require("../assets/campaigns/jeans.webp"),
  },
  {
    name: "Hoodies",
    query: "hoodie",
    art: require("../assets/campaigns/hoodie.webp"),
  },
  {
    name: "Sneakers",
    query: "sneaker",
    art: require("../assets/campaigns/sneaker.webp"),
  },
  {
    name: "Dresses",
    query: "dress",
    art: require("../assets/campaigns/dress.webp"),
  },
  {
    name: "Knitwear",
    query: "knit",
    art: require("../assets/campaigns/knit.webp"),
  },
  { name: "Bags", query: "bag", art: require("../assets/campaigns/bag.webp") },
  {
    name: "Shades",
    query: "sunglasses",
    art: require("../assets/campaigns/shades.webp"),
  },
];

export function HomeFashionEdits() {
  const c = useColors();
  return (
    <View style={s.section}>
      <View style={s.heading}>
        <Text style={[s.title, { color: c.foreground }]}>Shop by style</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/search")}
        >
          <Text style={{ color: c.foreground, fontSize: 12 }}>
            All categories ›
          </Text>
        </TouchableOpacity>
      </View>
      <View style={s.grid}>
        {edits.map((edit) => (
          <TouchableOpacity
            key={edit.name}
            accessibilityRole="button"
            accessibilityLabel={`Shop ${edit.name}`}
            style={s.tile}
            onPress={() =>
              router.push({ pathname: "/products", params: { q: edit.query } })
            }
          >
            <Image source={edit.art} style={s.photo} contentFit="cover" />
            <Text style={[s.label, { color: c.foreground }]}>{edit.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  section: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 16 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: "GoogleSans_700Bold",
    fontSize: 19,
    letterSpacing: -0.6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12 },
  tile: { width: "25%", alignItems: "center", paddingHorizontal: 3, gap: 4 },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#F0ECE8",
  },
  label: { fontSize: 12, fontFamily: "GoogleSans_500Medium" },
});
