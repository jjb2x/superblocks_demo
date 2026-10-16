/** Turns a rejected API call (plain object, Error, or string) into readable text. */
export function errorMessage(error: unknown, fallback = "Request failed"): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const raw = String((error as { message: unknown }).message);
    // SDK errors look like "Error on line N:\nError: <msg>: <msg>". Show just the message once.
    const cleaned = raw.replace(/^Error on line \d+:\s*/i, "").replace(/^Error:\s*/i, "");
    const half = cleaned.split(": ");
    if (half.length === 2 && half[0] === half[1]) return half[0];
    return cleaned || fallback;
  }
  return fallback;
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "ABORTED")
  );
}
