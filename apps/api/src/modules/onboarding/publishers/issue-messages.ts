import type { ZodError } from "zod";

/** "pricingModel" -> "Pricing model"; "programs.0.name" -> "Programs 1 name". */
function fieldName(path: (string | number)[]): string {
  const words = path
    .map((part) => (typeof part === "number" ? String(part + 1) : part.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase()))
    .join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * What to tell someone whose profile didn't pass. A field that was simply
 * left out comes back from Zod as a bare "Required", and two of them as
 * "Required, Required", which names nothing: say which field instead.
 * Messages a schema wrote itself ("Add a short headline") are kept as they are.
 */
export function issueMessages(error: ZodError): string {
  const messages = error.issues.map((issue) =>
    issue.message === "Required" && issue.path.length > 0 ? `${fieldName(issue.path)} is required` : issue.message,
  );
  return [...new Set(messages)].join(", ");
}
