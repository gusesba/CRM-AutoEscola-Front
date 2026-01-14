import { formatWhatsText } from "@/lib/formatWhatsText";
import { Message } from "@/types/messages";

type Props = {
  message: Message;
};

const mediaUrl = "http://localhost:3001";

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

function MessageTime({ message }: { message: Message }) {
  const time = formatTime(message.timestamp);
  if (!time) return null;
  return (
    <span
      className={`mt-1 text-[10px] text-gray-500 ${
        message.fromMe ? "self-end" : "self-start"
      }`}
    >
      {time}
    </span>
  );
}

function ImageMessage({ message, className }: any) {
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
        onClick={() =>
          window.open(getMediaSrc(message.mediaUrl), "_blank")
        }
      />

      {message.body && (
        <p className="mt-1 text-sm">{formatWhatsText(message.body)}</p>
      )}
      <MessageTime message={message} />
    </div>
  );
}

function VideoMessage({ message, className }: any) {
  return (
    <div className={`${className} p-1 flex flex-col`}>
      <video
        controls
        src={getMediaSrc(message.mediaUrl)}
        className="rounded-md max-w-full"
      />
      {message.body && <p className="mt-1">{message.body}</p>}
      <MessageTime message={message} />
    </div>
  );
}

function AudioMessage({ message, className }: any) {
  return (
    <div className={`${className} p-2 flex flex-col`}>
      <audio controls src={getMediaSrc(message.mediaUrl)} />
      <MessageTime message={message} />
    </div>
  );
}

function StickerMessage({ message }: any) {
  return (
    <div
      className={`flex flex-col ${
        message.fromMe ? "self-end" : "self-start"
      }`}
    >
      <img
        src={getMediaSrc(message.mediaUrl)}
        alt="sticker"
        className="w-32 h-32 object-contain"
      />
      <MessageTime message={message} />
    </div>
  );
}

function DocumentMessage({ message, className }: any) {
  const fileName = message.fileName || "Documento";

  return (
    <div className={`${className} flex flex-col gap-1`}>
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
        <p className="text-sm whitespace-pre-wrap break-words pl-2 pr-2 pb-2">
          {formatWhatsText(message.body)}
        </p>
      )}
      <MessageTime message={message} />
    </div>
  );
}

export function MessageBubble({ message }: Props) {
  const base =
    "max-w-[70%] rounded-lg text-sm whitespace-pre-wrap break-words flex flex-col";

  const bubble = message.fromMe
    ? "bg-[#d9fdd3] self-end"
    : "bg-white self-start";

  switch (message.type) {
    case "image":
      return <ImageMessage message={message} className={`${base} ${bubble}`} />;

    case "video":
      return <VideoMessage message={message} className={`${base} ${bubble}`} />;

    case "sticker":
      return <StickerMessage message={message} />;

    case "audio":
      return (
        <AudioMessage
          message={message}
          className={`${bubble} self-${message.fromMe ? "end" : "start"}`}
        />
      );

    case "document":
      return (
        <DocumentMessage message={message} className={`${base} ${bubble}`} />
      );

    default:
      return (
        <div className={`${base} ${bubble} px-3 py-2`}>
          {formatWhatsText(message.body)}
          <MessageTime message={message} />
        </div>
      );
  }
}
