type PluralSuffix = 'zero' | 'two' | 'few' | 'many';

/**
 * Same keys as the source (English) locale, any string values. Extra plural forms
 * (e.g. Polish `_few`/`_many`) are allowed because English only has `_one`/`_other`.
 */
export type Translations<T> = {
  [K in keyof T]: T[K] extends string ? string : Translations<T[K]>;
} & { [K in `${string}_${PluralSuffix}`]?: string };
