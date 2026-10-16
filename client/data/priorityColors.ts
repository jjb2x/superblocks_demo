/**
 * Color keys for configurable priorities. Kept in sync with PRIORITY_COLORS in
 * server/apis/priorities/shared.ts. Class strings are written out in full so
 * Tailwind can detect them.
 */
export const PRIORITY_COLOR_KEYS = [
  "red", "orange", "amber", "yellow", "green", "teal", "blue", "indigo", "violet", "slate",
] as const;

export type PriorityColor = (typeof PRIORITY_COLOR_KEYS)[number];

interface ColorClasses {
  /** Badge background, text, and border */
  badge: string;
  /** Solid swatch / dot */
  dot: string;
  /** Subtle row highlight */
  row: string;
  label: string;
}

export const PRIORITY_COLOR_CLASSES: Record<PriorityColor, ColorClasses> = {
  red:    { badge: "bg-red-100 text-red-800 border-red-200",          dot: "bg-red-600",    row: "bg-red-50/40",    label: "Red" },
  orange: { badge: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500", row: "bg-orange-50/40", label: "Orange" },
  amber:  { badge: "bg-amber-100 text-amber-800 border-amber-200",    dot: "bg-amber-500",  row: "bg-amber-50/40",  label: "Amber" },
  yellow: { badge: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500", row: "bg-yellow-50/40", label: "Yellow" },
  green:  { badge: "bg-green-100 text-green-800 border-green-200",    dot: "bg-green-600",  row: "bg-green-50/40",  label: "Green" },
  teal:   { badge: "bg-teal-100 text-teal-800 border-teal-200",       dot: "bg-teal-600",   row: "bg-teal-50/40",   label: "Teal" },
  blue:   { badge: "bg-blue-100 text-blue-800 border-blue-200",       dot: "bg-blue-600",   row: "bg-blue-50/40",   label: "Blue" },
  indigo: { badge: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-600", row: "bg-indigo-50/40", label: "Indigo" },
  violet: { badge: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-600", row: "bg-violet-50/40", label: "Violet" },
  slate:  { badge: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-500",  row: "bg-slate-50/40",  label: "Slate" },
};

export function isPriorityColor(value: string): value is PriorityColor {
  return (PRIORITY_COLOR_KEYS as readonly string[]).includes(value);
}

export function colorClassesFor(color: string | undefined): ColorClasses {
  return color && isPriorityColor(color) ? PRIORITY_COLOR_CLASSES[color] : PRIORITY_COLOR_CLASSES.slate;
}
