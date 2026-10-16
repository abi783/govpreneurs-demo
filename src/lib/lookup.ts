// Own-property lookup for the client's label/catalog tables.
//
// Every one of those tables is indexed by a string a server (or a model) chose:
// `gap.kind`, `row.tier`, `ask.field`. A plain `TABLE[key]` walks the prototype
// chain, so `__proto__` resolves to an object and `constructor`/`valueOf` to a
// function — neither is a label, and React throws on both ("Objects are not
// valid as a React child"). Same class as the backend's `switch_tab.tab`.

/** The table's OWN value for `key`, or undefined — a prototype key never
 *  resolves. */
export function lookupOwn<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}
