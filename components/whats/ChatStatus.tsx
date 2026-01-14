"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Chat, ChatStatusDto, WhatsStatusEnum } from "@/types/chat";

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
              const numeroSemPais = chat?.id
                .replace(/\D/g, "")
                .replace(/^(00)?55/, "");
              window.open(
                `/venda/novo?contato=${numeroSemPais}`,
                "_blank",
                "noopener,noreferrer"
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
