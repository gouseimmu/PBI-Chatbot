export function formatTimestamp(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function compactText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

/** Normalizes a Power BI persisted fill/solid color object (or raw string) into a CSS color string. */
export function getColorValue(value: unknown, defaultValue: string): string {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (value && typeof value === 'object') {
    const solidColor = (value as { solid?: { color?: unknown } }).solid?.color;
    if (typeof solidColor === 'string' && solidColor) {
      return solidColor;
    }
  }

  return defaultValue;
}
