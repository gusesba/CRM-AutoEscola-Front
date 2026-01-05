"use client";

import { useEffect, useRef } from "react";
import { formatWhatsText } from "@/lib/formatWhatsText";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
};

export function MessageInput({ value, onChange, onSend }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // auto resize
  useEffect(() => {
    if (!textareaRef.current || !previewRef.current) return;

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 120) + "px";

    previewRef.current.style.height = textareaRef.current.style.height;
  }, [value]);

  return (
    <div className="relative w-full">
      {/* Preview formatado */}
      <div
        ref={previewRef}
        className="
          w-full
          px-4 py-2
          text-sm
          rounded-lg
          bg-white
          whitespace-pre-wrap
          break-words
          [overflow-wrap:anywhere]
          hyphens-auto
          text-gray-900
          pointer-events-none
        "
        lang="pt-BR"
      >
        {value ? (
          formatWhatsText(value)
        ) : (
          <span className="text-gray-400">Digite uma mensagem</span>
        )}
      </div>

      {/* Textarea invisível */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        className="
          absolute inset-0
          w-full
          px-4 py-2
          text-sm
          bg-transparent
          text-transparent
          caret-black
          resize-none
          outline-none
        "
        rows={1}
      />
    </div>
  );
}
