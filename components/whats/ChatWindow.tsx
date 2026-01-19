"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Chat, ChatStatusDto } from "@/types/chat";
import { Message } from "@/types/messages";
import {
  fetchMessages,
  sendMediaMessage,
  sendMessage,
} from "@/services/whatsapp";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import {
  desvincularVendaWhats,
  getChatStatus,
  vincularVendaWhats,
} from "@/services/vendaService";
import { ChatVendaStatus } from "./ChatStatus";

function isSameDay(firstTimestamp: number, secondTimestamp: number) {
  const firstDate = new Date(firstTimestamp * 1000);
  const secondDate = new Date(secondTimestamp * 1000);
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDayLabel(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date.getTime() / 1000, today.getTime() / 1000)) {
    return "Hoje";
  }

  if (isSameDay(date.getTime() / 1000, yesterday.getTime() / 1000)) {
    return "Ontem";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function lastMessageToMessage(
  last: NonNullable<Chat["lastMessage"]>,
  chatId: string
): Message {
  return {
    id: `${chatId}-${last.timestamp}`,
    body: last.body,
    fromMe: false, // ou derive se você tiver essa info
    timestamp: last.timestamp,
    type: "chat",
    hasMedia: false,
  };
}

type Props = {
  chat?: Chat;
  whatsappUserId?: string;
  fetchMessagesFn?: (
    userId: string,
    chatId: string,
    limit?: number
  ) => Promise<Message[]>;
  disableSend?: boolean;
};

export const ChatWindow = React.memo(function ChatWindow({
  chat,
  whatsappUserId,
  fetchMessagesFn,
  disableSend,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [limit, setLimit] = useState(50);
  const [hasReachedStart, setHasReachedStart] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ChatStatusDto | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollHeightRef = useRef<number | null>(null);

  const vincularVenda = async (vendaId: number) => {
    if (!whatsappUserId) return;
    const status = await vincularVendaWhats({
      vendaId,
      whatsappChatId: chat?.id || "",
      whatsappUserId,
    });

    setStatus(status);
  };

  const desvincularVenda = async (vendaWhatsappId: number) => {
    await desvincularVendaWhats(vendaWhatsappId);
    if (!chat || !whatsappUserId) return;
    const updatedStatus = await getChatStatus(chat.id, whatsappUserId);
    setStatus(updatedStatus);
  };

  const fetchMessagesHandler = fetchMessagesFn ?? fetchMessages;

  // 📥 Buscar mensagens ao trocar de chat
  useEffect(() => {
    if (!chat || !whatsappUserId) return;
    setLoading(true);
    setMessages([]);
    setLimit(50);
    setHasReachedStart(false);
    shouldAutoScrollRef.current = true;

    fetchMessagesHandler(whatsappUserId, chat.id, 50)
      .then((data) => {
        setMessages(data);
        setHasReachedStart(data.length < 50);
      })
      .finally(() => setLoading(false));
  }, [chat?.id, whatsappUserId, fetchMessagesHandler]);

  useEffect(() => {
    if (!chat || !whatsappUserId) return;
    if (limit === 50) return;

    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    pendingScrollHeightRef.current = previousScrollHeight;
    setIsFetchingMore(true);

    fetchMessagesHandler(whatsappUserId, chat.id, limit)
      .then((data) => {
        setMessages(data);
        setHasReachedStart(data.length < limit);
      })
      .finally(() => {
        setIsFetchingMore(false);
      });
  }, [chat?.id, limit, whatsappUserId, fetchMessagesHandler]);

  useEffect(() => {
    if (!chat || !whatsappUserId) return;

    getChatStatus(chat.id, whatsappUserId)
      .then(setStatus)
      .catch(console.error);
  }, [chat?.id, whatsappUserId]);

  useEffect(() => {
    if (!chat?.lastMessage) return;

    //@ts-ignore
    setMessages((prev) => {
      //@ts-ignore
      const exists = prev.some((m) => m.id === chat.lastMessage!.id);
      if (exists) return prev;
      shouldAutoScrollRef.current = true;
      return [...prev, chat.lastMessage!];
    });
    //@ts-ignore
  }, [chat?.lastMessage?.id]);

  useEffect(() => {
    if (pendingScrollHeightRef.current !== null) {
      const container = messagesContainerRef.current;
      if (container) {
        const previousScrollHeight = pendingScrollHeightRef.current;
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      }
      pendingScrollHeightRef.current = null;
      return;
    }
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // 📤 Enviar mensagem
  const handleSend = useCallback(
    async (file?: File) => {
      if (disableSend) return;
      if (!chat || !whatsappUserId) return;
      if (!text.trim() && !file) return;

      const currentText = text;

      // UX instantâneo
      setText("");
      shouldAutoScrollRef.current = true;

      try {
        if (file) {
          await sendMediaMessage(
            whatsappUserId,
            chat.id,
            file,
            currentText // legenda
          );
        } else {
          await sendMessage(whatsappUserId, chat.id, currentText);
        }
      } catch (err) {
        console.error(err);
      }
    },
    [disableSend, text, chat, whatsappUserId]
  );

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !chat) return;
    if (loading || isFetchingMore) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom <= 120;
    shouldAutoScrollRef.current = isNearBottom;

    if (!hasReachedStart && container.scrollTop <= 20) {
      shouldAutoScrollRef.current = false;
      setLimit((prev) => prev + 50);
    }
  }, [loading, isFetchingMore, hasReachedStart, chat]);

  const scrollToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!chat) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-gray-500">Selecione uma conversa</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="h-16 shrink-0 px-6 flex items-center gap-3 border-b border-gray-200 bg-[#f7f8fa]">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 shrink-0">
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

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <p className="font-medium text-gray-900 truncate">{chat.name}</p>
          <span className="text-xs text-gray-500">Status aqui</span>
          {/* depois dá pra ligar isso ao socket */}
        </div>
        {status && (
          <ChatVendaStatus
            status={status}
            onVincular={vincularVenda}
            onDesvincular={desvincularVenda}
            chat={chat}
          />
        )}
      </header>

      {/* Mensagens */}
      <div
        className="
          flex-1
          overflow-y-auto
          px-6
          py-4
          bg-[#efeae2]
          flex
          flex-col
          gap-2
          relative
        "
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {hasReachedStart && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-white text-gray-500 text-xs shadow">
              início do chat
            </div>
          </div>
        )}
        {messages.map((msg, index) => {
          const previousMessage = messages[index - 1];
          const showDaySeparator =
            !previousMessage ||
            !isSameDay(previousMessage.timestamp, msg.timestamp);
          return (
            <React.Fragment key={msg.id}>
              {showDaySeparator && (
                <div className="flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-white/80 text-gray-600 text-xs shadow">
                    {formatDayLabel(msg.timestamp)}
                  </div>
                </div>
              )}
              <MessageBubble message={msg} />
            </React.Fragment>
          );
        })}

        {/* 🔽 Âncora */}
        <div ref={bottomRef} />
      </div>

      <button
        type="button"
        onClick={scrollToBottom}
        aria-label="Ir para a última mensagem"
        className="absolute bottom-[80px] right-[30px] h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:bg-gray-50"
      >
        <span className="text-lg leading-none">↓</span>
      </button>

      {/* Footer */}
      <footer className="h-16 shrink-0 px-6 flex items-center gap-3 border-t border-gray-200 bg-[#f7f8fa]">
        <MessageInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          disabled={disableSend}
        />
      </footer>
    </main>
  );
});
