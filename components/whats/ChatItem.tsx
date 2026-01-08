import React from "react";
import { Chat } from "@/types/chat";

type Props = {
  chat: Chat;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function formatTime(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatItemComponent({ chat, isSelected, onSelect }: Props) {
  const hasUnread = chat.unreadCount > 0 && !isSelected;

  return (
    <div
      onClick={() => onSelect(chat.id)}
      className={`
        mx-3 my-1.5
        px-4 py-3
        flex gap-3 cursor-pointer
        rounded-lg
        transition-colors
        hover:bg-gray-100
        ${isSelected ? "bg-gray-100" : "bg-white"}
      `}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
        {chat.profilePicUrl ? (
          <img
            src={chat.profilePicUrl}
            alt={chat.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            {chat.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Linha 1 */}
        <div className="flex justify-between items-center">
          <p
            className={`truncate ${
              hasUnread ? "font-semibold text-gray-900" : "text-gray-900"
            }`}
          >
            {chat.name}
          </p>

          <span
            className={`text-xs ${
              hasUnread ? "text-green-600 font-medium" : "text-gray-400"
            }`}
          >
            {formatTime(chat.lastMessage?.timestamp)}
          </span>
        </div>

        {/* Linha 2 */}
        <div className="flex justify-between items-center gap-2">
          <p
            className={`text-sm truncate ${
              hasUnread ? "font-medium text-gray-900" : "text-gray-500"
            }`}
          >
            {chat.lastMessage?.body ?? "Sem mensagens"}
          </p>

          {hasUnread && (
            <span
              className="
                min-w-[20px] h-5 px-2
                text-xs font-semibold
                bg-green-500 text-white
                rounded-full
                flex items-center justify-center
              "
            >
              {chat.unreadCount}
            </span>
          )}
        </div>
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
