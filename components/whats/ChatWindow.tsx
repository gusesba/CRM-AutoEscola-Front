"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Chat, ChatStatusDto, WhatsStatusEnum } from "@/types/chat";
import { Message } from "@/types/messages";
import {
  fetchMessages,
  forwardMessage,
  sendMediaMessage,
  sendMessage,
  sendMessageToNumber,
  replyToMessage,
  toggleArchiveChat,
  upsertAddressBookContact,
  editMessage,
  deleteMessage,
} from "@/services/whatsapp";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import {
  desvincularVendaWhats,
  getChatStatus,
  vincularVendaWhats,
} from "@/services/vendaService";
import { ChatVendaStatus } from "./ChatStatus";
import { normalizarContato } from "./normalizarContato";
import { getPhoneDigits } from "@/lib/whatsappPhone";

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

function getForwardPreview(message: Message) {
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

function formatLeadContact(contato?: string | null) {
  const digits = getPhoneDigits(contato ?? "");
  if (!digits) return "";

  let normalized = digits;
  if (
    normalized.startsWith("55") &&
    (normalized.length === 12 || normalized.length === 13)
  ) {
    normalized = normalized.slice(2);
  }

  if (normalized.length > 11) {
    normalized = normalized.slice(-11);
  }

  if (normalized.length < 10) {
    return contato?.trim() ?? "";
  }

  const ddd = normalized.slice(0, 2);
  const restante = normalized.slice(2);

  if (restante.length === 8) {
    return `(${ddd}) ${restante.slice(0, 4)}-${restante.slice(4)}`;
  }

  return `(${ddd}) ${restante.slice(0, 5)}-${restante.slice(5, 9)}`;
}

function lastMessageToMessage(
  last: NonNullable<Chat["lastMessage"]>,
  chatId: string,
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
  chats?: Chat[];
  whatsappUserId?: string;
  fetchMessagesFn?: (
    userId: string,
    chatId: string,
    limit?: number,
  ) => Promise<Message[]>;
  disableSend?: boolean;
  pendingNumber?: string | null;
  onPhoneNumberClick?: (number: string) => void;
  onChatCreated?: (chat: Chat) => void;
  onArchiveToggle?: (chatId: string, archived: boolean) => void;
  onChatNameUpdated?: (chatId: string, name: string) => void;
};

export const ChatWindow = React.memo(function ChatWindow({
  chat,
  chats,
  whatsappUserId,
  fetchMessagesFn,
  disableSend,
  pendingNumber,
  onPhoneNumberClick,
  onChatCreated,
  onArchiveToggle,
  onChatNameUpdated,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [limit, setLimit] = useState(50);
  const [hasReachedStart, setHasReachedStart] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ChatStatusDto | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
    null,
  );
  const [forwardChatId, setForwardChatId] = useState("");
  const [forwardSearch, setForwardSearch] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollHeightRef = useRef<number | null>(null);
  const isNewChat = Boolean(pendingNumber);

  const vincularVenda = async (vendaId: number) => {
    if (!whatsappUserId) return;
    const status = await vincularVendaWhats({
      vendaId,
      whatsappChatId: chat?.id || "",
      whatsappChatNumero: normalizarContato(chat) ?? "",
      whatsappUserId,
    });

    setStatus(status);
  };

  const desvincularVenda = async (vendaWhatsappId: number) => {
    await desvincularVendaWhats(vendaWhatsappId);
    if (!chat || !whatsappUserId) return;
    const numero = normalizarContato(chat);
    const updatedStatus = await getChatStatus(chat?.id, whatsappUserId, numero);
    setStatus(updatedStatus);
  };

  const fetchMessagesHandler = fetchMessagesFn ?? fetchMessages;

  const handleToggleArchive = useCallback(async () => {
    if (!chat || !whatsappUserId) return;
    setIsArchiving(true);
    setArchiveError(null);
    try {
      const nextArchived = !chat?.archived;
      await toggleArchiveChat(whatsappUserId, chat?.id, nextArchived);
      onArchiveToggle?.(chat?.id, nextArchived);
    } catch (error) {
      console.error(error);
      setArchiveError(
        error instanceof Error ? error.message : "Erro ao arquivar conversa.",
      );
    } finally {
      setIsArchiving(false);
    }
  }, [chat, onArchiveToggle, whatsappUserId]);

  useEffect(() => {
    if (!isNewChat) return;
    setMessages([]);
    setLimit(50);
    setHasReachedStart(false);
    setStatus(null);
    setSendError(null);
    setArchiveError(null);
    setReplyTo(null);
    setEditingMessage(null);
    setForwardingMessage(null);
    setForwardChatId("");
    setForwardSearch("");
    setIsContactModalOpen(false);
  }, [isNewChat, pendingNumber]);

  useEffect(() => {
    if (!isContactModalOpen || !chat) return;
    const normalizedNumber =
      normalizarContato(chat) ?? getPhoneDigits(chat?.id) ?? "";
    const trimmedName = chat?.name?.trim() ?? "";
    const [firstName, ...lastNameParts] = trimmedName
      ? trimmedName.split(/\s+/)
      : [""];
    setContactPhone(normalizedNumber);
    setContactFirstName(firstName ?? "");
    setContactLastName(lastNameParts.join(" "));
  }, [chat, isContactModalOpen]);

  // 📥 Buscar mensagens ao trocar de chat
  useEffect(() => {
    if (!chat || !whatsappUserId || isNewChat) return;
    setLoading(true);
    setMessages([]);
    setLimit(50);
    setHasReachedStart(false);
    setSendError(null);
    setArchiveError(null);
    setReplyTo(null);
    setEditingMessage(null);
    setForwardingMessage(null);
    setForwardChatId("");
    setForwardSearch("");
    shouldAutoScrollRef.current = true;

    fetchMessagesHandler(whatsappUserId, chat?.id, 50)
      .then((data) => {
        setMessages(data);
        setHasReachedStart(data.length < 50);
      })
      .finally(() => setLoading(false));
  }, [chat?.id, whatsappUserId, fetchMessagesHandler]);

  useEffect(() => {
    if (!chat || !whatsappUserId || isNewChat) return;
    if (limit === 50) return;

    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    pendingScrollHeightRef.current = previousScrollHeight;
    setIsFetchingMore(true);

    fetchMessagesHandler(whatsappUserId, chat?.id, limit)
      .then((data) => {
        setMessages(data);
        setHasReachedStart(data.length < limit);
      })
      .finally(() => {
        setIsFetchingMore(false);
      });
  }, [chat?.id, limit, whatsappUserId, fetchMessagesHandler]);

  useEffect(() => {
    if (!chat || !whatsappUserId || isNewChat) return;

    const numero = normalizarContato(chat);
    getChatStatus(chat?.id, whatsappUserId, numero)
      .then(setStatus)
      .catch(console.error);
  }, [chat?.id, chat?.isGroup, chat?.name, whatsappUserId]);

  useEffect(() => {
    if (!chat?.lastMessage) return;

    //@ts-expect-error
    setMessages((prev) => {
      //@ts-expect-error
      const exists = prev.some((m) => m.id === chat?.lastMessage!.id);
      if (exists) return prev;
      shouldAutoScrollRef.current = true;
      return [...prev, chat?.lastMessage!];
    });
    //@ts-expect-error
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
      if (!whatsappUserId) return;
      if (!text.trim() && !file) return;
      if ((replyTo || editingMessage) && file) {
        setSendError("Não é possível responder ou editar com mídia.");
        return;
      }

      const currentText = text;

      // UX instantâneo
      setText("");
      shouldAutoScrollRef.current = true;
      setSendError(null);

      try {
        if (isNewChat) {
          if (file) {
            throw new Error(
              "Envio de mídia não disponível para o primeiro contato.",
            );
          }
          const numberDigits = getPhoneDigits(pendingNumber ?? "");
          if (!numberDigits) {
            throw new Error("Número inválido para iniciar a conversa.");
          }
          const response = await sendMessageToNumber(
            whatsappUserId,
            numberDigits,
            currentText,
          );
          onChatCreated?.(response.chat);
          return;
        }

        if (!chat) return;
        if (editingMessage) {
          const response = await editMessage(
            whatsappUserId,
            editingMessage.id,
            currentText,
          );
          if (response?.success) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === editingMessage.id
                  ? {
                      ...msg,
                      body: response.body ?? currentText,
                    }
                  : msg,
              ),
            );
            setEditingMessage(null);
          }
          return;
        }

        if (replyTo) {
          await replyToMessage(whatsappUserId, replyTo.id, currentText);
          setReplyTo(null);
          return;
        }

        if (file) {
          await sendMediaMessage(
            whatsappUserId,
            chat?.id,
            file,
            currentText, // legenda
          );
        } else {
          await sendMessage(whatsappUserId, chat?.id, currentText);
        }
        setReplyTo(null);
        setEditingMessage(null);
      } catch (err) {
        console.error(err);
        setSendError(
          err instanceof Error ? err.message : "Erro ao enviar mensagem.",
        );
      }
    },
    [
      disableSend,
      text,
      chat,
      whatsappUserId,
      isNewChat,
      pendingNumber,
      onChatCreated,
      replyTo,
      editingMessage,
    ],
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

  const handleOpenContactModal = useCallback(() => {
    if (!chat || !whatsappUserId) return;
    setIsContactModalOpen(true);
  }, [chat, whatsappUserId]);

  const handleSaveContact = useCallback(async () => {
    if (!chat || !whatsappUserId) return;
    if (!contactPhone.trim()) {
      toast.error("Informe o número do contato.");
      return;
    }

    setIsSavingContact(true);
    try {
      await upsertAddressBookContact(whatsappUserId, {
        phoneNumber: contactPhone.trim(),
        firstName: contactFirstName.trim(),
        lastName: contactLastName.trim(),
      });

      const updatedName = `${contactFirstName} ${contactLastName}`
        .replace(/\s+/g, " ")
        .trim();
      if (updatedName) {
        onChatNameUpdated?.(chat?.id, updatedName);
      }
      setIsContactModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingContact(false);
    }
  }, [
    chat,
    whatsappUserId,
    contactPhone,
    contactFirstName,
    contactLastName,
    onChatNameUpdated,
  ]);

  const handleReply = useCallback((message: Message) => {
    setEditingMessage(null);
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleEdit = useCallback((message: Message) => {
    setReplyTo(null);
    setEditingMessage(message);
    setText(message.body ?? "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setText("");
  }, []);

  const handleDelete = useCallback(
    async (message: Message, forEveryone: boolean) => {
      if (!whatsappUserId) return;
      try {
        const response = await deleteMessage(
          whatsappUserId,
          message.id,
          forEveryone,
        );
        if (response?.success) {
          setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
          if (replyTo?.id === message.id) {
            setReplyTo(null);
          }
          if (editingMessage?.id === message.id) {
            setEditingMessage(null);
            setText("");
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    [editingMessage?.id, replyTo?.id, whatsappUserId],
  );

  const handleForward = useCallback((message: Message) => {
    setForwardingMessage(message);
    setForwardChatId("");
    setForwardSearch("");
  }, []);

  const handleCancelForward = useCallback(() => {
    setForwardingMessage(null);
    setForwardChatId("");
    setForwardSearch("");
  }, []);

  const handleConfirmForward = useCallback(async () => {
    if (!whatsappUserId || !forwardingMessage) return;
    if (!forwardChatId.trim()) {
      toast.error("Selecione um chat para encaminhar.");
      return;
    }

    setIsForwarding(true);
    try {
      await forwardMessage(
        whatsappUserId,
        forwardingMessage.id,
        forwardChatId.trim(),
      );
      toast.success("Mensagem encaminhada.");
      setForwardingMessage(null);
      setForwardChatId("");
      setForwardSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsForwarding(false);
    }
  }, [forwardChatId, forwardingMessage, whatsappUserId]);

  const availableForwardChats = (chats ?? []).filter((chatItem) => {
    const term = forwardSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      chatItem.name.toLowerCase().includes(term) ||
      chatItem.id.toLowerCase().includes(term)
    );
  });

  if (!chat && !pendingNumber) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-gray-500">Selecione uma conversa</p>
      </main>
    );
  }

  const headerName = chat?.name ?? pendingNumber ?? "";
  const leadVinculado =
    status?.status === WhatsStatusEnum.Criado ? status.venda : null;
  const headerTitle = leadVinculado?.cliente?.trim() || headerName;
  const headerSubtitle = formatLeadContact(leadVinculado?.contato);

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="h-16 shrink-0 px-6 flex items-center gap-3 border-b border-gray-200 bg-[#f7f8fa]">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 shrink-0">
          {chat?.profilePicUrl ? (
            <img
              src={`${process.env.NEXT_PUBLIC_WHATS_URL}${chat?.profilePicUrl}`}
              alt={headerTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              {headerTitle.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <p className="font-medium text-gray-900 truncate">{headerTitle}</p>
          {headerSubtitle && (
            <span className="text-xs text-gray-500 truncate">
              {headerSubtitle}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {status && chat && (
            <ChatVendaStatus
              status={status}
              onVincular={vincularVenda}
              onDesvincular={desvincularVenda}
              chat={chat}
            />
          )}
          {status?.status === WhatsStatusEnum.Criado && status.venda?.id && (
            <button
              type="button"
              onClick={() =>
                window.open(
                  `/venda/editar/${status.venda?.id}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer"
            >
              Abrir lead
            </button>
          )}
          {chat && !isNewChat && whatsappUserId && !chat?.isGroup && (
            <button
              type="button"
              onClick={handleOpenContactModal}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer"
            >
              Adicionar contato
            </button>
          )}

          {chat && !isNewChat && whatsappUserId && (
            <button
              type="button"
              onClick={handleToggleArchive}
              disabled={isArchiving}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isArchiving
                ? "Processando..."
                : chat?.archived
                  ? "Desarquivar"
                  : "Arquivar"}
            </button>
          )}
        </div>
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
        {sendError && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-xs shadow">
              {sendError}
            </div>
          </div>
        )}
        {archiveError && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-xs shadow">
              {archiveError}
            </div>
          </div>
        )}
        {hasReachedStart && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-white text-gray-500 text-xs shadow">
              início do chat
            </div>
          </div>
        )}
        {messages.length === 0 && isNewChat && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-white text-gray-500 text-xs shadow">
              Envie a primeira mensagem para iniciar o contato.
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
              <MessageBubble
                message={msg}
                onPhoneNumberClick={onPhoneNumberClick}
                onReply={!isNewChat ? handleReply : undefined}
                onForward={!isNewChat ? handleForward : undefined}
                onEdit={
                  !isNewChat && msg.fromMe && msg.type === "chat"
                    ? handleEdit
                    : undefined
                }
                onDeleteForMe={
                  !isNewChat
                    ? (message) => handleDelete(message, false)
                    : undefined
                }
                onDeleteForEveryone={
                  !isNewChat && msg.fromMe
                    ? (message) => handleDelete(message, true)
                    : undefined
                }
              />
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
      <footer className="shrink-0 relative z-50 border-t border-gray-200 bg-[#f7f8fa] overflow-visible">
        <MessageInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          disabled={disableSend}
          disableAttachments={isNewChat || Boolean(editingMessage)}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          editMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
        />
      </footer>

      {forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Encaminhar mensagem
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Escolha o chat para encaminhar esta mensagem.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelForward}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
                <span className="font-semibold">Mensagem: </span>
                {getForwardPreview(forwardingMessage)}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Buscar chat
                </label>
                <input
                  type="text"
                  value={forwardSearch}
                  onChange={(event) => setForwardSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  placeholder="Digite o nome ou número"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Chat
                </label>
                <select
                  value={forwardChatId}
                  onChange={(event) => setForwardChatId(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                >
                  <option value="">Selecione um chat</option>
                  {availableForwardChats.map((chatItem) => {
                    const label = chatItem.name?.trim();
                    return (
                      <option key={chatItem.id} value={chatItem.id}>
                        {label ? `${label}` : chatItem.id}
                      </option>
                    );
                  })}
                </select>
              </div>
              {availableForwardChats.length === 0 && (
                <p className="text-xs text-gray-500">
                  Nenhuma conversa encontrada com este filtro.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCancelForward}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmForward}
                disabled={isForwarding}
                className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isForwarding ? "Encaminhando..." : "Encaminhar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isContactModalOpen && chat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Adicionar/Editar contato
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Atualize os dados do contato para este chat?.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Número
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  placeholder="Digite o número"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  value={contactFirstName}
                  onChange={(event) => setContactFirstName(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  placeholder="Digite o nome"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sobrenome
                </label>
                <input
                  type="text"
                  value={contactLastName}
                  onChange={(event) => setContactLastName(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  placeholder="Digite o sobrenome"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                disabled={isSavingContact}
                className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSavingContact ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
});
