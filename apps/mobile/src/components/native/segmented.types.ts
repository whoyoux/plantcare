export type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  selection: T;
  onChange: (value: T) => void;
};
