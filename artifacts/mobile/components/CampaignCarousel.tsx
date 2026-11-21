import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "./Text";
import { Icon } from "./StoreIcon";
import { openBanner } from "./ShopUI";
import type { ApiBanner } from "@/services/api";

export default function CampaignCarousel({
  banners,
  height = 220,
  headerSpace = 0,
  desktop = false,
  slideWidth,
}: {
  banners: ApiBanner[];
  height?: number;
  headerSpace?: number;
  desktop?: boolean;
  slideWidth?: number;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = slideWidth ?? windowWidth;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<ScrollView>(null);

  const goTo = (index: number) => {
    if (!banners.length) return;
    const target = ((index % banners.length) + banners.length) % banners.length;
    setCurrent(target);
    ref.current?.scrollTo({ x: target * width, animated: true });
  };

  useEffect(() => {
    setCurrent(0);
    ref.current?.scrollTo({ x: 0, animated: false });
  }, [banners.length, width]);

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % banners.length;
        ref.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, width, paused]);

  if (!banners.length) return null;

  return (
    <View style={[s.wrap, { width }]}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {banners.map((b, idx) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={b.title || "Shop campaign"}
            key={b.id}
            onPress={() => openBanner(b)}
            activeOpacity={0.96}
            style={{ width, height, backgroundColor: "#1F2937" }}
          >
            <Image
              source={{ uri: b.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={
                desktop
                  ? ["rgba(18,26,34,0.18)", "rgba(18,26,34,0.12)", "rgba(18,26,34,0.58)"]
                  : ["rgba(0,0,0,.4)", "rgba(0,0,0,.05)", "rgba(0,0,0,.4)"]
              }
              start={desktop ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
              end={desktop ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {desktop ? (
              <View style={s.desktopOverlayWrap}>
                <View
                  style={[
                    s.desktopCard,
                    Platform.OS === "web"
                      ? ({
                          backgroundImage:
                            "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.20) 100%)",
                          backdropFilter: "blur(26px) saturate(185%)",
                          WebkitBackdropFilter: "blur(26px) saturate(185%)",
                          boxShadow:
                            "0 20px 48px rgba(0, 0, 0, 0.30), inset 0 1.5px 1px rgba(255, 255, 255, 0.72), inset 0 -1px 2px rgba(255, 255, 255, 0.22)",
                        } as any)
                      : null,
                  ]}
                >
                  <Text style={s.desktopBrandTag}>
                    FLOMA CURATED · EDIT {String(idx + 1).padStart(2, "0")}
                  </Text>
                  {!!b.title && (
                    <Text numberOfLines={2} style={s.desktopTitle}>
                      {b.title}
                    </Text>
                  )}
                  <View style={s.desktopDivider} />
                  {!!b.subtitle && (
                    <Text numberOfLines={2} style={s.desktopSubtitle}>
                      {b.subtitle}
                    </Text>
                  )}
                  <Text style={s.desktopOfferLine}>MIN. 30–50% OFF*</Text>
                  <View style={s.desktopCta}>
                    <Text style={s.desktopCtaText}>SHOP NOW ›</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View
                style={[
                  s.copy,
                  { paddingTop: headerSpace + 8 },
                  height < 190 && { paddingBottom: 15 },
                ]}
              >
                {!!b.title && (
                  <Text
                    numberOfLines={2}
                    style={[
                      s.title,
                      height < 190 && { fontSize: 18, lineHeight: 21 },
                    ]}
                  >
                    {b.title}
                  </Text>
                )}
                {!!b.subtitle && (
                  <Text
                    numberOfLines={2}
                    style={[
                      s.subtitle,
                      height < 190 && { fontSize: 10, lineHeight: 14 },
                    ]}
                  >
                    {b.subtitle}
                  </Text>
                )}
                <View
                  style={[
                    s.cta,
                    height < 190 && { marginTop: 7, paddingVertical: 5 },
                  ]}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontFamily: "GoogleSans_700Bold",
                    }}
                  >
                    SHOP NOW
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {desktop && banners.length > 1 && (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous banner"
            onPress={() => goTo(current - 1)}
            style={[s.arrowBtn, s.arrowLeft]}
          >
            <Icon name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next banner"
            onPress={() => goTo(current + 1)}
            style={[s.arrowBtn, s.arrowRight]}
          >
            <Icon name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={paused ? "Resume slideshow" : "Pause slideshow"}
            onPress={() => setPaused((p) => !p)}
            style={s.pauseBtn}
          >
            <Icon name={paused ? "play" : "pause"} size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      {banners.length > 1 && (
        <View style={desktop ? s.desktopDots : s.dotsWrap}>
          <View style={desktop ? s.desktopDotsRow : s.dotsPill}>
            {banners.map((b, i) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => goTo(i)}
                accessibilityLabel={`Slide ${i + 1}`}
                style={{
                  height: desktop ? 3 : 4,
                  width: desktop
                    ? i === current
                      ? 24
                      : 12
                    : i === current
                      ? 12
                      : 4,
                  borderRadius: desktop ? 1.5 : 3,
                  backgroundColor:
                    i === current ? "#FFFFFF" : "rgba(255,255,255,0.48)",
                }}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingBottom: 25,
    maxWidth: 300,
  },
  title: {
    fontSize: 28,
    lineHeight: 30,
    color: "#fff",
    fontFamily: "GoogleSans_700Bold",
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#fff",
    maxWidth: 215,
    marginTop: 7,
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: "#111",
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  dotsWrap: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dotsPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  desktopOverlayWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 72,
  },
  desktopCard: {
    backgroundColor: "rgba(15, 23, 42, 0.30)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.50)",
    paddingVertical: 28,
    paddingHorizontal: 32,
    width: 390,
    maxWidth: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  desktopBrandTag: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    color: "#FDE68A",
    fontFamily: "GoogleSans_700Bold",
    marginBottom: 8,
  },
  desktopTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "GoogleSans_700Bold",
    letterSpacing: 0.5,
  },
  desktopDivider: {
    width: 48,
    height: 1.5,
    backgroundColor: "rgba(253, 230, 138, 0.72)",
    marginVertical: 12,
  },
  desktopSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.90)",
    textAlign: "center",
    marginBottom: 12,
  },
  desktopOfferLine: {
    fontSize: 19,
    color: "#FFFFFF",
    fontFamily: "GoogleSans_700Bold",
    letterSpacing: 0.6,
    marginBottom: 16,
  },
  desktopCta: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.62)",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 22,
    backgroundColor: "rgba(255, 255, 255, 0.20)",
  },
  desktopCtaText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    letterSpacing: 1.1,
    fontFamily: "GoogleSans_700Bold",
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 38,
    height: 44,
    backgroundColor: "rgba(17, 24, 39, 0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: {
    left: 16,
  },
  arrowRight: {
    right: 16,
  },
  pauseBtn: {
    position: "absolute",
    left: 16,
    bottom: 14,
    width: 30,
    height: 30,
    backgroundColor: "rgba(17, 24, 39, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  desktopDots: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  desktopDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
});
