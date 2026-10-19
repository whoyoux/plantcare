import { Gauge, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  resizable,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/**
 * Props are stored in UserDefaults (shared with the widget), which accepts only property-list
 * values: never put null in them (it crashes the app on launch). Empty strings and zeros instead.
 */
export type HerbariumWidgetProps = {
  title: string;
  speciesCount: number;
  /** "9 families", already translated. */
  familiesText: string;
  /** The badge being worked towards; `name` is empty once every badge is earned. */
  next: { name: string; current: number; target: number };
  /** Shown instead of `next` when every badge is earned, or before the app has run. */
  doneText: string;
  /** Latest finds; `image` is a file in the shared widgets directory, or empty. */
  recent: { name: string; image: string }[];
  url: string;
};

/**
 * The herbarium on the home and lock screen: species count, the next badge's progress and the
 * latest finds. WidgetKit's isolated runtime: only @expo/ui, no hooks, no outside values.
 */
const HerbariumWidget = (props: HerbariumWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const accent = dark ? '#74d19a' : '#2a7148';
  const background = dark ? '#1a221d' : '#f2f5f1';
  const hasNext = props.next.name !== '' && props.next.target > 0;
  const progress = hasNext ? Math.min(1, props.next.current / props.next.target) : 1;
  const link = widgetURL(props.url);

  if (environment.widgetFamily === 'accessoryCircular') {
    return (
      <Gauge
        value={progress}
        currentValueLabel={<Text>{String(props.speciesCount)}</Text>}
        modifiers={[gaugeStyle('circularCapacity'), link]}
      >
        <Image systemName="leaf.fill" />
      </Gauge>
    );
  }

  const nextBadge = hasNext ? (
    <VStack alignment="leading" spacing={3}>
      <HStack spacing={4}>
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), lineLimit(1)]}>{props.next.name}</Text>
        <Spacer />
        <Text
          modifiers={[font({ textStyle: 'caption2' }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}
        >
          {`${props.next.current}/${props.next.target}`}
        </Text>
      </HStack>
      <Gauge value={progress} modifiers={[gaugeStyle('linearCapacity'), tint(accent)]} />
    </VStack>
  ) : (
    <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(accent), lineLimit(2)]}>
      {props.doneText}
    </Text>
  );

  const summary = (
    <VStack alignment="leading" spacing={0}>
      <HStack spacing={4}>
        <Image systemName="books.vertical.fill" size={14} color={accent} />
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(accent)]}>
          {props.title}
        </Text>
      </HStack>
      <Text modifiers={[font({ size: 38, weight: 'bold', design: 'rounded' })]}>{String(props.speciesCount)}</Text>
      <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
        {props.familiesText}
      </Text>
    </VStack>
  );

  const container = [containerBackground(background, 'widget'), link];

  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack alignment="top" spacing={14} modifiers={container}>
        <VStack alignment="leading" spacing={0} modifiers={[frame({ width: 104, alignment: 'leading' })]}>
          {summary}
          <Spacer />
        </VStack>
        <VStack alignment="leading" spacing={8}>
          <HStack spacing={6}>
            {props.recent
              .slice(0, 3)
              .map((plant) =>
                plant.image !== '' ? (
                  <Image
                    key={plant.name}
                    uiImage={plant.image}
                    modifiers={[resizable(), frame({ width: 44, height: 44 }), clipShape('roundedRectangle', 10)]}
                  />
                ) : (
                  <Image key={plant.name} systemName="leaf.fill" size={22} color={accent} />
                ),
              )}
          </HStack>
          <Spacer />
          {nextBadge}
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={6} modifiers={container}>
      {summary}
      <Spacer />
      {nextBadge}
    </VStack>
  );
};

export default createWidget<HerbariumWidgetProps>('Herbarium', HerbariumWidget, {
  title: 'Herbarium',
  speciesCount: 0,
  familiesText: '',
  next: { name: '', current: 0, target: 0 },
  doneText: 'Identify a plant to start your collection.',
  recent: [],
  url: 'plantcare://history',
});
