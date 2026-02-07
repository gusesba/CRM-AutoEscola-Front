import { useEffect, useRef, useState } from "react";
import { formatWhatsText } from "@/lib/formatWhatsText";
import { extractPhoneNumbers } from "@/lib/whatsappPhone";
import { Message } from "@/types/messages";

type Props = {
  message: Message;
  onPhoneNumberClick?: (number: string) => void;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDeleteForMe?: (message: Message) => void;
  onDeleteForEveryone?: (message: Message) => void;
};

const mediaUrl = process.env.NEXT_PUBLIC_WHATS_URL;

function formatTime(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMediaSrc(url?: string) {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  return `${mediaUrl}${url}`;
}

function MessageMeta({ message }: { message: Message }) {
  const time = formatTime(message.timestamp);
  if (!time) return null;
  const labels: string[] = [];
  if (message.isForwarded) {
    labels.push("Encaminhada");
  }
  if (message.isEdited) {
    labels.push("Editada");
  }
  return (
    <div
      className={`mt-1 flex items-center gap-2 text-[10px] text-gray-500 ${
        message.fromMe ? "self-end" : "self-start"
      }`}
    >
      {labels.length > 0 && (
        <span className="italic text-gray-400">{labels.join(" · ")}</span>
      )}
      <span>{time}</span>
    </div>
  );
}

function getMessagePreview(message: Message | Message["replyTo"]) {
  if (!message) return "Mensagem";
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

function ReplyPreview({ message }: { message: Message }) {
  if (!message.replyTo) return null;
  const authorLabel = message.replyTo.fromMe ? "Você" : "Contato";

  return (
    <div className="mb-2 border-l-4 border-emerald-400/70 bg-emerald-50/40 px-2 py-1 text-xs text-gray-600">
      <p className="font-semibold text-emerald-700">{authorLabel}</p>
      <p className="truncate">{getMessagePreview(message.replyTo)}</p>
    </div>
  );
}

function renderMessageBody(
  text: string,
  onPhoneNumberClick?: (number: string) => void,
) {
  if (!onPhoneNumberClick) {
    return formatWhatsText(text);
  }

  const matches = extractPhoneNumbers(text);
  if (matches.length === 0) {
    return formatWhatsText(text);
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const start = text.indexOf(match.raw, cursor);
    if (start > cursor) {
      nodes.push(
        <span key={`text-${index}`}>
          {formatWhatsText(text.slice(cursor, start))}
        </span>,
      );
    }

    nodes.push(
      <button
        key={`phone-${index}`}
        type="button"
        onClick={() => onPhoneNumberClick(match.digits)}
        className="text-[#25d366] font-semibold hover:underline"
      >
        {match.raw}
      </button>,
    );

    cursor = start + match.raw.length;
  });

  if (cursor < text.length) {
    nodes.push(
      <span key="text-end">{formatWhatsText(text.slice(cursor))}</span>,
    );
  }

  return nodes;
}

function ImageMessage({ message, className }: any) {
  return (
    <div className={`${className} p-1 flex flex-col`}>
      <ReplyPreview message={message} />
      <img
        src={getMediaSrc(message.mediaUrl)}
        alt="imagem"
        className="
          rounded-md
          max-w-[240px]
          cursor-pointer
          hover:opacity-90
          transition
        "
        onClick={() => window.open(getMediaSrc(message.mediaUrl), "_blank")}
      />

      {message.body && (
        <div className="mt-1 text-sm">
          {renderMessageBody(message.body, message.onPhoneNumberClick)}
        </div>
      )}
      <MessageMeta message={message} />
    </div>
  );
}

function VideoMessage({ message, className }: any) {
  return (
    <div className={`${className} p-1 flex flex-col`}>
      <ReplyPreview message={message} />
      <video
        controls
        src={getMediaSrc(message.mediaUrl)}
        className="rounded-md max-w-full"
      />
      {message.body && <p className="mt-1">{message.body}</p>}
      <MessageMeta message={message} />
    </div>
  );
}

function AudioMessage({ message, className }: any) {
  return (
    <div className={`${className} p-2 flex flex-col`}>
      <ReplyPreview message={message} />
      <audio controls src={getMediaSrc(message.mediaUrl)} />
      <MessageMeta message={message} />
    </div>
  );
}

function StickerMessage({ message, className }: any) {
  return (
    <div
      className={`${className} flex flex-col ${
        message.fromMe ? "self-end" : "self-start"
      }`}
    >
      <ReplyPreview message={message} />
      <img
        src={getMediaSrc(message.mediaUrl)}
        alt="sticker"
        className="w-32 h-32 object-contain"
      />
      <MessageMeta message={message} />
    </div>
  );
}

function DocumentMessage({ message, className }: any) {
  const fileName = message.fileName || "Documento";

  return (
    <div className={`${className} p-1 flex flex-col gap-1`}>
      <ReplyPreview message={message} />
      <a
        href={getMediaSrc(message.mediaUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex items-center gap-3
          p-3 rounded-lg
          hover:bg-black/5
          transition
        "
      >
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
          📄
        </div>

        <div className="flex flex-col text-sm">
          <span className="font-medium truncate max-w-[180px]">{fileName}</span>
        </div>
      </a>

      {/* 📎 Legenda / mensagem */}
      {message.body && (
        <div className="text-sm whitespace-pre-wrap break-words pl-2 pr-2 pb-2">
          {renderMessageBody(message.body, message.onPhoneNumberClick)}
        </div>
      )}
      <MessageMeta message={message} />
    </div>
  );
}

function ReplyMenu({
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}: {
  onReply?: () => void;
  onEdit?: () => void;
  onDeleteForMe?: () => void;
  onDeleteForEveryone?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!onReply && !onEdit && !onDeleteForMe && !onDeleteForEveryone) {
    return null;
  }

  return (
    <div ref={menuRef} className="absolute right-[-4px] top-[-2px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/0 text-xs text-gray-600  transition hover:bg-white "
        aria-label="Opções da mensagem"
      >
        ▾
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {onReply && (
            <button
              type="button"
              onClick={() => {
                onReply();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
            >
              Responder
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
            >
              Editar
            </button>
          )}
          {onDeleteForMe && (
            <button
              type="button"
              onClick={() => {
                onDeleteForMe();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
            >
              Excluir para mim
            </button>
          )}
          {onDeleteForEveryone && (
            <button
              type="button"
              onClick={() => {
                onDeleteForEveryone();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-red-600 hover:bg-gray-100"
            >
              Excluir para todos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MessageBubble({
  message,
  onPhoneNumberClick,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}: Props) {
  const base =
    "relative max-w-[70%] rounded-lg text-sm whitespace-pre-wrap break-words flex flex-col";

  const bubble = message.fromMe
    ? "bg-[#d9fdd3] self-end"
    : "bg-white self-start";

  const handleReply = onReply ? () => onReply(message) : undefined;
  const handleEdit = onEdit ? () => onEdit(message) : undefined;
  const handleDeleteForMe = onDeleteForMe
    ? () => onDeleteForMe(message)
    : undefined;
  const handleDeleteForEveryone = onDeleteForEveryone
    ? () => onDeleteForEveryone(message)
    : undefined;

  switch (message.type) {
    case "image":
      return (
        <div className={`${base} ${bubble}`}>
          <ReplyMenu
            onReply={handleReply}
            onEdit={handleEdit}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
          <ImageMessage
            message={{ ...message, onPhoneNumberClick }}
            className="flex flex-col"
          />
        </div>
      );

    case "video":
      return (
        <div className={`${base} ${bubble}`}>
          <ReplyMenu
            onReply={handleReply}
            onEdit={handleEdit}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
          <VideoMessage message={message} className="flex flex-col" />
        </div>
      );

    case "sticker":
      return (
        <div className={`${base} ${bubble}`}>
          <ReplyMenu
            onReply={handleReply}
            onEdit={handleEdit}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
          <StickerMessage message={message} className="flex flex-col" />
        </div>
      );

    case "audio":
      return (
        <div className={`${base} ${bubble}`}>
          <ReplyMenu
            onReply={handleReply}
            onEdit={handleEdit}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
          <AudioMessage
            message={message}
            className={`self-${message.fromMe ? "end" : "start"}`}
          />
        </div>
      );

    case "document":
      return (
        <div className={`${base} ${bubble}`}>
          <ReplyMenu
            onReply={handleReply}
            onEdit={handleEdit}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
          <DocumentMessage
            message={{ ...message, onPhoneNumberClick }}
            className="flex flex-col"
          />
        </div>
      );

    default:
      return (
        <div className={`${base} ${bubble} px-3 py-2`}>
          <ReplyMenu
            onReply={handleReply}
            onEdit={handleEdit}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
          <ReplyPreview message={message} />
          {renderMessageBody(message.body, onPhoneNumberClick)}
          <MessageMeta message={message} />
        </div>
      );
  }
}
