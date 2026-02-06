import { toast } from "sonner";
import { Chat } from "@/types/chat";
import { Message } from "@/types/messages";

const WHATSAPP_BASE_URL = `${process.env.NEXT_PUBLIC_WHATS_URL}/whatsapp`;

export type BatchMessageItem =
  | {
      type: "text";
      message: string;
    }
  | {
      type: "media";
      data: string;
      mimetype: string;
      filename?: string;
      caption?: string;
    };

export type BatchSendTiming = {
  intervalMs?: number;
  bigIntervalMs?: number;
  messagesUntilBigInterval?: number;
};

function getWhatsappToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function buildWhatsappUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${WHATSAPP_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value)
    );
  }

  const token = getWhatsappToken();
  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}

export async function getConversations(userId: string): Promise<Chat[]> {
  const res = await fetch(
    buildWhatsappUrl(`/${userId}/conversations`),
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Erro ao buscar conversas");
  }

  return res.json();
}

export async function fetchMessages(
  userId: string,
  chatId: string,
  limit = 50
): Promise<Message[]> {
  const res = await fetch(
    buildWhatsappUrl(`/${userId}/messages/${chatId}`, {
      limit: String(limit),
    }),
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Erro ao buscar mensagens");
  }

  return res.json();
}

export async function sendMessage(
  userId: string,
  chatId: string,
  message: string
) {
  const token = getWhatsappToken();

  await fetch(buildWhatsappUrl(`/${userId}/messages/${chatId}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...(token ? { token } : {}) }),
  });
}

export async function replyToMessage(
  userId: string,
  messageId: string,
  message: string
) {
  const token = getWhatsappToken();

  await fetch(buildWhatsappUrl(`/${userId}/messages/${messageId}/reply`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...(token ? { token } : {}) }),
  });
}

export async function editMessage(
  userId: string,
  messageId: string,
  message: string
) {
  const token = getWhatsappToken();

  await fetch(buildWhatsappUrl(`/${userId}/messages/${messageId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...(token ? { token } : {}) }),
  });
}

export type SendNumberMessageResponse = {
  success: true;
  chat: Chat;
  normalizedNumber: string;
};

export async function sendMessageToNumber(
  userId: string,
  number: string,
  message: string
): Promise<SendNumberMessageResponse> {
  const token = getWhatsappToken();
  const res = await fetch(buildWhatsappUrl(`/${userId}/messages/number`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      number,
      message,
      ...(token ? { token } : {}),
    }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.error || "Erro ao enviar mensagem");
  }

  return payload;
}

export async function sendMediaMessage(
  userId: string,
  chatId: string,
  file: File,
  caption?: string
) {
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);
  const token = getWhatsappToken();
  if (token) form.append("token", token);

  await fetch(
    buildWhatsappUrl(`/${userId}/messages/${chatId}/media`),
    {
      method: "POST",
      body: form,
    }
  );
}

export async function getWhatsLogin(userId: string) {
  const res = await fetch(buildWhatsappUrl(`/${userId}/login`), {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar status do WhatsApp");
  }

  return res.json();
}

export async function sendBatchMessages(
  userId: string,
  chatIds: string[],
  items: BatchMessageItem[],
  paramsByChatId?: Record<string, Record<string, string>>,
  timing?: BatchSendTiming
) {
  const token = getWhatsappToken();
  const res = await fetch(buildWhatsappUrl(`/${userId}/messages/batch`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatIds,
      items,
      paramsByChatId,
      ...timing,
      ...(token ? { token } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error("Erro ao enviar mensagens em lote");
  }

  return res.json();
}

export async function removeWhatsSession(userId: string) {
  const res = await fetch(buildWhatsappUrl(`/${userId}/session`), {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Erro ao remover sessão do WhatsApp");
  }

  return res.json();
}

export async function toggleArchiveChat(
  userId: string,
  chatId: string,
  arquivar: boolean
) {
  const token = getWhatsappToken();
  const res = await fetch(buildWhatsappUrl(`/${userId}/arquivar`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      arquivar,
      ...(token ? { token } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error("Erro ao arquivar conversa");
  }

  return res.json().catch(() => null);
}

export type AddressBookContactPayload = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
};

export async function upsertAddressBookContact(
  userId: string,
  payload: AddressBookContactPayload
) {
  const res = await fetch(buildWhatsappUrl(`/${userId}/addressbook/contact`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      "Erro ao salvar contato no catálogo.";
    toast.error(message);
    throw new Error(message);
  }

  return data;
}
