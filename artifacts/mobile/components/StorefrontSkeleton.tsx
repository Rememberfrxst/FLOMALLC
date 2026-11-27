import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, StyleSheet, View } from "react-native";
import type { DimensionValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const departments = [0, 1, 2, 3, 4];

export default function StorefrontSkeleton({
  desktop,
  heroHeight,
}: {
  desktop: boolean;
  heroHeight: number;
}) {
  const colors = useColors();
  const { top } = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 850,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    let active = true;
    let preferenceChanged = false;
    const updateMotion = (reduce: boolean) => {
      pulse.stop();
      opacity.setValue(1);
      if (!reduce) pulse.start();
    };
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduce) => {
        preferenceChanged = true;
        updateMotion(reduce);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (active && !preferenceChanged) updateMotion(reduce);
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
      pulse.stop();
    };
  }, [opacity]);

  const fill = colors.background === "#FFFFFF" ? "#DFE7ED" : colors.border;
  const block = (
    height: number,
    width: DimensionValue = "100%",
    borderRadius = 6,
  ) => <View style={{ backgroundColor: fill, height, width, borderRadius }} />;

  return (
    <View
      testID="storefront-skeleton"
      accessible
      accessibilityLabel="Loading storefront"
      aria-busy={true}
      style={[
        styles.screen,
        { paddingTop: top, backgroundColor: colors.background },
      ]}
    >
      <Animated.View style={{ opacity }} aria-hidden>
        <View style={styles.header}>
          {block(25, 55)}
          <View style={{ flex: 1 }}>{block(36)}</View>
          {block(26, 26, 13)}
        </View>
        <View style={styles.row}>
          {departments.map((index) => (
            <View key={index} style={styles.column}>
              {block(13)}
            </View>
          ))}
        </View>
        {block(heroHeight, "100%", 0)}
        <View style={styles.row}>
          {block(16, "62%")}
          {block(16, "23%")}
        </View>
        {(desktop ? [0] : [0, 1]).map((row) => (
          <View key={row} style={styles.row}>
            {departments.map((index) => (
              <View key={index} style={styles.category}>
                <View
                  style={{
                    backgroundColor: fill,
                    width: "100%",
                    maxWidth: 80,
                    aspectRatio: 1,
                    borderRadius: 999,
                  }}
                />
                {block(10, "76%")}
              </View>
            ))}
          </View>
        ))}
        <View style={styles.row}>{block(13, "34%")}</View>
        <View style={styles.row}>
          {departments.slice(0, desktop ? 4 : 2).map((index) => (
            <View key={index} style={[styles.column, styles.product]}>
              {block(160)}
              {block(12, "70%")}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    height: 56,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  column: { flex: 1 },
  category: { flex: 1, alignItems: "center", gap: 8 },
  product: { gap: 8 },
});
