import React from "react";
import { Chat } from "@/types/chat";

type Props = {
  chat: Chat;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function ChatItemComponent({ chat, isSelected, onSelect }: Props) {
  return (
    <div
      onClick={() => onSelect(chat.id)}
      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33]
        ${isSelected ? "bg-[#202c33]" : ""}
      `}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#2a3942]" />

      {/* Conteúdo */}
      <div className="flex-1 border-b border-[#222] pb-3">
        <div className="flex justify-between items-center">
          <p className="text-white font-medium">{chat.name}</p>

          {/* 🔔 BADGE */}
          {chat.unreadCount > 0 && !isSelected && (
            <span
              className="min-w-[20px] h-5 px-2 text-xs font-semibold
              bg-[#00a884] text-black rounded-full flex items-center justify-center"
            >
              {chat.unreadCount}
            </span>
          )}
        </div>

        <p
          className={`text-sm truncate ${
            chat.unreadCount > 0 && !isSelected
              ? "text-white font-medium"
              : "text-gray-400"
          }`}
        >
          {chat.lastMessage?.body ?? "Sem mensagens"}
        </p>
      </div>
    </div>
  );
}

export const ChatItem = React.memo(
  ChatItemComponent,
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.chat.unreadCount === next.chat.unreadCount &&
    prev.chat.lastMessage?.timestamp === next.chat.lastMessage?.timestamp
);
