"use client";

import { useCurrentUser } from "@vittamhub/api-client";
import { Skeleton } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { IncubatorHome } from "@/components/dashboard/home/IncubatorHome";
import { MentorHome } from "@/components/dashboard/home/MentorHome";
import { UniversityHome } from "@/components/dashboard/home/UniversityHome";
import { roleHome } from "@/lib/role-home";

/**
 * Home for mentors, incubators and universities (founders, investors and
 * admins have their own). Each is built around that member's own work:
 * mentors their sessions, incubators their programmes, universities their
 * startup cell.
 */
export default function MemberHomePage() {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const home = user ? roleHome(user.role) : null;

  useEffect(() => {
    if (home && home !== "/home") router.replace(home);
  }, [home, router]);

  if (isLoading || !user || home !== "/home") {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-16 w-80 max-w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user.role === "MENTOR") return <MentorHome firstName={user.fullName.split(" ")[0] ?? user.fullName} />;
  if (user.role === "INCUBATOR") return <IncubatorHome />;
  return <UniversityHome />;
}
