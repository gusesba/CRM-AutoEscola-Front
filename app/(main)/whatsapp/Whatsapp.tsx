"use client";

import { useEffect, useState, useCallback } from "react";
import { Chat } from "@/types/chat";
import { getConversations } from "@/services/whatsapp";
import { ChatList } from "@/components/whats/ChatList";
import { ChatWindow } from "@/components/whats/ChatWindow";
import { BatchSendModal } from "@/components/whats/BatchSendModal";
import { useWhatsSocket } from "@/hooks/useWhatsSocket";
import { Message } from "@/types/messages";
import { useAuth } from "@/hooks/useAuth";

function ChatsLoadingOverlay() {
  return (
    <div
      className="
        absolute inset-0
        bg-white/70
        backdrop-blur-sm
        flex flex-col
        items-center justify-center
        z-20
      "
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-[#25d366] rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Carregando conversas…</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.UserId) return;
    setLoadingChats(true);
    getConversations(String(user?.UserId))
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoadingChats(false));
  }, [user]);

  // 🔌 SOCKET GLOBAL
  useWhatsSocket(
    String(user?.UserId),
    (data: { chatId: string; message: Message }) => {
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
    }
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="flex-1 bg-[#f0f2f5]">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-end px-2 py-3">
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d]"
          >
            Envio em grupo
          </button>
        </div>

        <div
          className="
            relative
            h-[calc(100vh-9rem)]   /* espaço p/ header global + botão */
            bg-white
            rounded-xl
            shadow-md
            flex
            overflow-hidden
          "
        >
          {loadingChats && <ChatsLoadingOverlay />}

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

      {batchModalOpen && user?.UserId && (
        <BatchSendModal
          userId={String(user.UserId)}
          onClose={() => setBatchModalOpen(false)}
        />
      )}
    </div>
  );
}
