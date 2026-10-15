import { View } from 'react-native';

type ViewfinderProps = {
  /** Corner arm length and stroke width in points. */
  size?: number;
  stroke?: number;
  /** Border color class, e.g. `border-accent` or `border-white`. */
  className?: string;
};

const corners = [
  { position: 'top-0 left-0 rounded-tl-xl', top: true, left: true },
  { position: 'top-0 right-0 rounded-tr-xl', top: true, left: false },
  { position: 'bottom-0 left-0 rounded-bl-xl', top: false, left: true },
  { position: 'bottom-0 right-0 rounded-br-xl', top: false, left: false },
] as const;

/** Camera viewfinder corner brackets (the app icon's motif), absolutely filling the parent. */
export function Viewfinder({ size = 28, stroke = 3, className = 'border-accent' }: ViewfinderProps) {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      {corners.map(({ position, top, left }) => (
        <View
          key={position}
          className={`absolute ${position} ${className}`}
          style={{
            width: size,
            height: size,
            borderTopWidth: top ? stroke : 0,
            borderBottomWidth: top ? 0 : stroke,
            borderLeftWidth: left ? stroke : 0,
            borderRightWidth: left ? 0 : stroke,
          }}
        />
      ))}
    </View>
  );
}
