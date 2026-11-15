"use client";

import { ApiClientError, useDeleteAccount } from "@vittamhub/api-client";
import { Button, Card, Dialog, Input, PasswordInput } from "@vittamhub/ui";
import { useState } from "react";

import { leaveSession } from "@/lib/leave-session";

const CONFIRM_WORD = "DELETE";

/**
 * Deleting is permanent, so it asks for the password again (or, for an
 * account that signs in through Google and has none, the word DELETE typed
 * out). A click on a laptop left open isn't enough.
 */
export function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = hasPassword ? password.length > 0 : typed.trim().toUpperCase() === CONFIRM_WORD;

  const handleOpenChange = (next: boolean) => {
    if (deleteAccount.isPending) return;
    setOpen(next);
    if (!next) {
      setPassword("");
      setTyped("");
      setError(null);
    }
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await deleteAccount.mutateAsync(hasPassword ? { password } : {});
    } catch (err) {
      setError(
        err instanceof ApiClientError && err.status === 429
          ? "Too many attempts. Give it a minute and try again."
          : err instanceof ApiClientError && err.status >= 400 && err.status < 500 && err.status !== 401 && err.apiError.message
            ? err.apiError.message
            : "We couldn't delete your account just now. Nothing was removed. Please try again in a moment.",
      );
      return;
    }
    // A full page load: nothing of the account stays in this tab's memory.
    leaveSession("/");
  };

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-4 border-danger-200">
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="font-heading text-base font-semibold text-text-primary">Delete account</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Removes your account, your public profile, your documents and everything you posted. This can&apos;t be undone.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </Card>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Delete your account?"
        description="This is permanent. You'll be signed out on every device straight away."
      >
        <form onSubmit={handleDelete} className="flex flex-col gap-4" noValidate>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
            <li>Your public profile and, for founders, your startup page are removed.</li>
            <li>Your documents, posts, comments and saved lists are deleted.</li>
            <li>Connect requests nobody has answered yet are withdrawn.</li>
          </ul>

          {hasPassword ? (
            <PasswordInput
              label="Enter your password to confirm"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={error ?? undefined}
            />
          ) : (
            <Input
              label={`Type ${CONFIRM_WORD} to confirm`}
              autoComplete="off"
              autoCapitalize="characters"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              error={error ?? undefined}
            />
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={deleteAccount.isPending}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" disabled={!canSubmit} isLoading={deleteAccount.isPending}>
              Delete my account
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
