import type {
  Connection,
  ConnectionResponseAction,
  CreateConnectionInput,
  CreateMessageInput,
  Message,
} from "@vittamhub/types";

import { apiRequest } from "../http";

export interface ConnectionQuota {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
}

interface ConnectionParty {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

interface ConnectionStartupSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  tagline: string;
}

/** `GET /v1/connections` joins in the requester/recipient/startup so the UI never has to do follow-up fetches per row. */
export interface ConnectionWithRelations extends Connection {
  requester: ConnectionParty;
  recipient: ConnectionParty;
  startup: ConnectionStartupSummary | null;
}

export const connectionsApi = {
  list: () => apiRequest<ConnectionWithRelations[]>("/v1/connections"),
  quota: () => apiRequest<ConnectionQuota>("/v1/connections/quota"),
  create: (input: CreateConnectionInput) => apiRequest<Connection>("/v1/connections", { method: "POST", body: input }),
  respond: (id: string, action: ConnectionResponseAction) =>
    apiRequest<Connection>(`/v1/connections/${id}/respond`, { method: "POST", body: { action } }),
  listMessages: (id: string) => apiRequest<Message[]>(`/v1/connections/${id}/messages`),
  sendMessage: (id: string, input: CreateMessageInput) =>
    apiRequest<Message>(`/v1/connections/${id}/messages`, { method: "POST", body: input }),
};
