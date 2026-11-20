import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
export function Icon({
  name,
  color,
  size = 22,
  style,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  const c = useColors();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color || c.foreground}
      style={style}
    />
  );
}
