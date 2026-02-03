"use client";

import { Chat } from "@/types/chat";
import { ChatItem } from "./ChatItem";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [showArchived, setShowArchived] = useState(false);
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  const { activeChats, archivedChats, shouldExpandArchived } = useMemo(() => {
    const archived = chats.filter((chat) => chat.archived);
    const active = chats.filter((chat) => !chat.archived);
    const hasSearch = filterValue.trim().length > 0;
    return {
      activeChats: active,
      archivedChats: archived,
      shouldExpandArchived: hasSearch,
    };
  }, [chats, filterValue]);

  const showArchivedList = showArchived || shouldExpandArchived;
  const hasAnyChats = activeChats.length > 0 || archivedChats.length > 0;

  return (
    <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <input
          type="text"
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder="Pesquisar por nome ou ID"
          className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#25d366]"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeChats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isSelected={chat.id === selectedChatId}
            onSelect={handleSelect}
          />
        ))}

        {(archivedChats.length > 0 || shouldExpandArchived) && (
          <div className="px-3 py-2">
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 cursor-pointer"
            >
              <span>Arquivadas</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {archivedChats.length}
                {showArchivedList ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
            </button>
          </div>
        )}

        {showArchivedList &&
          archivedChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isSelected={chat.id === selectedChatId}
              onSelect={handleSelect}
            />
          ))}

        {!hasAnyChats && (
          <p className="px-4 py-6 text-sm text-gray-500">
            Nenhuma conversa encontrada.
          </p>
        )}
      </div>
    </aside>
  );
}
