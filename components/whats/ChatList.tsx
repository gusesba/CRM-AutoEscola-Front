"use client";

import { Chat } from "@/types/chat";
import { ChatItem } from "./ChatItem";
import { useCallback } from "react";

type Props = {
  chats: Chat[];
  selectedChatId: string | null;
  onSelect: (id: string) => void;
};

export function ChatList({ chats, selectedChatId, onSelect }: Props) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  return (
    <aside className="w-[360px] bg-white border-r border-gray-200 overflow-y-auto">
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === selectedChatId}
          onSelect={handleSelect}
        />
      ))}
    </aside>
  );
}
