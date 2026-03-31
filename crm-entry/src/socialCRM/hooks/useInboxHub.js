import { useEffect, useRef, useCallback } from "react";
import { createInboxHubConnection } from "../api/inbox.api";

/**
 * Manages a SignalR connection to /hubs/inbox.
 * Pass callbacks for real-time events.
 */
export function useInboxHub({
  brandId,
  conversationId,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onConversationUpdated,
  onConversationDeleted,
  onMessageRead,
  onTyping,
  onBrandSwitched,
  onConnected,
}) {
  const connRef = useRef(null);

  useEffect(() => {
    const conn = createInboxHubConnection();
    connRef.current = conn;

    if (onNewMessage)          conn.on("NewMessage",          onNewMessage);
    if (onMessageUpdated)      conn.on("MessageUpdated",      onMessageUpdated);
    if (onMessageDeleted)      conn.on("MessageDeleted",      onMessageDeleted);
    if (onConversationUpdated) conn.on("ConversationUpdated", onConversationUpdated);
    if (onConversationDeleted) conn.on("ConversationDeleted", onConversationDeleted);
    if (onMessageRead)         conn.on("MessageRead",         onMessageRead);
    if (onTyping)              conn.on("TypingIndicator",     onTyping);
    if (onBrandSwitched)       conn.on("BrandSwitched",       onBrandSwitched);

    conn
      .start()
      .then(async () => {
        if (brandId)        await conn.invoke("JoinBrand", String(brandId)).catch(() => {});
        if (conversationId) await conn.invoke("JoinConversation", conversationId).catch(() => {});
        onConnected?.("connected");
      })
      .catch(() => onConnected?.("failed"));

    return () => {
      conn.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const joinConversation = useCallback(async (id) => {
    if (connRef.current?.state === "Connected")
      await connRef.current.invoke("JoinConversation", id).catch(() => {});
  }, []);

  const leaveConversation = useCallback(async (id) => {
    if (connRef.current?.state === "Connected")
      await connRef.current.invoke("LeaveConversation", id).catch(() => {});
  }, []);

  return { joinConversation, leaveConversation };
}
