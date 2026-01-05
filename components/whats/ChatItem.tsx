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
      <div className="w-12 h-12 rounded-full bg-[#2a3942]" />

      <div className="flex-1 border-b border-[#222] pb-3">
        <div className="flex justify-between">
          <p className="text-white font-medium">{chat.name}</p>
        </div>

        <p className="text-sm text-gray-400 truncate">
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
    prev.chat.lastMessage?.timestamp === next.chat.lastMessage?.timestamp &&
    prev.chat.unreadCount === next.chat.unreadCount
);
