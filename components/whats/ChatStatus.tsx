"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Chat, ChatStatusDto, WhatsStatusEnum } from "@/types/chat";

function normalizarContato(
  chat: { id?: string; name?: string; isGroup?: boolean } | null | undefined,
) {
  if (!chat || chat.isGroup) return null;

  const id = chat.id ?? "";
  const name = chat.name ?? "";

  // 1) ID padrão de telefone: 55...@c.us
  if (id.endsWith("@c.us")) {
    const somenteDigitos = id.replace(/\D/g, ""); // remove @c.us etc
    return somenteDigitos.replace(/^(00)?55/, ""); // tira 55 (e 0055)
  }

  // 2) Se for @lid (ou outro), tenta pegar do "name" caso seja telefone
  const nameDigitos = name.replace(/\D/g, "");
  // Heurística simples BR: com DDD fica 10 ou 11 dígitos (sem +55)
  // Se vier com 55 na frente, remove.
  const semPais = nameDigitos.replace(/^(00)?55/, "");
  if (semPais.length === 10 || semPais.length === 11) {
    return semPais;
  }

  // 3) Não consegui inferir número
  return null;
}

export function ChatVendaStatus({
  status,
  onVincular,
  onDesvincular,
  chat,
}: {
  status: ChatStatusDto;
  onVincular: (vendaId: number) => void;
  onDesvincular: (vendaWhatsappId: number) => void;
  chat?: Chat;
}) {
  const [confirmarDesvinculo, setConfirmarDesvinculo] = useState(false);

  switch (status.status) {
    case WhatsStatusEnum.Criado:
      return (
        <>
          <div className="flex items-center gap-2 text-xs text-green-600">
            <span>✔ Vinculado ao lead {status.venda?.cliente}</span>
            {status.venda?.vendaWhatsapp?.id && (
              <button
                className="underline hover:text-red-700"
                onClick={() => setConfirmarDesvinculo(true)}
              >
                Remover vínculo
              </button>
            )}
          </div>

          <ConfirmModal
            open={confirmarDesvinculo}
            title="Remover vínculo"
            description="Essa ação remove o chat e o lead de todos os grupos de envio."
            confirmLabel="Remover"
            variant="danger"
            onClose={() => setConfirmarDesvinculo(false)}
            onConfirm={() => {
              if (status.venda?.vendaWhatsapp?.id) {
                onDesvincular(status.venda.vendaWhatsapp.id);
              }
              setConfirmarDesvinculo(false);
            }}
          />
        </>
      );

    case WhatsStatusEnum.NaoEncontrado:
      return (
        <span className="text-xs text-orange-600">
          ⚠ Nenhum lead encontrado para este contato{" "}
          <button
            className="underline hover:text-blue-800"
            onClick={() => {
              const numero = normalizarContato(chat);

              const params = new URLSearchParams();
              if (numero) params.set("contato", numero);
              if (chat?.name) params.set("cliente", chat.name);

              window.open(
                `/venda/novo?${params.toString()}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            Criar Lead
          </button>
        </span>
      );

    case WhatsStatusEnum.NaoCriado:
      return (
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <span>💡 Lead encontrado - {status.venda?.cliente} - </span>
          <button
            className="underline hover:text-blue-800"
            onClick={() => {
              onVincular(status.venda!.id ?? 0);
            }}
          >
            Vincular conversa
          </button>
        </div>
      );

    default:
      return null;
  }
}
