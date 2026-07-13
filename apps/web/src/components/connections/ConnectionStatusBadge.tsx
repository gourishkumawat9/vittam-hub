import type { ConnectionStatus } from "@vittamhub/types";
import { Badge } from "@vittamhub/ui";

const STATUS_VARIANT: Record<ConnectionStatus, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  IGNORED: "neutral",
  WITHDRAWN: "neutral",
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  IGNORED: "Ignored",
  WITHDRAWN: "Withdrawn",
};

export function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
