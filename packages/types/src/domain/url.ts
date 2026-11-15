import { z } from "zod";

const HTTP_URL = /^https?:\/\//i;
/** `scheme:` at the start of an address, as the URL standard spells it. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * A link somebody else will click: `http://` or `https://` only.
 *
 * `z.string().url()` on its own accepts any scheme, including `javascript:`
 * and `data:`. Those run script the moment they are rendered as an `href`, so
 * every address a person types or uploads (website, pitch deck, evidence,
 * video call, attachment) goes through this instead.
 *
 * People type `linkedin.com/in/me` far more often than the full address, so
 * an address with no scheme gets `https://` put in front rather than an error.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048, "That link is too long")
  .transform((value) => (value !== "" && !HAS_SCHEME.test(value) ? `https://${value.replace(/^\/+/, "")}` : value))
  .pipe(
    z
      .string()
      .url("Enter a full link, like https://example.com")
      .refine((value) => HTTP_URL.test(value), { message: "Enter a link that starts with http:// or https://" }),
  );

/**
 * An optional link field in a form. An empty box arrives as `""`, not as a
 * missing value, and `.optional()` alone rejects that: the whole form then
 * fails and the button appears to do nothing. `""` means "no link".
 */
export const optionalHttpUrlSchema = z
  .union([httpUrlSchema, z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

/** True for a string that is safe to use as a link target. For rendering addresses saved before `httpUrlSchema` existed. */
export function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && HTTP_URL.test(value.trim());
}
