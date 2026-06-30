export function stringifyJson(value) {
  if (value == null) return null;
  return JSON.stringify(value);
}

export function parseJson(value, fallback = null) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
