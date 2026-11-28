import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let pending = true;
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        pending = false;
        setReduced(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (pending) setReduced(value);
      })
      .catch(() => {});
    return () => {
      pending = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
