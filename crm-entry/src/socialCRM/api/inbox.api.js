import api from "./apiClient";
import { BASE_URL } from "./apiClient";
import { getAccessToken } from "../../utils/authStorage";
import * as signalR from "@microsoft/signalr";

const HUB_URL = BASE_URL.replace("/api", "") + "/hubs/inbox";

// ── Conversations ─────────────────────────────────────────────────────────
export const getConversations = (params = {}) =>
  api.get("/inbox/conversations", { params }).then((r) => r.data);

export const getMessages = (conversationId, params = {}) =>
  api.get(`/inbox/conversations/${conversationId}/messages`, { params }).then((r) => r.data);

export const sendMessage = (conversationId, payload) =>
  api.post(`/inbox/conversations/${conversationId}/messages`, payload).then((r) => r.data);

export const updateMessage = (conversationId, messageId, payload) =>
  api.put(`/inbox/conversations/${conversationId}/messages/${messageId}`, payload).then((r) => r.data);

export const deleteMessage = (conversationId, messageId) =>
  api.delete(`/inbox/conversations/${conversationId}/messages/${messageId}`).then((r) => r.data);

export const markConversationRead = (conversationId) =>
  api.patch(`/inbox/conversations/${conversationId}/read`);

export const assignConversation = (conversationId, userId, userName) =>
  api.patch(`/inbox/conversations/${conversationId}/assign`, { userId, userName }).then((r) => r.data);

export const updateConversationStatus = (conversationId, status) =>
  api.patch(`/inbox/conversations/${conversationId}/status`, { status }).then((r) => r.data);

export const deleteConversation = (conversationId) =>
  api.delete(`/inbox/conversations/${conversationId}`).then((r) => r.data);

// ── Sync: pull existing conversations from Facebook/Instagram Graph API ───
export const syncInbox = () =>
  api.post("/inbox/sync").then((r) => r.data);

// ── Unread count for bell icon badge ─────────────────────────────────────
export const getUnreadCount = () =>
  api.get("/inbox/unread-count").then((r) => r.data);

// ── SignalR connection factory ────────────────────────────────────────────
export function createInboxHubConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => getAccessToken() || "" })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}
