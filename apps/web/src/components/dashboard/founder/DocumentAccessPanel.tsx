"use client";

import { useConnections, useDocumentGrants, useGrantDocumentAccess, useRevokeDocumentGrant } from "@vittamhub/api-client";
import { Badge, Button, Select } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Eye, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

/**
 * Bundle 21 — the permissioned data room, founder-facing half: grant an
 * accepted-connection investor time-boxed access to a gated document, see
 * who currently has it, and how many times they've actually opened it
 * ("Blume opened your deck twice").
 */
export function DocumentAccessPanel({ documentId }: { documentId: string }) {
  const { data: connections } = useConnections({ status: ["ACCEPTED"], page: 1, pageSize: 100 });
  const { data: grants, isLoading } = useDocumentGrants(documentId);
  const grantAccess = useGrantDocumentAccess(documentId);
  const revokeGrant = useRevokeDocumentGrant(documentId);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [requireNda, setRequireNda] = useState(false);

  const investorOptions = (connections?.items ?? []).map((c) => ({ label: c.recipient.fullName, value: c.recipient.id }));

  const handleGrant = () => {
    if (!selectedInvestorId) return;
    grantAccess.mutate({ grantedToId: selectedInvestorId, expiresInDays: 14, requireNda });
    setSelectedInvestorId("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-background-secondary p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Select
            label="Share with"
            placeholder={investorOptions.length ? "Choose an investor…" : "No accepted connections yet"}
            options={investorOptions}
            value={selectedInvestorId}
            onChange={setSelectedInvestorId}
            disabled={investorOptions.length === 0}
          />
        </div>
        <label className="flex items-center gap-1.5 pb-2 text-xs text-text-secondary">
          <input type="checkbox" checked={requireNda} onChange={(e) => setRequireNda(e.target.checked)} className="rounded border-border" />
          Require NDA
        </label>
        <Button size="sm" onClick={handleGrant} disabled={!selectedInvestorId || grantAccess.isPending}>
          Grant 14-day access
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-text-secondary">Loading access list…</p>
      ) : grants && grants.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {grants.map((grant) => {
            const expired = new Date(grant.expiresAt) < new Date();
            const active = !grant.revokedAt && !expired;
            return (
              <li key={grant.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-text-primary">{grant.grantedTo.fullName}</span>
                  <span className="flex items-center gap-2 text-text-secondary">
                    <Eye className="h-3 w-3" /> {grant.viewCount} view{grant.viewCount === 1 ? "" : "s"}
                    {grant.lastViewedAt && ` · last ${formatRelativeTime(grant.lastViewedAt)}`}
                    {grant.requireNda && !grant.ndaAcceptedAt && (
                      <span className="flex items-center gap-1 text-warning-600">
                        <ShieldAlert className="h-3 w-3" /> NDA pending
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={active ? "success" : "neutral"}>
                    {grant.revokedAt ? "Revoked" : expired ? "Expired" : `Expires ${formatRelativeTime(grant.expiresAt)}`}
                  </Badge>
                  {active && (
                    <button
                      type="button"
                      onClick={() => revokeGrant.mutate(grant.id)}
                      className="text-text-secondary hover:text-danger-600"
                      aria-label="Revoke access"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-text-secondary">No one has been granted access to this document yet.</p>
      )}
    </div>
  );
}
