"use client";

import { Chat } from "@/types/chat";
import { ChatItem } from "./ChatItem";
import { useCallback } from "react";

type Props = {
  chats: Chat[];
  selectedChatId: string | null;
  onSelect: (id: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
};

export function ChatList({
  chats,
  selectedChatId,
  onSelect,
  filterValue,
  onFilterChange,
}: Props) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  return (
    <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <input
          type="text"
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder="Pesquisar por nome, ID ou mensagem"
          className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#25d366]"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isSelected={chat.id === selectedChatId}
            onSelect={handleSelect}
          />
        ))}
        {chats.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500">
            Nenhuma conversa encontrada.
          </p>
        )}
      </div>
    </aside>
  );
}
