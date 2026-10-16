import { Icon } from "@/components/ui/icon";

interface UnmatchedPrioritiesNoticeProps {
  unmatched: { value: string; cnt: number }[];
}

/** Warns when exceptions hold a priority value that isn't configured (e.g. edited outside the app). */
export default function UnmatchedPrioritiesNotice({ unmatched }: UnmatchedPrioritiesNoticeProps) {
  if (unmatched.length === 0) return null;
  const total = unmatched.reduce((s, u) => s + u.cnt, 0);

  return (
    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
      <Icon icon="triangle-alert" className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-800">
        <p className="font-medium">
          {total} exception{total === 1 ? "" : "s"} use a priority that isn't configured here
        </p>
        <p className="mt-0.5">
          {unmatched.map((u) => `${u.value} (${u.cnt})`).join(", ")}. Create a priority with the same name to manage them.
        </p>
      </div>
    </div>
  );
}
