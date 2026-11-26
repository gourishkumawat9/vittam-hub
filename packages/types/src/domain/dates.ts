import { z } from "zod";

const isDate = (value: string) => !Number.isNaN(Date.parse(value));

/**
 * A date typed into a form ("2026-11-20", or a full ISO moment), or nothing.
 * Text that isn't a date is refused here, so a bad value is a clear message
 * on the field instead of an error from the database.
 */
export const optionalDateStringSchema = z
  .string()
  .max(40)
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine((value) => value === undefined || isDate(value), { message: "Pick a valid date" });

/** A date of birth: a real date, in the past, within a human lifetime. */
export const dateOfBirthSchema = z
  .string()
  .min(1, "Date of birth is required")
  .max(40)
  .refine(
    (value) => {
      if (!isDate(value)) return false;
      const date = new Date(value);
      return date.getTime() < Date.now() && date.getUTCFullYear() >= 1900;
    },
    { message: "Enter a valid date of birth" },
  );

/**
 * A date of birth that may be left out. Most of the profile is optional at
 * sign-up (only what a profile needs to go live is asked for first), so an
 * empty field is accepted, and anything typed still has to be a real date.
 */
export const optionalDateOfBirthSchema = z
  .string()
  .max(40)
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine(
    (value) => {
      if (value === undefined) return true;
      if (!isDate(value)) return false;
      const date = new Date(value);
      return date.getTime() < Date.now() && date.getUTCFullYear() >= 1900;
    },
    { message: "Enter a valid date of birth" },
  );
