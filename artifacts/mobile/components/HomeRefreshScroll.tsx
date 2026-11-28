// Hourglass from Uiverse.io by nima-mollazadeh - https://uiverse.io/nima-mollazadeh/itchy-bulldog-59
// MIT License, Copyright (c) nima-mollazadeh (XoCode).
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Platform, ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const holdHeight = 66;
const maxStretch = 142;
const threshold = 88;

export function HomeRefreshScroll({
  children,
  onRefresh,
}: React.PropsWithChildren<{ onRefresh: () => Promise<void> }>) {
  const reduced = useReducedMotion();
  const container = useRef<View>(null);
  const offset = useRef(0);
  const pull = useRef(new Animated.Value(0)).current;
  const drag = useRef({ eligible: false, distance: 0 });
  const busy = useRef(false);
  const mounted = useRef(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pull.stopAnimation();
    };
  }, [pull]);

  const begin = useCallback(() => {
    drag.current = {
      eligible: !busy.current && offset.current <= 1,
      distance: 0,
    };
  }, []);
  const move = useCallback(
    (dx: number, dy: number) => {
      const state = drag.current;
      if (!state.eligible) return;
      if (state.distance === 0 && (dy < -5 || Math.abs(dx) > Math.max(8, dy))) {
        state.eligible = false;
        return;
      }
      if (dy <= 4 && state.distance === 0) return;
      state.distance = Math.max(0, dy);
      pull.setValue(maxStretch * (1 - Math.exp(-state.distance / 132)));
      setShown(true);
    },
    [pull],
  );
  const settle = useCallback(
    (height: number) => {
      if (reduced) {
        pull.setValue(height);
        if (!height) setShown(false);
        return;
      }
      Animated.spring(pull, {
        toValue: height,
        stiffness: 210,
        damping: 24,
        mass: 0.85,
        overshootClamping: true,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && !height && mounted.current) setShown(false);
      });
    },
    [pull, reduced],
  );
  const end = useCallback(
    async (released: boolean) => {
      const { distance, eligible } = drag.current;
      drag.current = { eligible: false, distance: 0 };
      if (!eligible || busy.current) return;
      if (!released || distance < threshold) {
        settle(0);
        return;
      }
      busy.current = true;
      settle(holdHeight);
      try {
        await Promise.all([
          onRefresh(),
          new Promise((resolve) => setTimeout(resolve, 800)),
        ]);
      } finally {
        busy.current = false;
        if (mounted.current) settle(0);
      }
    },
    [onRefresh, settle],
  );

  // Native scrolling and the pull recognizer observe the same touch sequence.
  const nativeScroll = useMemo(() => Gesture.Native(), []);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .maxPointers(1)
        .activeOffsetY(6)
        .failOffsetX([-16, 16])
        .simultaneousWithExternalGesture(nativeScroll)
        .onBegin(begin)
        .onUpdate((e) => move(e.translationX, e.translationY))
        .onFinalize((_e, success) => {
          void end(success);
        }),
    [begin, move, end, nativeScroll],
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = container.current as unknown as HTMLElement;
    let x = 0,
      y = 0;
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        void end(false);
        return;
      }
      begin();
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    };
    const track = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        void end(false);
        return;
      }
      move(e.touches[0].clientX - x, e.touches[0].clientY - y);
      if (drag.current.distance > 0 && e.cancelable) e.preventDefault();
    };
    const release = () => {
      void end(true);
    };
    const cancel = () => {
      void end(false);
    };
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", track, { passive: false });
    node.addEventListener("touchend", release);
    node.addEventListener("touchcancel", cancel);
    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", track);
      node.removeEventListener("touchend", release);
      node.removeEventListener("touchcancel", cancel);
    };
  }, [begin, move, end]);

  const scroll = (
    <ScrollView
      testID="home-screen"
      bounces={false}
      overScrollMode="never"
      onScroll={(e) => {
        offset.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {children}
    </ScrollView>
  );
  return (
    <View ref={container} style={{ flex: 1, overflow: "hidden" }}>
      <Animated.View
        testID="home-refresh-area"
        style={{
          height: pull,
          overflow: "hidden",
          backgroundColor: "#141216",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {shown && (
          <Image
            testID="refresh-hourglass"
            useAppleWebpCodec={false}
            accessibilityLabel="Refreshing storefront"
            source={
              reduced
                ? require("../assets/refresh/hourglass-still.png")
                : require("../assets/refresh/hourglass.webp")
            }
            style={{ width: 52, height: 52 }}
            contentFit="contain"
          />
        )}
      </Animated.View>
      <Animated.View
        style={{
          flex: 1,
          transformOrigin: "top",
          transform: [
            {
              scaleY: reduced
                ? 1
                : pull.interpolate({
                    inputRange: [0, maxStretch],
                    outputRange: [1, 1.07],
                    extrapolate: "clamp",
                  }),
            },
          ],
        }}
      >
        {Platform.OS === "web" ? (
          scroll
        ) : (
          <GestureDetector gesture={pan}>
            <View collapsable={false} style={{ flex: 1 }}>
              <GestureDetector gesture={nativeScroll}>{scroll}</GestureDetector>
            </View>
          </GestureDetector>
        )}
      </Animated.View>
    </View>
  );
}
