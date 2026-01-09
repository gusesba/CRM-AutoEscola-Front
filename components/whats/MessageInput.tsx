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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full px-4 py-3 ">
      <div className="max-w-full  rounded-xl flex flex-col gap-3">
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
              className="
              absolute inset-0 w-full px-4 py-2 text-sm
              bg-transparent text-transparent caret-black
              resize-none outline-none
            "
            />
          </div>

          {/* 🚀 */}
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
    </div>
  );
}
