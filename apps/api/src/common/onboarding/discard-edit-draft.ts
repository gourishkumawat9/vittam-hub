import { Prisma } from "@prisma/client";

type ProfileClient = Pick<Prisma.TransactionClient, "userProfile">;

/**
 * Throws away the unsaved wizard edits of someone whose profile is already
 * published.
 *
 * Once a profile is live, its stored onboarding draft is only ever "edits
 * started in the wizard and not saved yet", and that draft is a full copy of
 * the profile as it was when the wizard was opened. When the same profile is
 * then changed somewhere else (the investor profile page, a founder's
 * traction update), the copy is out of date, and saving the wizard later
 * would quietly put the old values back. Dropping it means the wizard next
 * opens on the profile as it really is.
 *
 * Someone still onboarding keeps their draft: it is all they have.
 */
export async function discardProfileEditDraft(db: ProfileClient, userId: string): Promise<void> {
  await db.userProfile.updateMany({
    where: { userId, onboardingStatus: "COMPLETED" },
    data: { onboardingDraft: Prisma.JsonNull },
  });
}
