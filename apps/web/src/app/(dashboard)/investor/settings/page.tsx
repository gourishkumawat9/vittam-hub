"use client";

import { useDeleteAccount } from "@vittamhub/api-client";
import { Badge, Button, Card, Dialog } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

export default function InvestorSettingsPage() {
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    await deleteAccount.mutateAsync();
    router.push("/login");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Settings</h1>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Theme</h2>
          <p className="text-xs text-text-secondary">Switch between light and dark mode.</p>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Notification settings</h2>
          <p className="text-xs text-text-secondary">Connection requests, meetings, and milestone updates are on by default.</p>
        </div>
        <Badge variant="neutral">Coming soon</Badge>
      </Card>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Privacy</h2>
          <p className="text-xs text-text-secondary">Control who can see your investor profile.</p>
        </div>
        <Badge variant="neutral">Coming soon</Badge>
      </Card>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Investment preferences</h2>
          <p className="text-xs text-text-secondary">Industries, stages, and check size — edit these on your Profile page.</p>
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Language</h2>
          <p className="text-xs text-text-secondary">English only, for now.</p>
        </div>
        <Badge variant="neutral">Coming soon</Badge>
      </Card>

      <Card className="flex items-center justify-between gap-4 border-danger-200 bg-danger-50">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Delete account</h2>
          <p className="text-xs text-text-secondary">Permanently deletes your account and logs you out everywhere.</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          Delete account
        </Button>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="This can't be undone. Your sessions will be logged out immediately."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteAccount.isPending}>
              Yes, delete my account
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">You&apos;ll need to create a new account to use VittamHub again.</p>
      </Dialog>
    </div>
  );
}
