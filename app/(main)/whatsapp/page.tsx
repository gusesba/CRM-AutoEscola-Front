"use client";

import { useEffect, useState, useCallback } from "react";
import { Chat } from "@/types/chat";
import { getConversations } from "@/services/whatsapp";
import { ChatList } from "@/components/whats/ChatList";
import { ChatWindow } from "@/components/whats/ChatWindow";
import { useWhatsSocket } from "@/hooks/useWhatsSocket";
import { Message } from "@/types/messages";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    getConversations("1").then(setChats).catch(console.error);
  }, []);

  // 🔌 SOCKET GLOBAL
  useWhatsSocket("1", (data: { chatId: string; message: Message }) => {
    setChats((prev) => {
      const chatIndex = prev.findIndex((c) => c.id === data.chatId);

      // chat ainda não existe (novo contato)
      if (chatIndex === -1) return prev;

      const chat = prev[chatIndex];
      const isSelected = data.chatId === selectedChatId;

      const updatedChat: Chat = {
        ...chat,
        lastMessage: data.message,
        unreadCount: isSelected
          ? chat.unreadCount
          : (chat.unreadCount ?? 0) + 1,
      };

      // move o chat para o topo
      const updated = [...prev];
      updated.splice(chatIndex, 1);

      return [updatedChat, ...updated];
    });
  });

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="flex bg-black h-screen">
      <ChatList
        chats={chats}
        selectedChatId={selectedChatId}
        onSelect={(id) => {
          setSelectedChatId(id);

          // zera unread ao abrir
          setChats((prev) =>
            prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
          );
        }}
      />

      <ChatWindow chat={selectedChat} />
    </div>
  );
}
