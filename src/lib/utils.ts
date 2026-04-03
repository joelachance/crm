const productTagPalette = [
  "#7dd3fc",
  "#86efac",
  "#f9a8d4",
  "#fca5a5",
  "#c4b5fd",
  "#fdba74",
  "#93c5fd",
  "#fcd34d"
];

const chicagoDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

function formatChicagoDateTime(date: Date) {
  const parts = chicagoDateTimeFormatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;
}

export function nullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function boolFromFormData(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function localDateTimeInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return formatChicagoDateTime(new Date(value));
}

export function currentCentralDateTimeInputValue() {
  return formatChicagoDateTime(new Date());
}

export function prettyDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Chicago",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function normalizeProductTagColor(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  return /^#[0-9a-f]{6}$/.test(trimmed) ? trimmed : null;
}

export function defaultProductTagColor(name: string) {
  const source = name.trim().toLowerCase();

  if (!source) {
    return productTagPalette[0];
  }

  let hash = 0;

  for (const character of source) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return productTagPalette[hash % productTagPalette.length] ?? productTagPalette[0];
}

export function productTagColorStyles(color: string) {
  const normalized = normalizeProductTagColor(color) ?? productTagPalette[0];

  return {
    borderColor: `${normalized}55`,
    backgroundColor: `${normalized}1a`,
    color: normalized
  };
}
