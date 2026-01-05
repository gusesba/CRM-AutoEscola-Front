"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Chat } from "@/types/chat";
import { Message } from "@/types/messages";
import { fetchMessages, sendMessage } from "@/services/whatsapp";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

function lastMessageToMessage(
  last: NonNullable<Chat["lastMessage"]>,
  chatId: string
): Message {
  return {
    id: `${chatId}-${last.timestamp}`,
    body: last.body,
    fromMe: false, // ou derive se você tiver essa info
    timestamp: last.timestamp,
    type: "chat",
    hasMedia: false,
  };
}

type Props = {
  chat?: Chat;
};

export const ChatWindow = React.memo(function ChatWindow({ chat }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  // 📥 Buscar mensagens ao trocar de chat
  useEffect(() => {
    if (!chat) return;

    setLoading(true);
    setMessages([]);

    fetchMessages("1", chat.id)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [chat?.id]);

  useEffect(() => {
    if (!chat?.lastMessage) return;

    //@ts-ignore
    setMessages((prev) => {
      //@ts-ignore
      const exists = prev.some((m) => m.id === chat.lastMessage!.id);
      if (exists) return prev;
      return [...prev, chat.lastMessage!];
    });
    //@ts-ignore
  }, [chat?.lastMessage?.id]);

  // 📤 Enviar mensagem
  const handleSend = useCallback(async () => {
    if (!text.trim() || !chat) return;

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      body: text,
      fromMe: true,
      timestamp: Date.now() / 1000,
      type: "chat",
      hasMedia: false,
    };

    // UX instantâneo
    setText("");

    try {
      await sendMessage("1", chat.id, text);
    } catch (err) {
      console.error(err);
      // opcional: remover mensagem se falhar
    }
  }, [text, chat]);

  if (!chat) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-gray-500">Selecione uma conversa</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="h-16 shrink-0 px-6 flex items-center border-b border-gray-200 bg-[#f7f8fa]">
        <p className="font-medium text-gray-900">{chat.name}</p>
      </header>

      {/* Mensagens */}
      <div
        className="
          flex-1
          overflow-y-auto
          px-6
          py-4
          bg-[#efeae2]
          flex
          flex-col
          gap-2
        "
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.body} isMe={msg.fromMe} />
        ))}
      </div>

      {/* Footer */}
      <footer className="h-16 shrink-0 px-6 flex items-center gap-3 border-t border-gray-200 bg-[#f7f8fa]">
        <MessageInput value={text} onChange={setText} onSend={handleSend} />
      </footer>
    </main>
  );
});
