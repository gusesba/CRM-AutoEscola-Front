"use client";

import { ClipboardEvent, useMemo, useEffect, useRef, useState } from "react";
import { formatWhatsText } from "@/lib/formatWhatsText";
import { Paperclip, Send, Mic, Smile } from "lucide-react";
import { Message } from "@/types/messages";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: (attachment?: File) => void;
  disabled?: boolean;
  disableAttachments?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editMessage?: Message | null;
  onCancelEdit?: () => void;
};

type Attachment = {
  file: File;
  type: "image" | "video" | "audio" | "document";
  previewUrl?: string;
};

type EmojiItem = {
  emoji: string;
  name: string;
  keywords: string[];
};

const EMOJI_CATALOG: EmojiItem[] = [
  { emoji: "😀", name: "sorriso", keywords: ["feliz", "alegre", "smile"] },
  { emoji: "😁", name: "sorriso aberto", keywords: ["feliz", "dentes"] },
  { emoji: "😂", name: "rindo", keywords: ["risada", "engraçado", "kkk"] },
  { emoji: "🤣", name: "rolando de rir", keywords: ["risada", "kkk"] },
  { emoji: "😊", name: "sorriso suave", keywords: ["fofo", "feliz"] },
  { emoji: "😍", name: "apaixonado", keywords: ["amor", "coração"] },
  { emoji: "😘", name: "beijo", keywords: ["amor", "carinho"] },
  { emoji: "😎", name: "óculos escuros", keywords: ["cool", "estilo"] },
  { emoji: "🤩", name: "maravilhado", keywords: ["uau", "estrela"] },
  { emoji: "🥳", name: "festa", keywords: ["comemorar", "aniversário"] },
  { emoji: "😢", name: "chorando", keywords: ["triste", "lágrima"] },
  { emoji: "😭", name: "choro alto", keywords: ["triste", "muito triste"] },
  { emoji: "😡", name: "bravo", keywords: ["raiva", "irritado"] },
  { emoji: "😴", name: "sono", keywords: ["dormir", "cansado"] },
  { emoji: "🤔", name: "pensando", keywords: ["duvida", "hmm"] },
  { emoji: "🙄", name: "revirando olhos", keywords: ["tédio"] },
  { emoji: "🙏", name: "mãos juntas", keywords: ["obrigado", "por favor", "oração"] },
  { emoji: "👍", name: "joinha", keywords: ["ok", "bom", "aprovar"] },
  { emoji: "👎", name: "não curti", keywords: ["ruim", "reprovar"] },
  { emoji: "👏", name: "palmas", keywords: ["aplauso"] },
  { emoji: "🙌", name: "mãos para cima", keywords: ["vitória", "comemorar"] },
  { emoji: "🤝", name: "aperto de mão", keywords: ["acordo", "parceria"] },
  { emoji: "💪", name: "força", keywords: ["musculo", "treino"] },
  { emoji: "🫶", name: "coração com mãos", keywords: ["amor", "carinho"] },
  { emoji: "❤️", name: "coração vermelho", keywords: ["amor", "paixão"] },
  { emoji: "🧡", name: "coração laranja", keywords: ["amor"] },
  { emoji: "💛", name: "coração amarelo", keywords: ["amor"] },
  { emoji: "💚", name: "coração verde", keywords: ["amor"] },
  { emoji: "💙", name: "coração azul", keywords: ["amor"] },
  { emoji: "💜", name: "coração roxo", keywords: ["amor"] },
  { emoji: "🖤", name: "coração preto", keywords: ["amor"] },
  { emoji: "🤍", name: "coração branco", keywords: ["amor"] },
  { emoji: "🤎", name: "coração marrom", keywords: ["amor"] },
  { emoji: "💔", name: "coração partido", keywords: ["triste", "término"] },
  { emoji: "🔥", name: "fogo", keywords: ["quente", "top"] },
  { emoji: "✨", name: "brilhos", keywords: ["estrela", "destaque"] },
  { emoji: "🎉", name: "confete", keywords: ["festa", "comemorar"] },
  { emoji: "🎊", name: "serpentina", keywords: ["festa"] },
  { emoji: "🎂", name: "bolo", keywords: ["aniversário"] },
  { emoji: "🎁", name: "presente", keywords: ["gift"] },
  { emoji: "🏆", name: "troféu", keywords: ["vitória", "premio"] },
  { emoji: "⚽", name: "futebol", keywords: ["bola", "esporte"] },
  { emoji: "🏀", name: "basquete", keywords: ["esporte"] },
  { emoji: "🎵", name: "nota musical", keywords: ["música", "som"] },
  { emoji: "🎶", name: "músicas", keywords: ["música", "som"] },
  { emoji: "📸", name: "camera", keywords: ["foto"] },
  { emoji: "📞", name: "telefone", keywords: ["ligação", "call"] },
  { emoji: "📱", name: "celular", keywords: ["telefone", "mobile"] },
  { emoji: "💻", name: "notebook", keywords: ["computador", "pc"] },
  { emoji: "🧠", name: "cérebro", keywords: ["pensar", "mente"] },
  { emoji: "💡", name: "ideia", keywords: ["luz", "dica"] },
  { emoji: "✅", name: "check", keywords: ["ok", "feito", "confirmado"] },
  { emoji: "❌", name: "x", keywords: ["erro", "cancelar", "não"] },
  { emoji: "⚠️", name: "alerta", keywords: ["atenção", "cuidado"] },
  { emoji: "🚀", name: "foguete", keywords: ["lançamento", "rápido"] },
  { emoji: "🛠️", name: "ferramentas", keywords: ["conserto", "ajuste"] },
  { emoji: "📌", name: "alfinete", keywords: ["fixar", "importante"] },
  { emoji: "📍", name: "localização", keywords: ["endereço", "mapa"] },
  { emoji: "📝", name: "anotação", keywords: ["nota", "texto"] },
  { emoji: "📅", name: "calendário", keywords: ["data", "agenda"] },
  { emoji: "⏰", name: "despertador", keywords: ["hora", "tempo"] },
  { emoji: "⌛", name: "ampulheta", keywords: ["espera", "tempo"] },
  { emoji: "💰", name: "dinheiro", keywords: ["grana", "financeiro"] },
  { emoji: "💸", name: "dinheiro voando", keywords: ["gasto", "pagamento"] },
  { emoji: "🧾", name: "recibo", keywords: ["nota fiscal", "pagamento"] },
  { emoji: "🏠", name: "casa", keywords: ["lar"] },
  { emoji: "🚗", name: "carro", keywords: ["veículo", "auto"] },
  { emoji: "🚌", name: "ônibus", keywords: ["transporte"] },
  { emoji: "✈️", name: "avião", keywords: ["viagem"] },
  { emoji: "🌞", name: "sol", keywords: ["calor", "dia"] },
  { emoji: "🌧️", name: "chuva", keywords: ["clima"] },
  { emoji: "🌈", name: "arco íris", keywords: ["cores"] },
  { emoji: "🌹", name: "rosa", keywords: ["flor", "amor"] },
  { emoji: "🍀", name: "trevo", keywords: ["sorte"] },
  { emoji: "🍕", name: "pizza", keywords: ["comida"] },
  { emoji: "🍔", name: "hamburguer", keywords: ["comida"] },
  { emoji: "🍟", name: "batata frita", keywords: ["comida"] },
  { emoji: "☕", name: "café", keywords: ["bebida"] },
  { emoji: "🍺", name: "cerveja", keywords: ["bebida"] },
  { emoji: "🥤", name: "refrigerante", keywords: ["bebida"] },
  { emoji: "🐶", name: "cachorro", keywords: ["pet", "animal"] },
  { emoji: "🐱", name: "gato", keywords: ["pet", "animal"] },
  { emoji: "🐼", name: "panda", keywords: ["animal"] },
  { emoji: "🦁", name: "leão", keywords: ["animal"] },
  { emoji: "🐴", name: "cavalo", keywords: ["animal"] },
  { emoji: "🙋", name: "levantando a mão", keywords: ["eu", "pergunta"] },
  { emoji: "🤷", name: "não sei", keywords: ["dúvida", "sei lá"] },
  { emoji: "💃", name: "dançando", keywords: ["festa", "dança"] },
  { emoji: "🕺", name: "dançando", keywords: ["festa", "dança"] },
  { emoji: "👀", name: "olhos", keywords: ["vendo", "atenção"] },
  { emoji: "🫡", name: "saudação", keywords: ["respeito"] },
  { emoji: "🤗", name: "abraço", keywords: ["carinho"] },
  { emoji: "🤙", name: "me liga", keywords: ["telefone"] },
  { emoji: "🤞", name: "dedos cruzados", keywords: ["sorte"] },
  { emoji: "👌", name: "ok", keywords: ["certo"] },
  { emoji: "💬", name: "balão de fala", keywords: ["mensagem", "chat"] },
  { emoji: "📢", name: "alto falante", keywords: ["aviso", "anúncio"] },
  { emoji: "🔒", name: "cadeado", keywords: ["segurança"] },
  { emoji: "🔓", name: "cadeado aberto", keywords: ["desbloquear"] },
  { emoji: "🗑️", name: "lixeira", keywords: ["apagar", "deletar"] },
  { emoji: "🔍", name: "lupa", keywords: ["buscar", "pesquisar"] },
  { emoji: "📎", name: "clipe", keywords: ["anexo"] },
  { emoji: "📤", name: "enviar", keywords: ["upload", "mandar"] },
  { emoji: "📥", name: "receber", keywords: ["download"] },
  { emoji: "🧩", name: "quebra cabeça", keywords: ["peça", "solução"] },
  { emoji: "🧪", name: "teste", keywords: ["experimento"] },
  { emoji: "🛡️", name: "escudo", keywords: ["proteção"] },
  { emoji: "📈", name: "gráfico subindo", keywords: ["crescimento", "vendas"] },
  { emoji: "📉", name: "gráfico caindo", keywords: ["queda", "vendas"] },
  { emoji: "🤖", name: "robô", keywords: ["bot", "ia"] },
];

const RECENT_EMOJIS_STORAGE_KEY = "whatsapp-recent-emojis";
const MAX_RECENT_EMOJIS = 10;

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  disableAttachments,
  replyTo,
  onCancelReply,
  editMessage,
  onCancelEdit,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [emojiSearch, setEmojiSearch] = useState("");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const visibleEmojis = useMemo(() => {
    const term = emojiSearch.trim().toLocaleLowerCase();

    if (!term) {
      return EMOJI_CATALOG;
    }

    return EMOJI_CATALOG.filter(({ emoji, name, keywords }) =>
      emoji.includes(term) ||
      name.toLocaleLowerCase().includes(term) ||
      keywords.some((keyword) => keyword.toLocaleLowerCase().includes(term)),
    );
  }, [emojiSearch]);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return;

      const validRecent = parsed
        .filter((item): item is string => typeof item === "string")
        .filter((emoji) => EMOJI_CATALOG.some((catalogEmoji) => catalogEmoji.emoji === emoji))
        .slice(0, MAX_RECENT_EMOJIS);

      setRecentEmojis(validRecent);
    } catch {
      localStorage.removeItem(RECENT_EMOJIS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, [attachment]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!emojiPickerRef.current) return;

      if (!emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setEmojiSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

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
    setShowEmojiPicker(false);
    setEmojiSearch("");
    setAttachment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearAttachment() {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (disabled || disableAttachments) return;

    const clipboardItems = Array.from(event.clipboardData.items ?? []);
    const fileItem = clipboardItems.find((item) => item.kind === "file");

    if (!fileItem) return;

    const file = fileItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    handleFileSelect(file);
  }

  function handleAddEmoji(emoji: string) {
    if (disabled) return;

    setRecentEmojis((current) => {
      const next = [emoji, ...current.filter((item) => item !== emoji)].slice(
        0,
        MAX_RECENT_EMOJIS,
      );

      localStorage.setItem(RECENT_EMOJIS_STORAGE_KEY, JSON.stringify(next));

      return next;
    });

    const textarea = textareaRef.current;

    if (!textarea) {
      onChange(`${value}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`;

    onChange(nextValue);

    requestAnimationFrame(() => {
      const nextCursor = start + emoji.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-full  rounded-xl flex flex-col gap-3">
        {editMessage && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500">
                Editando mensagem
              </p>
              <p className="truncate text-sm text-gray-700">
                {getReplyPreview(editMessage)}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cancelar edição"
            >
              ✕
            </button>
          </div>
        )}
        {replyTo && !editMessage && (
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
              type="button"
              onClick={clearAttachment}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 cursor-pointer"
            >
              ✕
            </button>

            {/* 📐 Área fixa */}
            <div className="w-[220px] h-[100px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
              {attachment.type === "image" && (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.file.name}
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

          {/* 😊 Emoji */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker((prev) => {
                  const next = !prev;

                  if (!next) {
                    setEmojiSearch("");
                  }

                  return next;
                });
              }}
              className="p-2 text-gray-600 hover:bg-black/5 rounded-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              aria-label="Abrir emojis"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-20 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(event) => setEmojiSearch(event.target.value)}
                  placeholder="Buscar emoji"
                  className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-400"
                />

                {emojiSearch.trim() === "" && recentEmojis.length > 0 && (
                  <div className="mb-2 border-b border-gray-100 pb-2">
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Últimos utilizados
                    </p>
                    <div className="grid grid-cols-10 gap-1">
                      {recentEmojis.map((emoji) => {
                        const emojiLabel =
                          EMOJI_CATALOG.find((catalogEmoji) => catalogEmoji.emoji === emoji)
                            ?.name ?? emoji;

                        return (
                          <button
                            key={`recent-${emoji}`}
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none transition hover:bg-gray-100"
                            onClick={() => handleAddEmoji(emoji)}
                            aria-label={`Inserir emoji recente ${emojiLabel}`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto pr-1">
                  {visibleEmojis.map(({ emoji, name }) => (
                    <button
                      key={emoji}
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none transition hover:bg-gray-100"
                      onClick={() => handleAddEmoji(emoji)}
                      aria-label={`Inserir emoji ${name}`}
                    >
                      {emoji}
                    </button>
                  ))}

                  {visibleEmojis.length === 0 && (
                    <p className="col-span-8 py-2 text-center text-xs text-gray-500">
                      Nenhum emoji encontrado.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

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
              onPaste={handlePaste}
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
