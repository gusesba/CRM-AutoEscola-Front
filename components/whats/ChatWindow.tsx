"use client";

import React, { useEffect, useState } from "react";
import { Chat } from "@/types/chat";
import { Message } from "@/types/messages";
import { fetchMessages } from "@/services/whatsapp";
import { MessageBubble } from "./MessageBubble";

type Props = {
  chat?: Chat;
};

export const ChatWindow = React.memo(function ChatWindow({ chat }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chat) return;

    setLoading(true);
    setMessages([]);

    fetchMessages("1", chat.id)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [chat?.id]);

  if (!chat) {
    return (
      <main className="flex-1 bg-[#0b141a] flex items-center justify-center text-gray-400">
        Selecione uma conversa
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#0b141a]">
      {/* Header */}
      <header className="h-16 bg-[#202c33] flex items-center px-4 border-b border-[#222]">
        <p className="text-white font-medium">{chat.name}</p>
      </header>

      {/* Mensagens */}
      <div className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto">
        {loading && (
          <p className="text-gray-400 text-sm">Carregando mensagens...</p>
        )}

        {!loading &&
          messages.map((msg) => (
            <MessageBubble key={msg.id} text={msg.body} isMe={msg.fromMe} />
          ))}
      </div>

      {/* Input (placeholder) */}
      <footer className="h-16 bg-[#202c33] flex items-center px-4">
        <input
          placeholder="Digite uma mensagem"
          className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 text-white outline-none"
        />
      </footer>
    </main>
  );
});
