"use client";

import { useEffect, useRef, useState } from "react";
import { formatWhatsText } from "@/lib/formatWhatsText";
import { Paperclip, Send, Mic } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: (attachment?: File) => void;
};

type Attachment = {
  file: File;
  type: "image" | "video" | "audio" | "document";
  previewUrl?: string;
};

export function MessageInput({ value, onChange, onSend }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachment, setAttachment] = useState<Attachment | null>(null);

  /** Auto resize */
  useEffect(() => {
    if (!textareaRef.current || !previewRef.current) return;

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 120) + "px";

    previewRef.current.style.height = textareaRef.current.style.height;
  }, [value]);

  /** Seleção de arquivo */
  function handleFileSelect(file: File) {
    const type = file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("audio")
      ? "audio"
      : "document";

    setAttachment({
      file,
      type,
      previewUrl:
        type === "image" || type === "video"
          ? URL.createObjectURL(file)
          : undefined,
    });
  }

  function handleSend() {
    if (!value.trim() && !attachment) return;

    onSend(attachment?.file);
    onChange("");
    setAttachment(null);
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 📦 Preview da mídia */}
      {attachment && (
        <div className="p-3 bg-white rounded-lg flex gap-3 items-center">
          {attachment.type === "image" && (
            <img
              src={attachment.previewUrl}
              className="w-24 h-24 object-cover rounded"
            />
          )}

          {attachment.type === "video" && (
            <video
              src={attachment.previewUrl}
              className="w-32 rounded"
              controls
            />
          )}

          {attachment.type === "document" && (
            <div className="flex items-center gap-2">
              📄 <span>{attachment.file.name}</span>
            </div>
          )}

          <button
            className="ml-auto text-sm text-red-500"
            onClick={() => setAttachment(null)}
          >
            Remover
          </button>
        </div>
      )}

      {/* 🔽 Barra inferior */}
      <div className="flex items-end gap-2">
        {/* 📎 Anexo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:bg-black/5 rounded-full"
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {/* ✍️ Campo de texto */}
        <div className="relative w-full">
          <div
            ref={previewRef}
            className="
              w-full px-4 py-2 text-sm rounded-lg bg-white
              whitespace-pre-wrap break-words
              text-gray-900 pointer-events-none
            "
          >
            {value ? (
              formatWhatsText(value)
            ) : (
              <span className="text-gray-400">Digite uma mensagem</span>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            className="
              absolute inset-0 w-full px-4 py-2 text-sm
              bg-transparent text-transparent caret-black
              resize-none outline-none
            "
          />
        </div>

        {/* 🚀 Enviar / 🎤 Mic */}
        <button
          onClick={handleSend}
          className="
            p-2 rounded-full
            bg-[#25d366] text-white
            hover:bg-[#1ebe5d]
          "
        >
          {value || attachment ? <Send size={18} /> : <Mic size={18} />}
        </button>
      </div>
    </div>
  );
}
