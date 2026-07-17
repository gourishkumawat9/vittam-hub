"use client";

import {
  useConnectionMessages,
  useConnections,
  useCurrentUser,
  useSendMessage,
} from "@vittamhub/api-client";
import { Avatar, Button, EmptyState, Textarea } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { MessageCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface MessageFormValues {
  body: string;
}

export default function ConnectionThreadPage() {
  const params = useParams<{ id: string }>();
  const connectionId = params.id;

  const { data: user } = useCurrentUser();
  const { data: connectionsResult } = useConnections({ page: 1, pageSize: 100 });
  const connection = connectionsResult?.items.find((c) => c.id === connectionId);

  const { data: messages, isLoading } = useConnectionMessages(connectionId);
  const sendMessage = useSendMessage(connectionId);

  const { register, handleSubmit, reset } = useForm<MessageFormValues>({ defaultValues: { body: "" } });

  const [sendError, setSendError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async ({ body }) => {
    if (!body.trim()) return;
    setSendError(null);
    try {
      await sendMessage.mutateAsync({ body });
      reset();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Couldn't send that message.");
    }
  });

  if (connection && connection.status !== "ACCEPTED") {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Not available yet"
        description="Messaging unlocks once this connect request is accepted."
      />
    );
  }

  const otherParty = connection && user ? (connection.requesterId === user.id ? connection.recipient : connection.requester) : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {otherParty && (
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Avatar name={otherParty.fullName} src={otherParty.avatarUrl} size="sm" />
          <h1 className="font-heading text-lg font-semibold text-text-primary">{otherParty.fullName}</h1>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading messages…</p>
        ) : messages && messages.length > 0 ? (
          messages.map((message) => {
            const isMine = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-md rounded-card px-4 py-2 text-sm ${
                    isMine ? "bg-brand-primary text-white" : "border border-border bg-surface text-text-primary"
                  }`}
                >
                  {message.body}
                </div>
                <span className="mt-1 text-xs text-text-secondary">{formatRelativeTime(message.createdAt)}</span>
              </div>
            );
          })
        ) : (
          <EmptyState icon={MessageCircle} title="No messages yet" description="Say hello to get the conversation started." />
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-3 border-t border-border pt-4">
        <Textarea rows={2} placeholder="Write a message…" className="flex-1" {...register("body")} />
        <Button type="submit" isLoading={sendMessage.isPending}>
          Send
        </Button>
      </form>
      {sendError && <p className="text-sm text-danger-600">{sendError}</p>}
    </div>
  );
}
