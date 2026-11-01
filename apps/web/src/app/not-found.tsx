import { Button } from "@vittamhub/ui";
import Link from "next/link";

import { StatusScreen } from "@/components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen eyebrow="404" title="Page not found" description="The page you're looking for doesn't exist or has moved.">
      <Button asChild className="w-full">
        <Link href="/">Back to home</Link>
      </Button>
    </StatusScreen>
  );
}
