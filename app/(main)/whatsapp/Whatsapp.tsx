"use client";

import { useEffect, useState, useCallback } from "react";
import { Chat } from "@/types/chat";
import { getConversations } from "@/services/whatsapp";
import { ChatList } from "@/components/whats/ChatList";
import { ChatWindow } from "@/components/whats/ChatWindow";
import { BatchSendModal } from "@/components/whats/BatchSendModal";
import { useWhatsSocket } from "@/hooks/useWhatsSocket";
import { Message } from "@/types/messages";
import { useAuth } from "@/hooks/useAuth";
import {
  buscarGruposWhatsappPorChat,
  GrupoWhatsapp,
  removerConversaGrupoWhatsapp,
} from "@/services/whatsappGroupService";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

function ChatsLoadingOverlay() {
  return (
    <div
      className="
        absolute inset-0
        bg-white/70
        backdrop-blur-sm
        flex flex-col
        items-center justify-center
        z-20
      "
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-[#25d366] rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Carregando conversas…</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [grupoChatIndex, setGrupoChatIndex] = useState(0);
  const [gruposChat, setGruposChat] = useState<GrupoWhatsapp[]>([]);
  const [loadingGruposChat, setLoadingGruposChat] = useState(false);
  const [removendoGrupoId, setRemovendoGrupoId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.UserId) return;
    setLoadingChats(true);
    getConversations(String(user?.UserId))
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoadingChats(false));
  }, [user]);

  // 🔌 SOCKET GLOBAL
  useWhatsSocket(
    String(user?.UserId),
    (data: { chatId: string; message: Message }) => {
      console.log("Nova mensagem via socket");
      setChats((prev) => {
        const chatIndex = prev.findIndex((c) => c.id === data.chatId);

        // chat ainda não existe (novo contato)
        if (chatIndex === -1) return prev;

        const chat = prev[chatIndex];
        const isSelected = data.chatId === selectedChatId;

        const updatedChat: Chat = {
          ...chat,
          lastMessage: data.message,
          unreadCount: isSelected
            ? chat.unreadCount
            : (chat.unreadCount ?? 0) + 1,
        };

        // move o chat para o topo
        const updated = [...prev];
        updated.splice(chatIndex, 1);

        return [updatedChat, ...updated];
      });
    }
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const gruposPorPagina = 3;
  const gruposChatPaginados = gruposChat.slice(
    grupoChatIndex * gruposPorPagina,
    grupoChatIndex * gruposPorPagina + gruposPorPagina
  );
  const totalPaginasGrupoChat = Math.max(
    1,
    Math.ceil(gruposChat.length / gruposPorPagina)
  );

  useEffect(() => {
    if (!selectedChatId) {
      setGruposChat([]);
      setGrupoChatIndex(0);
      return;
    }

    setLoadingGruposChat(true);
    buscarGruposWhatsappPorChat(selectedChatId)
      .then((data) => {
        setGruposChat(data);
        setGrupoChatIndex(0);
      })
      .catch((error) => {
        console.error(error);
        setGruposChat([]);
        setGrupoChatIndex(0);
      })
      .finally(() => setLoadingGruposChat(false));
  }, [selectedChatId]);

  const handleRemoverGrupoChat = async (grupo: GrupoWhatsapp) => {
    if (!selectedChatId) return;

    const confirmado = window.confirm(
      "Tem certeza que deseja remover esta conversa do grupo?"
    );
    if (!confirmado) return;

    const idsVendaWhats = grupo.conversas
      .filter((conversa) => conversa.whatsappChatId === selectedChatId)
      .map((conversa) => conversa.vendaWhatsappId);

    if (idsVendaWhats.length === 0) {
      window.alert("Não foi possível identificar a conversa vinculada.");
      return;
    }

    try {
      setRemovendoGrupoId(grupo.id);
      await removerConversaGrupoWhatsapp({
        idGrupoWhats: grupo.id,
        idsVendaWhats,
      });
      setGruposChat((prev) => prev.filter((item) => item.id !== grupo.id));
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível remover a conversa do grupo.");
    } finally {
      setRemovendoGrupoId(null);
    }
  };

  return (
    <div className="flex-1 bg-[#f0f2f5]">
      <div className="mx-auto max-w-[1400px] mt-[-30px]">
        <div className="flex flex-wrap items-center gap-3 px-2 py-3">
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            {grupoChatIndex !== 0 && (
              <button
                type="button"
                onClick={() =>
                  setGrupoChatIndex((prev) => Math.max(0, prev - 1))
                }
                className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-2 overflow-hidden">
              {loadingGruposChat && (
                <span className="text-xs text-gray-500">
                  Carregando grupos...
                </span>
              )}
              {!loadingGruposChat && gruposChatPaginados.length === 0 && (
                <span className="text-xs text-gray-500">
                  Nenhum grupo associado
                </span>
              )}
              {!loadingGruposChat &&
                gruposChatPaginados.map((grupo) => (
                  <span
                    key={grupo.id}
                    className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-full bg-green-600 pl-3 pr-2 py-1 text-xs font-semibold text-white"
                    title={grupo.nome}
                  >
                    <span className="truncate">{grupo.nome}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoverGrupoChat(grupo);
                      }}
                      disabled={removendoGrupoId === grupo.id}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-red-200 transition hover:bg-red-500/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Remover conversa do grupo ${grupo.nome}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
            </div>
            {grupoChatIndex < totalPaginasGrupoChat - 1 && (
              <button
                type="button"
                onClick={() =>
                  setGrupoChatIndex((prev) =>
                    Math.min(totalPaginasGrupoChat - 1, prev + 1)
                  )
                }
                className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d]"
          >
            Envio em grupo
          </button>
        </div>

        <div
          className="
            relative
            h-[calc(100vh-9rem)]   /* espaço p/ header global + botão */
            bg-white
            rounded-xl
            shadow-md
            flex
            overflow-hidden
          "
        >
          {loadingChats && <ChatsLoadingOverlay />}

          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelect={(id) => {
              setSelectedChatId(id);

              // zera unread ao abrir
              setChats((prev) =>
                prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
              );
            }}
          />

          <ChatWindow chat={selectedChat} />
        </div>
      </div>

      {batchModalOpen && user?.UserId && (
        <BatchSendModal
          userId={String(user.UserId)}
          onClose={() => setBatchModalOpen(false)}
        />
      )}
    </div>
  );
}
