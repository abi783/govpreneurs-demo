/**
 * untrustedInput.ts — safe reads of values that arrive from outside.
 * ENTITY LAYER — pure, no imports.
 *
 * A key from a webhook body, a partner fact id or a stored row is untrusted. A
 * bare lookup (`record[key]`) or `key in record` finds the properties that every
 * object inherits, such as `constructor`, `toString` and `__proto__`. So a
 * lookup table then reports an entry that nobody declared. Every module that
 * reads a table with an untrusted key uses the helpers here, and no other idiom.
 */

/** True when the record holds the key as its own property, never as an inherited one. */
export function hasOwnKey(record: object, key: string): boolean {
  return Object.hasOwn(record, key);
}

/** The record's own entry for the key, or `undefined` when the record does not hold it. */
export function ownEntry<T>(record: Readonly<Record<string, T>>, key: string): T | undefined {
  return hasOwnKey(record, key) ? record[key] : undefined;
}

/** True when the value is a string that holds something other than whitespace. */
export function isFilledString(raw: unknown): raw is string {
  return typeof raw === "string" && raw.trim() !== "";
}
