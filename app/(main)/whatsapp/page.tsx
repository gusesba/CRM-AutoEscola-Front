"use client";

import { useEffect, useState, useCallback } from "react";
import { Chat } from "@/types/chat";
import { getConversations } from "@/services/whatsapp";
import { ChatList } from "@/components/whats/ChatList";
import { ChatWindow } from "@/components/whats/ChatWindow";
import { useWhatsSocket } from "@/hooks/useWhatsSocket";
import { Message } from "@/types/messages";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if(user?.UserId)
      getConversations(String(user?.UserId)).then(setChats).catch(console.error);
  }, [user]);

  // 🔌 SOCKET GLOBAL
  useWhatsSocket(String(user?.UserId), (data: { chatId: string; message: Message }) => {
    console.log("Nova mensagem via socket");
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
    <div className="flex-1 bg-[#f0f2f5]">
      <div
        className="
          mx-auto
          h-[calc(100vh-7rem)]   /* espaço p/ header global */
          max-w-[1400px]
          bg-white
          rounded-xl
          shadow-md
          flex
          overflow-hidden
        "
      >
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
    </div>
  );
}
