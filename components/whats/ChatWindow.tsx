"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Chat } from "@/types/chat";
import { Message } from "@/types/messages";
import { fetchMessages, sendMessage } from "@/services/whatsapp";
import { MessageBubble } from "./MessageBubble";

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
    setMessages((prev) => [...prev, optimisticMessage]);
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
      <main className="flex-1 bg-[#0b141a] flex items-center justify-center text-gray-400">
        Selecione uma conversa
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#0b141a] min-h-0">
      {/* Header */}
      <header className="h-16 shrink-0 bg-[#202c33] flex items-center px-4 border-b border-[#222]">
        <p className="text-white font-medium">{chat.name}</p>
      </header>

      {/* Mensagens */}
      <div className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.body} isMe={msg.fromMe} />
        ))}
      </div>

      {/* Footer */}
      <footer className="h-16 shrink-0 bg-[#202c33] flex items-center px-4 gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 text-white outline-none"
          placeholder="Digite uma mensagem"
        />
      </footer>
    </main>
  );
});
