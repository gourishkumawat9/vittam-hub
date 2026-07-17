import type {
  Connection,
  ConnectionListFilters,
  ConnectionResponseAction,
  CreateConnectionInput,
  CreateMessageInput,
  Message,
  Meeting,
  PaginatedResult,
  ScheduleMeetingInput,
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

export interface MeetingWithConnection extends Meeting {
  connection: {
    id: string;
    requester: { fullName: string };
    recipient: { fullName: string };
    startup: { name: string; logoUrl: string | null } | null;
  };
}

export const connectionsApi = {
  list: (filters: ConnectionListFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<ConnectionWithRelations>>(`/v1/connections?${params.toString()}`);
  },
  quota: () => apiRequest<ConnectionQuota>("/v1/connections/quota"),
  listMyMeetings: () => apiRequest<MeetingWithConnection[]>("/v1/connections/meetings"),
  create: (input: CreateConnectionInput) => apiRequest<Connection>("/v1/connections", { method: "POST", body: input }),
  respond: (id: string, action: ConnectionResponseAction) =>
    apiRequest<Connection>(`/v1/connections/${id}/respond`, { method: "POST", body: { action } }),
  listMessages: (id: string) => apiRequest<Message[]>(`/v1/connections/${id}/messages`),
  sendMessage: (id: string, input: CreateMessageInput) =>
    apiRequest<Message>(`/v1/connections/${id}/messages`, { method: "POST", body: input }),
  requestInfo: (id: string) => apiRequest<Connection>(`/v1/connections/${id}/request-info`, { method: "POST" }),
  listMeetings: (id: string) => apiRequest<Meeting[]>(`/v1/connections/${id}/meetings`),
  scheduleMeeting: (id: string, input: ScheduleMeetingInput) =>
    apiRequest<Meeting>(`/v1/connections/${id}/meetings`, { method: "POST", body: input }),
};
