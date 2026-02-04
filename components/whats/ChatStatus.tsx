"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Chat, ChatStatusDto, WhatsStatusEnum } from "@/types/chat";
import { normalizarContato } from "./normalizarContato";
import { addContactToAddressbook } from "@/services/whatsapp";

export function ChatVendaStatus({
  status,
  onVincular,
  onDesvincular,
  chat,
  whatsappUserId,
}: {
  status: ChatStatusDto;
  onVincular: (vendaId: number) => void;
  onDesvincular: (vendaWhatsappId: number) => void;
  chat?: Chat;
  whatsappUserId?: string;
}) {
  const [confirmarDesvinculo, setConfirmarDesvinculo] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [contactAdded, setContactAdded] = useState(false);

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
        <div className="flex flex-col gap-1 text-xs text-orange-600">
          <span>
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
          <span className="text-[11px] text-blue-700">
            <button
              className="underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAddingContact || contactAdded || !whatsappUserId}
              onClick={async () => {
                if (!whatsappUserId) return;
                const numero = normalizarContato(chat);
                if (!numero) {
                  setAddError("Número inválido para adicionar contato.");
                  return;
                }
                const [firstName, ...rest] = (chat?.name ?? "").split(" ");
                setIsAddingContact(true);
                setAddError(null);
                try {
                  await addContactToAddressbook(whatsappUserId, {
                    phoneNumber: numero,
                    firstName: firstName || numero,
                    lastName: rest.join(" "),
                    syncToAddressbook: true,
                  });
                  setContactAdded(true);
                } catch (error) {
                  setAddError(
                    error instanceof Error
                      ? error.message
                      : "Erro ao adicionar contato."
                  );
                } finally {
                  setIsAddingContact(false);
                }
              }}
            >
              {contactAdded
                ? "Contato adicionado"
                : isAddingContact
                  ? "Adicionando..."
                  : "Adicionar contato"}
            </button>
          </span>
          {addError && <span className="text-[11px] text-red-600">{addError}</span>}
        </div>
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
