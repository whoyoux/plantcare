import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

export function useColor(name: string) {
  const value = useCSSVariable(name);
  return typeof value === 'string' ? value : undefined;
}

const glass = isLiquidGlassAvailable();

/**
 * A round button floating on a photo: Liquid Glass where iOS has it, a dark translucent disc
 * elsewhere. Icon-only, so it always carries an accessibility label.
 */
export function GlassCircle({ icon, label, onPress }: { icon: SFSymbol; label: string; onPress: () => void }) {
  const content = <SymbolView name={icon} size={17} weight="semibold" tintColor="white" />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}>
      {glass ? (
        <GlassView glassEffectStyle="regular" isInteractive colorScheme="dark" style={{ borderRadius: 22 }}>
          <View className="size-11 items-center justify-center">{content}</View>
        </GlassView>
      ) : (
        <View className="size-11 items-center justify-center rounded-full bg-black/50">{content}</View>
      )}
    </Pressable>
  );
}

/** A label floating on a photo (name, count, "Toxic"); `tone="danger"` makes it solid red. */
export function PhotoLabel({ children, tone = 'glass' }: { children: ReactNode; tone?: 'glass' | 'danger' }) {
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${tone === 'danger' ? 'bg-danger-fill' : 'bg-black/55'}`}>
      <Text className="text-[13px] font-bold text-white">{children}</Text>
    </View>
  );
}

/**
 * The redesign's buttons: `primary` is a solid pill in the inverse colour (white on dark, ink on
 * light), `secondary` a quiet tinted pill, `danger` a red label on the quiet pill.
 */
export function PillButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: SFSymbol;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const onInverse = useColor('--color-on-inverse');
  const foreground = useColor('--color-foreground');
  const danger = useColor('--color-danger');
  const tint = variant === 'primary' ? onInverse : variant === 'danger' ? danger : foreground;
  const text = variant === 'primary' ? 'text-on-inverse' : variant === 'danger' ? 'text-danger' : 'text-foreground';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-[54px] flex-row items-center justify-center gap-2 rounded-full px-6 active:opacity-80 ${
        variant === 'primary' ? 'bg-inverse' : 'bg-elevated'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      {icon && <SymbolView name={icon} size={17} weight="semibold" tintColor={tint} />}
      <Text className={`text-[17px] font-bold ${text}`}>{label}</Text>
    </Pressable>
  );
}
