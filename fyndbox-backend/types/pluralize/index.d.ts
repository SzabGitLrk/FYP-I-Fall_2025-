declare function pluralize(
  word: string,
  count?: number,
  inclusive?: boolean,
): string;

declare namespace pluralize {
  function plural(word: string): string;
  function singular(word: string): string;
  function addPluralRule(rule: string | RegExp, replacement: string): void;
  function addSingularRule(rule: string | RegExp, replacement: string): void;
  function addIrregularRule(single: string, plural: string): void;
  function addUncountableRule(word: string | RegExp): void;
  function isPlural(word: string): boolean;
  function isSingular(word: string): boolean;
}

export = pluralize;
export as namespace pluralize;
