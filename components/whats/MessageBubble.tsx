import { formatWhatsText } from "@/lib/formatWhatsText";
import { extractPhoneNumbers } from "@/lib/whatsappPhone";
import { Message } from "@/types/messages";

type Props = {
  message: Message;
  onPhoneNumberClick?: (number: string) => void;
  onReply?: (message: Message) => void;
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

function MessageMeta({
  message,
  onReply,
}: {
  message: Message;
  onReply?: () => void;
}) {
  const time = formatTime(message.timestamp);
  if (!time && !onReply) return null;
  return (
    <div
      className={`mt-1 flex items-center gap-2 text-[10px] text-gray-500 ${
        message.fromMe ? "self-end" : "self-start"
      }`}
    >
      {time && <span>{time}</span>}
      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="text-[10px] font-semibold text-[#25d366] hover:underline"
        >
          Responder
        </button>
      )}
    </div>
  );
}

function renderMessageBody(
  text: string,
  onPhoneNumberClick?: (number: string) => void
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
        </span>
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
      </button>
    );

    cursor = start + match.raw.length;
  });

  if (cursor < text.length) {
    nodes.push(
      <span key="text-end">{formatWhatsText(text.slice(cursor))}</span>
    );
  }

  return nodes;
}

function ImageMessage({ message, className, onReply }: any) {
  return (
    <div className={`${className} p-1 flex flex-col`}>
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
      <MessageMeta message={message} onReply={onReply} />
    </div>
  );
}

function VideoMessage({ message, className, onReply }: any) {
  return (
    <div className={`${className} p-1 flex flex-col`}>
      <video
        controls
        src={getMediaSrc(message.mediaUrl)}
        className="rounded-md max-w-full"
      />
      {message.body && <p className="mt-1">{message.body}</p>}
      <MessageMeta message={message} onReply={onReply} />
    </div>
  );
}

function AudioMessage({ message, className, onReply }: any) {
  return (
    <div className={`${className} p-2 flex flex-col`}>
      <audio controls src={getMediaSrc(message.mediaUrl)} />
      <MessageMeta message={message} onReply={onReply} />
    </div>
  );
}

function StickerMessage({ message, onReply }: any) {
  return (
    <div
      className={`flex flex-col ${message.fromMe ? "self-end" : "self-start"}`}
    >
      <img
        src={getMediaSrc(message.mediaUrl)}
        alt="sticker"
        className="w-32 h-32 object-contain"
      />
      <MessageMeta message={message} onReply={onReply} />
    </div>
  );
}

function DocumentMessage({ message, className, onReply }: any) {
  const fileName = message.fileName || "Documento";

  return (
    <div className={`${className} p-1 flex flex-col gap-1`}>
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
      <MessageMeta message={message} onReply={onReply} />
    </div>
  );
}

export function MessageBubble({
  message,
  onPhoneNumberClick,
  onReply,
}: Props) {
  const base =
    "max-w-[70%] rounded-lg text-sm whitespace-pre-wrap break-words flex flex-col";

  const bubble = message.fromMe
    ? "bg-[#d9fdd3] self-end"
    : "bg-white self-start";

  const handleReply = onReply ? () => onReply(message) : undefined;

  switch (message.type) {
    case "image":
      return (
        <ImageMessage
          message={{ ...message, onPhoneNumberClick }}
          className={`${base} ${bubble}`}
          onReply={handleReply}
        />
      );

    case "video":
      return (
        <VideoMessage
          message={message}
          className={`${base} ${bubble}`}
          onReply={handleReply}
        />
      );

    case "sticker":
      return <StickerMessage message={message} onReply={handleReply} />;

    case "audio":
      return (
        <AudioMessage
          message={message}
          className={`${bubble} self-${message.fromMe ? "end" : "start"}`}
          onReply={handleReply}
        />
      );

    case "document":
      return (
        <DocumentMessage
          message={{ ...message, onPhoneNumberClick }}
          className={`${base} ${bubble}`}
          onReply={handleReply}
        />
      );

    default:
      return (
        <div className={`${base} ${bubble} px-3 py-2`}>
          {renderMessageBody(message.body, onPhoneNumberClick)}
          <MessageMeta message={message} onReply={handleReply} />
        </div>
      );
  }
}
