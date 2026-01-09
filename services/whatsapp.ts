import { Chat } from "@/types/chat";
import { Message } from "@/types/messages";

export async function getConversations(userId: string): Promise<Chat[]> {
  const res = await fetch(
    `http://localhost:3001/whatsapp/${userId}/conversations`,
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
    `http://localhost:3001/whatsapp/${userId}/messages/${chatId}?limit=${limit}`,
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
  await fetch(`http://localhost:3001/whatsapp/${userId}/messages/${chatId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
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

  await fetch(
    `http://localhost:3001/whatsapp/${userId}/messages/${chatId}/media`,
    {
      method: "POST",
      body: form,
    }
  );
}

export async function getWhatsLogin(userId: string) {
  const res = await fetch(`http://localhost:3001/whatsapp/${userId}/login`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar status do WhatsApp");
  }

  return res.json();
}
