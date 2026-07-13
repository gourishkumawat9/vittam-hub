import { BadRequestException } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { personalDetailsInputSchema } from "@vittamhub/types";

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
      message: `Personal details: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    });
  }
  const details = parsed.data;

  await tx.user.update({
    where: { id: userId },
    data: { fullName: details.fullName, avatarUrl: details.avatarUrl },
  });

  const profileData: Prisma.UserProfileUpdateInput = {
    mobileNumber: details.mobileNumber,
    dateOfBirth: new Date(details.dateOfBirth),
    gender: details.gender,
    nationality: details.nationality,
    linkedinUrl: details.linkedinUrl,
    githubUrl: details.githubUrl,
    portfolioUrl: details.portfolioUrl,
    city: details.city,
    state: details.state,
    country: details.country,
    bio: details.bio,
  };

  await tx.userProfile.update({ where: { userId }, data: profileData });
}
