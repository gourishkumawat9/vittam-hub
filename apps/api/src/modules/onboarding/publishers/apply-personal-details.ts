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

  // A student is asked which college they study at (BHASKAR asks the same).
  // The persona is known only here, so this is where it is checked.
  const previous = await tx.userProfile.findUnique({ where: { userId }, select: { mobileNumber: true, persona: true } });
  if (previous?.persona === "STUDENT" && !details.studentInstitution) {
    throw new BadRequestException({ message: "Personal details: Add the college or university you study at" });
  }

  // A phone number is verified by a code sent to it. Swapping in a different
  // number must not carry the old number's "verified" along with it.
  const phoneChanged = (previous?.mobileNumber ?? null) !== (details.mobileNumber ?? null);

  await tx.user.update({
    where: { id: userId },
    data: {
      fullName: details.fullName,
      // Removing the photo sends it empty, which is stored as no photo.
      avatarUrl: details.avatarUrl ?? null,
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
    yearsOfExperience: details.yearsOfExperience ?? null,
    studentInstitution: details.studentInstitution ?? null,
    studentCourse: details.studentCourse ?? null,
    graduationYear: details.graduationYear ?? null,
    bhaskarId: details.bhaskarId ?? null,
  };

  await tx.userProfile.update({ where: { userId }, data: profileData });
}
