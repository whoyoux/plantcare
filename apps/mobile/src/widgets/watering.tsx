import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type WateringWidgetProps = {
  /** Plants that need water on the entry's day (today or late). */
  count: number;
  title: string;
  /** Shown when nothing needs water, or before the app has run. */
  emptyText: string;
  /** The first few plants, already labelled ("Today", "2 days late"). */
  plants: { name: string; label: string; late: boolean }[];
  /** Deep link to My plants (the scheme differs per app variant). */
  url: string;
};

/**
 * "Water today" for the home screen. Runs in WidgetKit's isolated JS runtime: only @expo/ui
 * components, no hooks, no outside values (colours are inlined for that reason).
 */
const WateringWidget = (props: WateringWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const accent = dark ? '#74d19a' : '#2a7148';
  const danger = dark ? '#ff7a66' : '#c4311f';
  const background = dark ? '#1a221d' : '#f2f5f1';
  const medium = environment.widgetFamily === 'systemMedium';
  const shown = props.plants.slice(0, medium ? 3 : 1);

  const summary = (
    <VStack alignment="leading" spacing={2} modifiers={medium ? [frame({ width: 112, alignment: 'leading' })] : []}>
      <Image systemName="drop.fill" size={18} color={accent} />
      <Spacer />
      <Text modifiers={[font({ size: 40, weight: 'bold', design: 'rounded' }), foregroundStyle(accent)]}>
        {String(props.count)}
      </Text>
      <Text modifiers={[font({ textStyle: 'subheadline', weight: 'semibold' }), lineLimit(2)]}>{props.title}</Text>
    </VStack>
  );

  const list =
    shown.length === 0 ? (
      <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
        {props.emptyText}
      </Text>
    ) : (
      <VStack alignment="leading" spacing={medium ? 8 : 2}>
        {shown.map((plant) => (
          <VStack key={plant.name} alignment="leading" spacing={0}>
            <Text modifiers={[font({ textStyle: medium ? 'subheadline' : 'caption', weight: 'medium' }), lineLimit(1)]}>
              {plant.name}
            </Text>
            <Text
              modifiers={[
                font({ textStyle: 'caption2' }),
                foregroundStyle(plant.late ? danger : { type: 'hierarchical', style: 'secondary' }),
              ]}
            >
              {plant.label}
            </Text>
          </VStack>
        ))}
      </VStack>
    );

  const containerModifiers = [containerBackground(background, 'widget'), widgetURL(props.url)];

  if (medium) {
    return (
      <HStack alignment="top" spacing={12} modifiers={[...containerModifiers, padding({ vertical: 2 })]}>
        {summary}
        <VStack alignment="leading" spacing={0}>
          {list}
          <Spacer />
        </VStack>
        <Spacer />
      </HStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={4} modifiers={containerModifiers}>
      {summary}
      {list}
    </VStack>
  );
};

export default createWidget<WateringWidgetProps>('Watering', WateringWidget, {
  count: 0,
  title: 'Water today',
  emptyText: 'Open PlantCare to see your plants.',
  plants: [],
  url: 'plantcare://plants',
});
