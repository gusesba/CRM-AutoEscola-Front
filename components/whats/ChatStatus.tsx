"use client";

import { Chat, ChatStatusDto, WhatsStatusEnum } from "@/types/chat";
import { useRouter } from "next/navigation";

export function ChatVendaStatus({
  status,
  onVincular,
  chat,
}: {
  status: ChatStatusDto;
  onVincular: (vendaId: number) => void;
  chat?: Chat;
}) {
  const router = useRouter();
  switch (status.status) {
    case WhatsStatusEnum.Criado:
      return (
        <span className="text-xs text-green-600">
          ✔ Vinculado ao lead {status.venda?.cliente}
        </span>
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
