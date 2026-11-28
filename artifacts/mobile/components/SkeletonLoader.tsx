import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Shimmer({ children }: React.PropsWithChildren) {
  const progress = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const c = useColors();
  useEffect(() => {
    if (reduced || !width) return;
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, reduced, width]);
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ overflow: "hidden" }}
    >
      {children}
      {!reduced && width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: width * 0.5,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width * 0.5, width],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={[
              "transparent",
              c.background === "#FFFFFF"
                ? "rgba(255,255,255,0.75)"
                : "rgba(255,255,255,0.08)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

export function ProductGridSkeleton() {
  const c = useColors();
  const fill = { backgroundColor: c.border, borderRadius: 6 };
  return (
    <View
      testID="product-grid-skeleton"
      accessible
      accessibilityLabel="Loading products"
      aria-busy
    >
      <Shimmer>
        <View style={{ padding: 6, gap: 16 }}>
          {[0, 1].map((row) => (
            <View key={row} style={{ flexDirection: "row", gap: 10 }}>
              {[0, 1].map((col) => (
                <View key={col} style={{ flex: 1, gap: 8 }}>
                  <View style={[fill, { aspectRatio: 1 }]} />
                  <View style={[fill, { height: 12, width: "78%" }]} />
                  <View style={[fill, { height: 10, width: "42%" }]} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </Shimmer>
    </View>
  );
}
