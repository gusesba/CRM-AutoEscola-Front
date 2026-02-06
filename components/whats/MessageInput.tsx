"use client";

import { useEffect, useRef, useState } from "react";
import { formatWhatsText } from "@/lib/formatWhatsText";
import { Paperclip, Send, Mic } from "lucide-react";
import { Message } from "@/types/messages";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: (attachment?: File) => void;
  disabled?: boolean;
  disableAttachments?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
};

type Attachment = {
  file: File;
  type: "image" | "video" | "audio" | "document";
  previewUrl?: string;
};

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  disableAttachments,
  replyTo,
  onCancelReply,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachment, setAttachment] = useState<Attachment | null>(null);

  function getReplyPreview(message: Message) {
    if (message.body?.trim()) {
      return message.body;
    }

    switch (message.type) {
      case "image":
        return "Imagem";
      case "video":
        return "Vídeo";
      case "audio":
        return "Áudio";
      case "document":
        return "Documento";
      case "sticker":
        return "Sticker";
      default:
        return "Mensagem";
    }
  }

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
    if (disabled || disableAttachments) return;
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
    if (disabled) return;
    if (!value.trim() && !attachment) return;

    onSend(attachment?.file);
    onChange("");
    setAttachment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-full  rounded-xl flex flex-col gap-3">
        {replyTo && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500">
                Respondendo a
              </p>
              <p className="truncate text-sm text-gray-700">
                {getReplyPreview(replyTo)}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cancelar resposta"
            >
              ✕
            </button>
          </div>
        )}
        {/* 📦 Preview da mídia — SEM SOBREPOR */}
        {attachment && (
          <div className="relative bg-white rounded-xl p-3 shadow-sm w-fit max-w-full mt-[-140px]">
            {/* ❌ remover */}
            <button
              onClick={() => {
                setAttachment(null);

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            >
              ✕
            </button>

            {/* 📐 Área fixa */}
            <div className="w-[220px] h-[100px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
              {attachment.type === "image" && (
                <img
                  src={attachment.previewUrl}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {attachment.type === "video" && (
                <video
                  src={attachment.previewUrl}
                  controls
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {attachment.type === "document" && (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                  <span className="text-3xl">📄</span>
                  <span className="text-xs text-center truncate w-40">
                    {attachment.file.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🔽 Barra de input (sempre embaixo) */}
        <div className="flex items-end gap-2">
          {/* 📎 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:bg-black/5 rounded-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || disableAttachments}
          >
            <Paperclip size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            disabled={disabled || disableAttachments}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {/* ✍️ Input */}
          <div className="relative flex-1">
            <div
              ref={previewRef}
              className="
              w-full px-4 py-2 text-sm rounded-lg bg-white
              whitespace-pre-wrap break-words
              pointer-events-none
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
              disabled={disabled}
              className="
              absolute inset-0 w-full px-4 py-2 text-sm
              bg-transparent text-transparent caret-black
              resize-none outline-none disabled:cursor-not-allowed
            "
            />
          </div>

          {/* 🚀 */}
          <button
            onClick={handleSend}
            disabled={disabled}
            className="
            p-2 rounded-full
            bg-[#25d366] text-white
            hover:bg-[#1ebe5d]
            disabled:cursor-not-allowed disabled:opacity-60
          "
          >
            {value || attachment ? <Send size={18} /> : <Mic size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
