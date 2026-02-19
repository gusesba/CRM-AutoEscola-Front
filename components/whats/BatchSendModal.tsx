"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "@/components/whats/MessageBubble";
import { MessageInput } from "@/components/whats/MessageInput";
import {
  buscarGruposWhatsapp,
  buscarVinculosWhatsapp,
  GrupoWhatsapp,
  GrupoWhatsappConversa,
} from "@/services/whatsappGroupService";
import { sendBatchMessages } from "@/services/whatsapp";
import { BuscarServicos } from "@/services/servicoService";
import { Message } from "@/types/messages";
import { StatusEnum } from "@/enums";
import { useAuth } from "@/hooks/useAuth";
import { BuscarUsuarios } from "@/services/authService";

type PreviewMessage = Message & {
  file?: File;
  previewUrl?: string;
};

type Props = {
  userId: string;
  onClose: () => void;
};

type BatchMediaItem = {
  type: "media";
  data: string;
  mimetype: string;
  filename?: string;
  caption?: string;
};

type BatchTextItem = {
  type: "text";
  message: string;
};

type BatchItem = BatchMediaItem | BatchTextItem;

const EMPTY_MESSAGE = "Digite uma mensagem para o preview.";
const TEMPLATE_FIRST_NAME = "${PrimeiroNome}";
const TEMPLATE_FULL_NAME = "${NomeCompleto}";
const BATCH_SETTINGS_STORAGE_KEY = "batch-send-settings-seconds";
const DEFAULT_UNCHECKED_STATUSES = new Set<number>([
  StatusEnum.VendaEfetivada,
  StatusEnum.OptouPelaConcorrencia,
  StatusEnum.NaoEnviarMais,
]);
const ALL_LINKED_OPTION = "all-linked";
const STATUS_LABELS: Record<number, string> = {
  1: "Agendar contato",
  2: "Venda efetivada",
  3: "Stand by",
  4: "Optou pela concorrência",
  5: "Não enviar mais",
};

type BatchSendSettings = {
  intervalMs: string;
  bigIntervalMs: string;
  messagesUntilBigInterval: string;
};

type ServiceOption = {
  id: number;
  nome: string;
};

type UserOption = {
  id: number;
  nome: string;
};

const defaultBatchSettings: BatchSendSettings = {
  intervalMs: "",
  bigIntervalMs: "",
  messagesUntilBigInterval: "",
};

function getMessageTypeFromFile(file: File): Message["type"] {
  if (file.type.startsWith("image")) return "image";
  if (file.type.startsWith("video")) return "video";
  if (file.type.startsWith("audio")) return "audio";
  return "document";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeBase64(dataUrl: string) {
  const split = dataUrl.split(",");
  return split.length > 1 ? split[1] : dataUrl;
}

export function BatchSendModal({ userId, onClose }: Props) {
  const [groups, setGroups] = useState<GrupoWhatsapp[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<
    number | typeof ALL_LINKED_OPTION | ""
  >("");
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [text, setText] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingAllLinked, setLoadingAllLinked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientsModalOpen, setRecipientsModalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [batchSettings, setBatchSettings] =
    useState<BatchSendSettings>(defaultBatchSettings);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [vendors, setVendors] = useState<UserOption[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState(false);
  const [initialDateStart, setInitialDateStart] = useState("");
  const [initialDateEnd, setInitialDateEnd] = useState("");
  const [enabledStatuses, setEnabledStatuses] = useState<Set<number>>(
    () =>
      new Set(
        Object.values(StatusEnum).filter(
          (value): value is number =>
            typeof value === "number" && !DEFAULT_UNCHECKED_STATUSES.has(value),
        ),
      ),
  );
  const [enabledServices, setEnabledServices] = useState<Set<number>>(
    () => new Set(),
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [allLinkedRecipients, setAllLinkedRecipients] = useState<
    GrupoWhatsappConversa[]
  >([]);
  const { user, isAdmin } = useAuth();

  const selectedGroup = useMemo(
    () =>
      typeof selectedGroupId === "number"
        ? groups.find((group) => group.id === selectedGroupId) ?? null
        : null,
    [groups, selectedGroupId],
  );
  const isAllLinkedSelected = selectedGroupId === ALL_LINKED_OPTION;

  const normalizedVendorId = isAdmin && selectedVendorId ? Number(selectedVendorId) : undefined;

  const groupRecipients = useMemo(() => {
    const source = isAllLinkedSelected
      ? allLinkedRecipients
      : selectedGroup?.conversas ?? [];
    if (source.length === 0) return [];
    const unique = new Map<string, GrupoWhatsappConversa>();
    source.forEach((conversa) => {
      if (conversa.whatsappChatId) {
        unique.set(conversa.whatsappChatId, conversa);
      }
    });
    return Array.from(unique.values());
  }, [allLinkedRecipients, isAllLinkedSelected, selectedGroup]);

  const groupRecipientsByChatId = useMemo(() => {
    const map = new Map<string, GrupoWhatsappConversa>();
    groupRecipients.forEach((conversa) => {
      map.set(conversa.whatsappChatId, conversa);
    });
    return map;
  }, [groupRecipients]);

  const statusOptions = useMemo(
    () =>
      Object.entries(StatusEnum)
        .filter(([, value]) => typeof value === "number")
        .map(([label, value]) => ({
          label: STATUS_LABELS[Number(value)] ?? label,
          value: Number(value),
        })),
    [],
  );

  const normalizeStatus = useCallback((status?: string | number) => {
    if (typeof status === "number") return status;
    if (typeof status === "string") {
      const numeric = Number(status);
      if (!Number.isNaN(numeric)) return numeric;
      const match = Object.entries(StatusEnum).find(
        ([label, value]) =>
          typeof value === "number" && label === status.trim(),
      );
      if (match) return Number(match[1]);
    }
    return null;
  }, []);

  const resolveServiceId = useCallback((conversa: GrupoWhatsappConversa) => {
    return (
      conversa.venda?.servicoId ??
      conversa.venda?.servico?.id ??
      null
    );
  }, []);

  const matchesInitialDate = useCallback(
    (conversa: GrupoWhatsappConversa) => {
      if (!initialDateStart && !initialDateEnd) return true;
      const leadDate = conversa.venda?.dataInicial;
      if (!leadDate) return false;
      const parsedLeadDate = new Date(leadDate);
      if (Number.isNaN(parsedLeadDate.getTime())) return false;

      const startDate = initialDateStart ? new Date(initialDateStart) : null;
      const endDate = initialDateEnd ? new Date(initialDateEnd) : null;

      if (startDate && Number.isNaN(startDate.getTime())) return true;
      if (endDate && Number.isNaN(endDate.getTime())) return true;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (startDate && parsedLeadDate < startDate) return false;
      if (endDate && parsedLeadDate > endDate) return false;
      return true;
    },
    [initialDateEnd, initialDateStart],
  );

  const filteredRecipients = useMemo(
    () =>
      groupRecipients.filter((conversa) => {
        const statusValue = normalizeStatus(conversa.venda?.status);
        if (!statusValue) return matchesInitialDate(conversa);
        const serviceId = resolveServiceId(conversa);
        const matchesStatus = enabledStatuses.has(statusValue);
        const matchesService =
          enabledServices.size === 0 || !serviceId
            ? true
            : enabledServices.has(serviceId);
        return matchesStatus && matchesService && matchesInitialDate(conversa);
      }),
    [
      groupRecipients,
      enabledStatuses,
      enabledServices,
      matchesInitialDate,
      normalizeStatus,
      resolveServiceId,
    ],
  );

  useEffect(() => {
    let mounted = true;
    setLoadingGroups(true);
    buscarGruposWhatsapp({ usuarioId: Number(userId) })
      .then((data) => {
        if (!mounted) return;
        setGroups(data ?? []);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError("Não foi possível carregar os grupos.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingGroups(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!isAdmin || !user?.UserId) return;
    setSelectedVendorId((current) => current || String(user.UserId));
  }, [isAdmin, user?.UserId]);

  useEffect(() => {
    if (!isAdmin || !user?.UserId) return;
    let mounted = true;
    const params = new URLSearchParams({
      page: "1",
      pageSize: "200",
      orderBy: "nome",
      orderDirection: "asc",
    });

    BuscarUsuarios(params.toString())
      .then((data) => {
        if (!mounted) return;
        const items = data?.items ?? [];
        setVendors(
          items.map((item: { id: number; nome: string }) => ({
            id: item.id,
            nome: item.nome,
          })),
        );
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      mounted = false;
    };
  }, [isAdmin, user?.UserId]);

  useEffect(() => {
    let mounted = true;

    BuscarServicos("pageSize=1000")
      .then((data) => {
        if (!mounted) return;
        const items = data?.items ?? [];
        setServices(items);
        setEnabledServices(
          new Set(items.map((servico: ServiceOption) => servico.id)),
        );
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError("Não foi possível carregar os serviços.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [previewMessages]);

  useEffect(() => {
    const cached = window.localStorage.getItem(BATCH_SETTINGS_STORAGE_KEY);
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached) as Partial<BatchSendSettings>;
      setBatchSettings((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch (err) {
      console.warn("Não foi possível ler as configurações salvas.", err);
    }
  }, []);

  useEffect(() => {
    setRecipientsModalOpen(false);
    setSelectedRecipients(new Set());
  }, [selectedGroupId]);

  useEffect(() => {
    if (!recipientsModalOpen) {
      setStatusMenuOpen(false);
      setServiceMenuOpen(false);
      setDateFilterModalOpen(false);
    }
  }, [recipientsModalOpen]);

  useEffect(() => {
    if (!isAllLinkedSelected) return;
    let mounted = true;
    setLoadingAllLinked(true);
    buscarVinculosWhatsapp({ vendedorId: normalizedVendorId })
      .then((data) => {
        if (!mounted) return;
        const unique = new Map<string, GrupoWhatsappConversa>();
        (data ?? []).forEach((vinculo) => {
          if (!vinculo.whatsappChatId) return;
          unique.set(vinculo.whatsappChatId, {
            id: vinculo.id,
            vendaWhatsappId: vinculo.vendaId ?? vinculo.id,
            vendaId: vinculo.vendaId,
            venda: vinculo.venda ?? undefined,
            whatsappChatId: vinculo.whatsappChatId,
            whatsappUserId: vinculo.whatsappUserId,
          });
        });
        setAllLinkedRecipients(Array.from(unique.values()));
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError("Não foi possível carregar os vinculados.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingAllLinked(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAllLinkedSelected, normalizedVendorId]);

  useEffect(() => {
    if (groupRecipients.length === 0) return;
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      groupRecipients.forEach((conversa) => {
        const statusValue = normalizeStatus(conversa.venda?.status);
        const serviceId = resolveServiceId(conversa);
        const matchesService =
          enabledServices.size === 0 || !serviceId
            ? true
            : enabledServices.has(serviceId);
        if (!statusValue) {
          if (matchesService && matchesInitialDate(conversa)) {
            next.add(conversa.whatsappChatId);
          } else {
            next.delete(conversa.whatsappChatId);
          }
          return;
        }
        if (
          enabledStatuses.has(statusValue) &&
          matchesService &&
          matchesInitialDate(conversa)
        ) {
          next.add(conversa.whatsappChatId);
        } else {
          next.delete(conversa.whatsappChatId);
        }
      });
      return next;
    });
  }, [
    enabledStatuses,
    enabledServices,
    groupRecipients,
    matchesInitialDate,
    normalizeStatus,
    resolveServiceId,
  ]);

  const handlePreviewSend = (file?: File) => {
    if (!text.trim() && !file) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const id = `preview-${timestamp}-${previewMessages.length}`;

    if (file) {
      const type = getMessageTypeFromFile(file);
      const previewUrl =
        type === "image" || type === "video" || type === "audio"
          ? URL.createObjectURL(file)
          : undefined;

      setPreviewMessages((prev) => [
        ...prev,
        {
          id,
          body: text,
          fromMe: true,
          timestamp,
          type,
          hasMedia: true,
          mediaUrl: previewUrl,
          filename: file.name,
          mimetype: file.type,
          file,
          previewUrl,
        },
      ]);
      return;
    }

    setPreviewMessages((prev) => [
      ...prev,
      {
        id,
        body: text,
        fromMe: true,
        timestamp,
        type: "chat",
        hasMedia: false,
      },
    ]);
  };

  const handleOpenRecipientsModal = () => {
    setError(null);

    if (!selectedGroup && !isAllLinkedSelected) {
      setError("Selecione um grupo para enviar.");
      return;
    }

    if (previewMessages.length === 0) {
      setError("Adicione mensagens ao preview antes de enviar.");
      return;
    }

    if (groupRecipients.length === 0) {
      setError(
        isAllLinkedSelected
          ? "Nenhuma conversa vinculada encontrada."
          : "O grupo selecionado não possui conversas vinculadas.",
      );
      return;
    }

    const chatIds = filteredRecipients.map(
      (conversa) => conversa.whatsappChatId,
    );

    if (chatIds.length === 0) {
      setError("Nenhuma conversa disponível com os filtros selecionados.");
      return;
    }

    setSelectedRecipients(
      new Set(filteredRecipients.map((conversa) => conversa.whatsappChatId)),
    );
    setRecipientsModalOpen(true);
  };

  const handleToggleStatus = (statusValue: number) => {
    setEnabledStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(statusValue)) {
        next.delete(statusValue);
      } else {
        next.add(statusValue);
      }
      return next;
    });
  };

  const handleToggleService = (serviceId: number) => {
    setEnabledServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleToggleRecipient = (chatId: string) => {
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  };

  const handleSelectAllRecipients = (selectAll: boolean) => {
    if (!selectAll) {
      setSelectedRecipients(new Set());
      return;
    }
    setSelectedRecipients(
      new Set(filteredRecipients.map((conversa) => conversa.whatsappChatId)),
    );
  };

  const handleInsertTemplate = (template: string) => {
    setText((prev) => (prev ? `${prev} ${template}` : template));
  };

  const handleSendBatch = async () => {
    setError(null);

    if (!selectedGroup && !isAllLinkedSelected) {
      setError("Selecione um grupo para enviar.");
      return;
    }

    if (selectedRecipients.size === 0) {
      setError("Selecione pelo menos um participante para o envio.");
      return;
    }

    setSending(true);

    try {
      const items: BatchItem[] = [];
      const paramsByChatId: Record<string, Record<string, string>> = {};

      for (const message of previewMessages) {
        if (message.file) {
          const dataUrl = await fileToBase64(message.file);
          items.push({
            type: "media",
            data: normalizeBase64(dataUrl),
            mimetype: message.file.type,
            filename: message.file.name,
            caption: message.body || undefined,
          });
        } else if (message.body.trim()) {
          items.push({ type: "text", message: message.body });
        }
      }

      if (items.length === 0) {
        setError(EMPTY_MESSAGE);
        return;
      }

      Array.from(selectedRecipients).forEach((chatId) => {
        const conversa = groupRecipientsByChatId.get(chatId);
        const nomeCompleto = conversa?.venda?.cliente?.trim();
        if (!nomeCompleto) return;

        const primeiroNome = nomeCompleto.split(" ")[0];
        paramsByChatId[chatId] = {
          PrimeiroNome: primeiroNome,
          NomeCompleto: nomeCompleto,
        };
      });

      const intervalSeconds = Number(batchSettings.intervalMs);
      const bigIntervalSeconds = Number(batchSettings.bigIntervalMs);
      const messagesUntilBigInterval = Number(
        batchSettings.messagesUntilBigInterval,
      );

      await sendBatchMessages(
        userId,
        Array.from(selectedRecipients),
        items,
        Object.keys(paramsByChatId).length ? paramsByChatId : undefined,
        {
          intervalMs:
            Number.isFinite(intervalSeconds) && intervalSeconds > 0
              ? Math.round(intervalSeconds * 1000)
              : undefined,
          bigIntervalMs:
            Number.isFinite(bigIntervalSeconds) && bigIntervalSeconds > 0
              ? Math.round(bigIntervalSeconds * 1000)
              : undefined,
          messagesUntilBigInterval:
            Number.isFinite(messagesUntilBigInterval) &&
            messagesUntilBigInterval > 0
              ? messagesUntilBigInterval
              : undefined,
        },
      );
      window.localStorage.setItem(
        BATCH_SETTINGS_STORAGE_KEY,
        JSON.stringify(batchSettings),
      );
      setPreviewMessages([]);
      setText("");
      setSelectedGroupId("");
      setRecipientsModalOpen(false);
      setSelectedRecipients(new Set());
      onClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar as mensagens.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Envio em grupo
            </h2>
            <p className="text-xs text-gray-500">
              Monte o preview e selecione o grupo para disparar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Fechar
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
          <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-[#f7f8fa] px-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366]/10 text-[#25d366]">
                WG
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  Preview da conversa
                </span>
                <span className="text-xs text-gray-500">
                  Mensagens que serão enviadas
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-[#efeae2] px-4 py-4">
              {previewMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  {EMPTY_MESSAGE}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {previewMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-gray-200 bg-[#f7f8fa]">
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                <button
                  type="button"
                  onClick={() => handleInsertTemplate(TEMPLATE_FIRST_NAME)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Primeiro Nome
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate(TEMPLATE_FULL_NAME)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Nome Completo
                </button>
              </div>
              <MessageInput
                value={text}
                onChange={setText}
                onSend={handlePreviewSend}
              />
            </footer>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <label className="text-sm font-medium text-gray-700">
                Grupo de envio
              </label>
              <select
                value={selectedGroupId}
                onChange={(event) =>
                  setSelectedGroupId(
                    event.target.value
                      ? event.target.value === ALL_LINKED_OPTION
                        ? ALL_LINKED_OPTION
                        : Number(event.target.value)
                      : "",
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              >
                <option value="">Selecione um grupo</option>
                <option value={ALL_LINKED_OPTION}>Todos vinculados</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nome}
                  </option>
                ))}
              </select>
              <div className="mt-3 text-xs text-gray-500">
                {loadingGroups || loadingAllLinked
                  ? "Carregando conversas..."
                  : isAllLinkedSelected
                    ? `${groupRecipients.length} conversas vinculadas`
                    : selectedGroup
                      ? `${selectedGroup.conversas?.length ?? 0} conversas vinculadas`
                      : "Selecione um grupo para visualizar as conversas"}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Intervalos de envio
                </span>
                <span className="text-xs text-gray-500">
                  Configure o intervalo padrão e o intervalo maior para lotes.
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Intervalo entre mensagens (s)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={batchSettings.intervalMs}
                    onChange={(event) =>
                      setBatchSettings((prev) => ({
                        ...prev,
                        intervalMs: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                    placeholder="Ex: 1.2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Intervalo maior (s)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={batchSettings.bigIntervalMs}
                    onChange={(event) =>
                      setBatchSettings((prev) => ({
                        ...prev,
                        bigIntervalMs: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                    placeholder="Ex: 5"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Mensagens até o intervalo maior
                  <input
                    type="number"
                    min="0"
                    value={batchSettings.messagesUntilBigInterval}
                    onChange={(event) =>
                      setBatchSettings((prev) => ({
                        ...prev,
                        messagesUntilBigInterval: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                    placeholder="Ex: 10"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleOpenRecipientsModal}
              disabled={sending}
              className="w-full rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Enviando..." : "Enviar mensagens em lote"}
            </button>

            <button
              type="button"
              onClick={() => setPreviewMessages([])}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Limpar preview
            </button>
          </aside>
        </div>
      </div>

      {recipientsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Selecionar participantes
                </h3>
                <p className="text-xs text-gray-500">
                  Escolha quem receberá as mensagens do grupo.
                </p>
              </div>
              <button
                onClick={() => setRecipientsModalOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 text-xs text-gray-500">
                <span>
                  {selectedRecipients.size} de {filteredRecipients.length}{" "}
                  selecionados
                </span>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <select
                      value={selectedVendorId}
                      onChange={(event) =>
                        setSelectedVendorId(event.target.value)
                      }
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                    >
                      <option value="">Todos os vendedores</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.nome}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusMenuOpen((prev) => !prev)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Status
                    </button>
                    {statusMenuOpen && (
                      <div className="absolute left-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                          Filtrar participantes por status.
                        </div>
                        <div className="max-h-48 space-y-2 overflow-y-auto px-3 py-2">
                          {statusOptions.map((status) => (
                            <label
                              key={status.value}
                              className="flex items-center gap-2 text-xs text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={enabledStatuses.has(status.value)}
                                onChange={() =>
                                  handleToggleStatus(status.value)
                                }
                                className="h-4 w-4 accent-[#25d366]"
                              />
                              <span>{status.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setServiceMenuOpen((prev) => !prev)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Serviço
                    </button>
                    {serviceMenuOpen && (
                      <div className="absolute left-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                          Filtrar participantes por serviço.
                        </div>
                        <div className="max-h-48 space-y-2 overflow-y-auto px-3 py-2">
                          {services.length === 0 ? (
                            <span className="text-xs text-gray-500">
                              Nenhum serviço disponível.
                            </span>
                          ) : (
                            services.map((servico) => (
                              <label
                                key={servico.id}
                                className="flex items-center gap-2 text-xs text-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={enabledServices.has(servico.id)}
                                  onChange={() =>
                                    handleToggleService(servico.id)
                                  }
                                  className="h-4 w-4 accent-[#25d366]"
                                />
                                <span>{servico.nome}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDateFilterModalOpen((prev) => !prev)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Data de cadastro
                    </button>
                    {dateFilterModalOpen && (
                      <div className="absolute left-0 z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg">
                        <div className="mb-2 text-[11px] text-gray-500">
                          Defina o período mínimo e máximo do lead.
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="flex flex-col gap-1">
                            Data mínima
                            <input
                              type="date"
                              value={initialDateStart}
                              onChange={(event) =>
                                setInitialDateStart(event.target.value)
                              }
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            Data máxima
                            <input
                              type="date"
                              value={initialDateEnd}
                              onChange={(event) =>
                                setInitialDateEnd(event.target.value)
                              }
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setInitialDateStart("");
                              setInitialDateEnd("");
                            }}
                            className="mt-1 self-start text-[11px] text-gray-500 hover:text-gray-700"
                          >
                            Limpar datas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectAllRecipients(true)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Selecionar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllRecipients(false)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Limpar seleção
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {filteredRecipients.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
                    Nenhuma conversa disponível com os filtros selecionados.
                  </div>
                ) : (
                  filteredRecipients.map((conversa) => {
                    const cliente = conversa.venda?.cliente;
                    const contato = conversa.venda?.contato;
                    const label =
                      cliente ||
                      contato ||
                      `Conversa ${conversa.vendaWhatsappId}`;
                    const secondary = cliente ? contato : null;
                    return (
                      <label
                        key={conversa.whatsappChatId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {label}
                          </span>
                          {secondary && (
                            <span className="text-xs text-gray-500">
                              {secondary}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            ID chat: {conversa.whatsappChatId}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedRecipients.has(
                            conversa.whatsappChatId,
                          )}
                          onChange={() =>
                            handleToggleRecipient(conversa.whatsappChatId)
                          }
                          className="h-4 w-4 accent-[#25d366]"
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setRecipientsModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendBatch}
                disabled={sending || selectedRecipients.size === 0}
                className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Enviando..." : "Confirmar envio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
