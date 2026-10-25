import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useReducedMotion,
  useScrollOffset,
  type SharedValue,
} from 'react-native-reanimated';

/** A ref for an `Animated.ScrollView` plus its live scroll offset, for `ParallaxHero`. */
export function useParallaxScroll() {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(ref);
  return { ref, offset };
}

/**
 * A photo at the top of a scroll view that moves slower than the page (the card below slides over
 * it) and stretches when pulled down, staying pinned to the top. `photo` moves; `children` (labels
 * on the photo) scroll with the page. Off with Reduce Motion.
 */
export function ParallaxHero({
  offset,
  height,
  photo,
  children,
}: {
  offset: SharedValue<number>;
  height: number;
  photo: ReactNode;
  children?: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const style = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    const y = offset.value;
    return {
      transform: [
        { translateY: interpolate(y, [-height, 0, height], [-height / 2, 0, height * 0.75]) },
        { scale: interpolate(y, [-height, 0, height], [2, 1, 1]) },
      ],
    };
  });

  return (
    <View style={{ height }} className="bg-elevated">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>{photo}</Animated.View>
      {children}
    </View>
  );
}
