import { apiFetch } from "./api";
import { Chat } from "@/types/chat";
import { Message } from "@/types/messages";

type BackupChatPayload = {
  id?: string | number;
  chatWhatsappId?: string | number;
  chatId?: string | number;
  nome?: string;
  name?: string;
  nomeChat?: string;
  isGroup?: boolean;
  grupo?: boolean;
  unreadCount?: number;
  naoLidas?: number;
  profilePicUrl?: string | null;
  fotoPerfilUrl?: string | null;
  fotoUrl?: string | null;
  lastMessage?: {
    body?: string;
    timestamp?: number | string;
  } | null;
  ultimaMensagem?: string | null;
  ultimaMensagemTexto?: string | null;
  ultimaMensagemTimestamp?: number | string | null;
  ultimaMensagemData?: number | string | null;
  dataUltimaMensagem?: number | string | null;
};

type BackupMessagePayload = {
  id?: string | number;
  mensagemWhatsappId?: string | number;
  messageId?: string | number;
  body?: string | null;
  mensagem?: string | null;
  texto?: string | null;
  conteudo?: string | null;
  fromMe?: boolean;
  enviadaPorMim?: boolean;
  sentByMe?: boolean;
  timestamp?: number | string;
  dataHora?: number | string;
  data?: number | string;
  type?: Message["type"] | string;
  hasMedia?: boolean;
  mediaUrl?: string | null;
  midiaUrl?: string | null;
  urlMidia?: string | null;
  mimetype?: string | null;
  mimeType?: string | null;
  tipoMidia?: string | null;
  filename?: string | null;
  nomeArquivo?: string | null;
  author?: string | null;
  autor?: string | null;
  remetente?: string | null;
};

function parseTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    const dateValue = Date.parse(value);
    if (!Number.isNaN(dateValue)) {
      return Math.floor(dateValue / 1000);
    }
  }

  return null;
}

function normalizeChat(payload: BackupChatPayload): Chat {
  const chatId = String(
    payload.chatWhatsappId ?? payload.id ?? payload.chatId ?? ""
  );
  const name = payload.nome ?? payload.name ?? payload.nomeChat ?? "Conversa";
  const lastMessageBody =
    payload.lastMessage?.body ??
    payload.ultimaMensagemTexto ??
    payload.ultimaMensagem ??
    "";
  const lastMessageTimestamp = parseTimestamp(
    payload.lastMessage?.timestamp ??
      payload.ultimaMensagemTimestamp ??
      payload.ultimaMensagemData ??
      payload.dataUltimaMensagem
  );
  const hasLastMessage = Boolean(lastMessageBody) || lastMessageTimestamp;

  return {
    id: chatId,
    name,
    isGroup: payload.isGroup ?? payload.grupo ?? false,
    unreadCount: payload.unreadCount ?? payload.naoLidas ?? 0,
    profilePicUrl:
      payload.profilePicUrl ?? payload.fotoPerfilUrl ?? payload.fotoUrl ?? null,
    lastMessage: hasLastMessage
      ? {
          body: String(lastMessageBody ?? ""),
          timestamp: lastMessageTimestamp ?? 0,
        }
      : null,
  };
}

function normalizeMessage(payload: BackupMessagePayload): Message {
  const body =
    payload.body ?? payload.mensagem ?? payload.texto ?? payload.conteudo ?? "";
  const timestamp = parseTimestamp(
    payload.timestamp ?? payload.dataHora ?? payload.data
  );
  const mediaUrl = payload.mediaUrl ?? payload.midiaUrl ?? payload.urlMidia;
  const hasMedia = payload.hasMedia ?? Boolean(mediaUrl);
  const rawType = payload.type ?? "chat";
  const type: Message["type"] =
    rawType === "image" ||
    rawType === "video" ||
    rawType === "audio" ||
    rawType === "sticker" ||
    rawType === "document"
      ? rawType
      : "chat";
  const id = String(
    payload.id ??
      payload.mensagemWhatsappId ??
      payload.messageId ??
      `${timestamp ?? 0}-${String(body ?? "").slice(0, 12)}`
  );

  return {
    id,
    body: String(body ?? ""),
    fromMe:
      payload.fromMe ?? payload.enviadaPorMim ?? payload.sentByMe ?? false,
    timestamp: timestamp ?? 0,
    type,
    hasMedia,
    mediaUrl: mediaUrl ?? undefined,
    mimetype:
      payload.mimetype ?? payload.mimeType ?? payload.tipoMidia ?? undefined,
    filename: payload.filename ?? payload.nomeArquivo ?? undefined,
    author: payload.author ?? payload.autor ?? payload.remetente ?? undefined,
  };
}

export async function getBackupConversations(userId: string): Promise<Chat[]> {
  const data = (await apiFetch(
    `/whatsapp/conversas/usuario/${userId}`,
    {
      method: "GET",
    }
  )) as BackupChatPayload[];

  return (data ?? []).map(normalizeChat);
}

export async function fetchBackupMessages(
  chatId: string,
  limit = 50
): Promise<Message[]> {
  const data = (await apiFetch(`/whatsapp/conversas/${chatId}/mensagens`, {
    method: "GET",
  })) as BackupMessagePayload[];

  const normalized = (data ?? []).map(normalizeMessage);

  if (!limit || normalized.length <= limit) {
    return normalized;
  }

  return normalized.slice(-limit);
}
