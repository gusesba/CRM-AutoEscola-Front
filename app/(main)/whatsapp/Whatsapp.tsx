"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Chat } from "@/types/chat";
import { getConversations } from "@/services/whatsapp";
import { ChatList } from "@/components/whats/ChatList";
import { ChatWindow } from "@/components/whats/ChatWindow";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BatchSendModal } from "@/components/whats/BatchSendModal";
import { useWhatsSocket } from "@/hooks/useWhatsSocket";
import { Message } from "@/types/messages";
import { useAuth } from "@/hooks/useAuth";
import {
  adicionarConversaAoGrupo,
  buscarGruposWhatsapp,
  buscarGruposWhatsappPorChat,
  GrupoWhatsapp,
  removerConversaGrupoWhatsapp,
} from "@/services/whatsappGroupService";
import { getChatStatus } from "@/services/vendaService";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

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

type HomeProps = {
  onDisconnect: () => void;
  disconnecting: boolean;
};

export default function Home({ onDisconnect, disconnecting }: HomeProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [grupoChatIndex, setGrupoChatIndex] = useState(0);
  const [gruposChat, setGruposChat] = useState<GrupoWhatsapp[]>([]);
  const [loadingGruposChat, setLoadingGruposChat] = useState(false);
  const [removendoGrupoId, setRemovendoGrupoId] = useState<number | null>(null);
  const [grupoChatParaRemover, setGrupoChatParaRemover] =
    useState<GrupoWhatsapp | null>(null);
  const [modalAdicionarGrupoOpen, setModalAdicionarGrupoOpen] = useState(false);
  const [gruposDisponiveis, setGruposDisponiveis] = useState<GrupoWhatsapp[]>(
    []
  );
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<number | "">("");
  const [adicionandoGrupo, setAdicionandoGrupo] = useState(false);
  const [erroAdicionarGrupo, setErroAdicionarGrupo] = useState<string | null>(
    null
  );
  const [carregandoGruposDisponiveis, setCarregandoGruposDisponiveis] =
    useState(false);
  const [vendaWhatsappId, setVendaWhatsappId] = useState<number | null>(null);
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

  useEffect(() => {
    if (!selectedChatId || !user?.UserId) {
      setVendaWhatsappId(null);
      return;
    }

    getChatStatus(selectedChatId, String(user.UserId))
      .then((data) => {
        setVendaWhatsappId(data?.venda?.vendaWhatsapp?.id ?? null);
      })
      .catch((error) => {
        console.error(error);
        setVendaWhatsappId(null);
      });
  }, [selectedChatId, user?.UserId]);

  useEffect(() => {
    if (!modalAdicionarGrupoOpen || !user?.UserId) return;

    let mounted = true;
    setErroAdicionarGrupo(null);
    setCarregandoGruposDisponiveis(true);

    buscarGruposWhatsapp({ usuarioId: Number(user.UserId) })
      .then((data) => {
        if (!mounted) return;
        setGruposDisponiveis(data ?? []);
      })
      .catch((error) => {
        console.error(error);
        if (!mounted) return;
        setErroAdicionarGrupo("Não foi possível carregar os grupos.");
      })
      .finally(() => {
        if (!mounted) return;
        setCarregandoGruposDisponiveis(false);
      });

    return () => {
      mounted = false;
    };
  }, [modalAdicionarGrupoOpen, user?.UserId]);

  const gruposParaAdicionar = useMemo(() => {
    const gruposAssociados = new Set(gruposChat.map((grupo) => grupo.id));
    return gruposDisponiveis.filter((grupo) => !gruposAssociados.has(grupo.id));
  }, [gruposChat, gruposDisponiveis]);

  const fecharModalAdicionarGrupo = () => {
    setModalAdicionarGrupoOpen(false);
    setGrupoSelecionadoId("");
    setErroAdicionarGrupo(null);
  };

  const handleAdicionarGrupo = async () => {
    if (!selectedChatId) return;

    if (!vendaWhatsappId) {
      setErroAdicionarGrupo(
        "É necessário vincular a conversa a uma venda antes de adicionar ao grupo."
      );
      return;
    }

    if (!grupoSelecionadoId) {
      setErroAdicionarGrupo("Selecione um grupo para adicionar.");
      return;
    }

    try {
      setAdicionandoGrupo(true);
      setErroAdicionarGrupo(null);

      await adicionarConversaAoGrupo({
        idGrupoWhats: Number(grupoSelecionadoId),
        idVendaWhats: vendaWhatsappId,
      });

      setLoadingGruposChat(true);
      const gruposAtualizados = await buscarGruposWhatsappPorChat(
        selectedChatId
      );
      setGruposChat(gruposAtualizados);
      setGrupoChatIndex(0);
      fecharModalAdicionarGrupo();
    } catch (error) {
      console.error(error);
      setErroAdicionarGrupo("Não foi possível adicionar a conversa ao grupo.");
    } finally {
      setAdicionandoGrupo(false);
      setLoadingGruposChat(false);
    }
  };

  const handleRemoverGrupoChat = (grupo: GrupoWhatsapp) => {
    if (!selectedChatId) return;
    setGrupoChatParaRemover(grupo);
  };

  const confirmarRemoverGrupoChat = async () => {
    if (!selectedChatId || !grupoChatParaRemover) {
      setGrupoChatParaRemover(null);
      return;
    }

    const idsVendaWhats = grupoChatParaRemover.conversas
      .filter((conversa) => conversa.whatsappChatId === selectedChatId)
      .map((conversa) => conversa.vendaWhatsappId);

    if (idsVendaWhats.length === 0) {
      window.alert("Não foi possível identificar a conversa vinculada.");
      setGrupoChatParaRemover(null);
      return;
    }

    try {
      setRemovendoGrupoId(grupoChatParaRemover.id);
      await removerConversaGrupoWhatsapp({
        idGrupoWhats: grupoChatParaRemover.id,
        idsVendaWhats,
      });
      setGruposChat((prev) =>
        prev.filter((item) => item.id !== grupoChatParaRemover.id)
      );
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível remover a conversa do grupo.");
    } finally {
      setRemovendoGrupoId(null);
      setGrupoChatParaRemover(null);
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
                className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40 cursor-pointer"
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
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-red-200 transition hover:bg-red-500/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      aria-label={`Remover conversa do grupo ${grupo.nome}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              <button
                type="button"
                onClick={() => setModalAdicionarGrupoOpen(true)}
                disabled={!selectedChatId}
                className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label="Adicionar conversa ao grupo"
              >
                <Plus size={14} />
              </button>
            </div>
            {grupoChatIndex < totalPaginasGrupoChat - 1 && (
              <button
                type="button"
                onClick={() =>
                  setGrupoChatIndex((prev) =>
                    Math.min(totalPaginasGrupoChat - 1, prev + 1)
                  )
                }
                className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] cursor-pointer"
          >
            Envio em grupo
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {disconnecting ? "Desconectando..." : "Desconectar"}
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

      {modalAdicionarGrupoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Adicionar ao grupo
                </h2>
                <p className="text-xs text-gray-500">
                  Selecione o grupo para incluir esta conversa.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalAdicionarGrupo}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Grupo
                </label>
                <select
                  value={grupoSelecionadoId}
                  onChange={(event) =>
                    setGrupoSelecionadoId(
                      event.target.value ? Number(event.target.value) : ""
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  disabled={carregandoGruposDisponiveis}
                >
                  <option value="">Selecione um grupo</option>
                  {gruposParaAdicionar.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
                {carregandoGruposDisponiveis && (
                  <p className="mt-1 text-xs text-gray-500">
                    Carregando grupos...
                  </p>
                )}
                {!carregandoGruposDisponiveis &&
                  gruposParaAdicionar.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Não há grupos disponíveis para adicionar esta conversa.
                    </p>
                  )}
              </div>

              {!vendaWhatsappId && (
                <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  Vincule esta conversa a uma venda para habilitar a inclusão em
                  grupos.
                </p>
              )}

              {erroAdicionarGrupo && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {erroAdicionarGrupo}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={fecharModalAdicionarGrupo}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarGrupo}
                disabled={
                  adicionandoGrupo ||
                  carregandoGruposDisponiveis ||
                  !grupoSelecionadoId ||
                  !vendaWhatsappId
                }
                className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {adicionandoGrupo ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!grupoChatParaRemover}
        title="Remover conversa do grupo"
        description="Tem certeza que deseja remover esta conversa do grupo?"
        confirmLabel="Remover"
        variant="danger"
        onClose={() => setGrupoChatParaRemover(null)}
        onConfirm={confirmarRemoverGrupoChat}
      />
    </div>
  );
}
