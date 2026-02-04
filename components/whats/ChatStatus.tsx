"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Chat, ChatStatusDto, WhatsStatusEnum } from "@/types/chat";
import { normalizarContato } from "./normalizarContato";
import { addContactToAddressbook } from "@/services/whatsapp";
import { getPhoneDigits } from "@/lib/whatsappPhone";

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleOpenAddModal = () => {
    const numero = normalizarContato(chat) ?? "";
    const [first, ...rest] = (chat?.name ?? "").split(" ");
    setPhoneNumber(numero);
    setFirstName(first);
    setLastName(rest.join(" "));
    setAddError(null);
    setIsAddModalOpen(true);
  };

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
              onClick={handleOpenAddModal}
            >
              {contactAdded
                ? "Contato adicionado"
                : isAddingContact
                  ? "Adicionando..."
                  : "Adicionar contato"}
            </button>
          </span>
          {addError && <span className="text-[11px] text-red-600">{addError}</span>}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl text-gray-900">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Adicionar contato
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Confirme os dados do contato antes de salvar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                    aria-label="Fechar modal"
                  >
                    ×
                  </button>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Número
                    </label>
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      First name
                    </label>
                    <input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      placeholder="Nome"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Last name
                    </label>
                    <input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      placeholder="Sobrenome"
                    />
                  </div>
                  {addError && (
                    <p className="text-xs text-red-600">{addError}</p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isAddingContact}
                    onClick={async () => {
                      if (!whatsappUserId) return;
                      const digits = getPhoneDigits(phoneNumber);
                      if (!digits) {
                        setAddError("Número inválido para adicionar contato.");
                        return;
                      }
                      setIsAddingContact(true);
                      setAddError(null);
                      try {
                        await addContactToAddressbook(whatsappUserId, {
                          phoneNumber: digits,
                          firstName: firstName.trim() || undefined,
                          lastName: lastName.trim() || undefined,
                          syncToAddressbook: true,
                        });
                        setContactAdded(true);
                        setIsAddModalOpen(false);
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
                    className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingContact ? "Salvando..." : "Salvar contato"}
                  </button>
                </div>
              </div>
            </div>
          )}
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
