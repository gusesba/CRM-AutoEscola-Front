import { formatWhatsText } from "@/lib/formatWhatsText";

export function MessageBubble({ text, isMe }: { text: string; isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[65%]
          px-4 py-2
          rounded-lg
          text-sm
          shadow-sm

          whitespace-pre-wrap
          break-words
          [overflow-wrap:anywhere]
          hyphens-auto

          ${
            isMe
              ? "bg-[#d9fdd3] text-gray-900 rounded-br-none"
              : "bg-white text-gray-900 rounded-bl-none"
          }
        `}
        lang="pt-BR"
      >
        {formatWhatsText(text)}
      </div>
    </div>
  );
}
