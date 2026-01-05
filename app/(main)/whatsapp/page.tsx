"use client";

import { useEffect, useState } from "react";
import { Chat } from "@/types/chat";
import { getConversations } from "@/services/whatsapp";
import { ChatList } from "@/components/whats/ChatList";
import { ChatWindow } from "@/components/whats/ChatWindow";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    getConversations("1").then(setChats).catch(console.error);
  }, []);

  return (
    <div className="h-screen flex bg-black">
      <ChatList
        chats={chats}
        selectedChatId={selectedChatId}
        onSelect={setSelectedChatId}
      />

      <ChatWindow chat={chats.find((c) => c.id === selectedChatId)} />
    </div>
  );
}
