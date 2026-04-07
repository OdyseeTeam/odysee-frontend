export function isEmpty(object: Record<string, unknown> | null | undefined): boolean {
  return object == null || (object.constructor === Object && Object.entries(object).length === 0);
}
