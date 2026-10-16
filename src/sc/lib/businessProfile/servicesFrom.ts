/**
 * The member's own services, as radio options for
 * `service_to_sell_to_government` (§4.1 #9) — or undefined when she has not
 * listed any yet. The parameter is structural, not `ApiField`, so this entity
 * module never imports from the component layer.
 */
export function servicesFrom(row: { value: unknown } | undefined): string[] | undefined {
  return row && Array.isArray(row.value) && row.value.length > 0 ? (row.value as string[]) : undefined;
}

/**
 * What such a row says before she has given the list it picks from — never an
 * empty control. Shared by `/intake` and the record's own rows so one question
 * is not explained two ways.
 */
export function pickFromYourListNote(sourceLabel: string): string {
  return `Answer "${sourceLabel}" first — you will pick from your own list.`;
}
