import { BadRequestException } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { personalDetailsInputSchema } from "@vittamhub/types";

import { issueMessages } from "./issue-messages";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Every role's onboarding starts with the same "Personal Details" step —
 * this is the one place that writes it into User + UserProfile, called by
 * every per-role publisher so the parsing/validation isn't duplicated seven times.
 */
export async function applyPersonalDetails(tx: Tx, userId: string, rawPersonalDetails: unknown): Promise<void> {
  const parsed = personalDetailsInputSchema.safeParse(rawPersonalDetails);
  if (!parsed.success) {
    throw new BadRequestException({
      message: `Personal details: ${issueMessages(parsed.error)}`,
    });
  }
  const details = parsed.data;

  // A phone number is verified by a code sent to it. Swapping in a different
  // number must not carry the old number's "verified" along with it.
  const previous = await tx.userProfile.findUnique({ where: { userId }, select: { mobileNumber: true } });
  const phoneChanged = (previous?.mobileNumber ?? null) !== (details.mobileNumber ?? null);

  await tx.user.update({
    where: { id: userId },
    data: {
      fullName: details.fullName,
      avatarUrl: details.avatarUrl,
      ...(phoneChanged ? { phoneVerifiedAt: null } : {}),
    },
  });

  const profileData: Prisma.UserProfileUpdateInput = {
    mobileNumber: details.mobileNumber,
    // Optional since sign-up asks only for the essentials: left out (or cleared) is stored as empty.
    dateOfBirth: details.dateOfBirth ? new Date(details.dateOfBirth) : null,
    gender: details.gender ?? null,
    nationality: details.nationality ?? null,
    linkedinUrl: details.linkedinUrl,
    githubUrl: details.githubUrl,
    portfolioUrl: details.portfolioUrl,
    city: details.city,
    state: details.state ?? null,
    country: details.country ?? null,
    bio: details.bio,
    yearsOfExperience: details.yearsOfExperience,
  };

  await tx.userProfile.update({ where: { userId }, data: profileData });
}
