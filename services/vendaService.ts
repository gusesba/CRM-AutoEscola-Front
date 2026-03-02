import { ChatStatusDto } from "@/types/chat";
import { apiFetch } from "./api";

export interface IVendaServicoDto {
  id?: number;
  sedeId: number;
  vendedorId: number;
  cliente: string;
  genero: number;
  origem: number;
  email: string;
  fone: string;
  contato: string;
  comoConheceu: string;
  motivoEscolha: string;
  servicoId: number;
  obs: string;
  condicaoVendaId: number;
  status: number;
  valorVenda: string;
  indicacao: string;
  dataNascimento: string;
  dataRetorno?: string;
  obsRetorno?: string;
  vendaWhatsapp?: {
    id: number;
    vendaId?: number;
    whatsappChatId?: string;
    whatsappUserId?: string;
  } | null;
}

export interface VendaChatVinculoDto {
  vendaId: number;
  vinculado: boolean;
  vendaWhatsappId?: number | null;
  whatsappChatId?: string | null;
}

type VincularVendaWhatsPayload = {
  vendaId: number;
  whatsappChatId: string;
  whatsappChatNumero?: string;
  whatsappUserId: string;
};

export const CriarVenda = async (data: IVendaServicoDto) => {
  try {
    return await apiFetch("/venda", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        valorVenda:
          data.valorVenda === "" || data.valorVenda == null
            ? null
            : Number(String(data.valorVenda).replace(",", ".")),

        dataNascimento:
          data.dataNascimento === "" || data.dataNascimento == null
            ? null
            : new Date(data.dataNascimento),
        dataRetorno:
          data.dataRetorno === "" || data.dataRetorno == null
            ? null
            : new Date(data.dataRetorno),
      }),
    });
  } catch (error) {
    console.error("Erro ao criar venda:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao criar venda.");
  }
};

export const BuscarVendas = async (parametros: string) => {
  try {
    return await apiFetch(`/venda?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar vendas.");
  }
};

export const BuscarVendaPorId = async (id: string) => {
  try {
    return await apiFetch(`/venda/${id}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar venda por ID:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar venda.");
  }
};

export const AtualizarVenda = async (id: string, data: any) => {
  try {
    return await apiFetch(`/venda`, {
      method: "PUT",
      body: JSON.stringify({
        id,
        ...data,
        valorVenda:
          data.valorVenda === "" || data.valorVenda == null
            ? null
            : Number(String(data.valorVenda).replace(",", ".")),

        dataNascimento:
          data.dataNascimento === "" || data.dataNascimento == null
            ? null
            : new Date(data.dataNascimento),
        dataRetorno:
          data.dataRetorno === "" || data.dataRetorno == null
            ? null
            : new Date(data.dataRetorno),
      }),
    });
  } catch (error) {
    console.error("Erro ao atualizar venda:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao atualizar venda.");
  }
};

export const TransferirVendas = async (
  usuarioDestinoId: number,
  vendasIds: number[],
  permanente = false
) => {
  try {
    return await apiFetch(`/venda/transferir`, {
      method: "PATCH",
      body: JSON.stringify({
        usuarioId: usuarioDestinoId,
        vendasIds,
        permanente,
      }),
    });
  } catch (error) {
    console.error("Erro ao transferir vendas:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao transferir vendas.");
  }
};

export const BuscarDashboard = async (parametros: string) => {
  try {
    return await apiFetch(`/venda/dashboard?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar dashboard.");
  }
};

export async function getChatStatus(
  chatId: string,
  userId: string,
  contato?: string | null
): Promise<ChatStatusDto> {
  try {
    const params = new URLSearchParams({
      whatsappChatId: chatId,
      whatsappUserId: userId,
    });
    if (contato) {
      params.set("contato", contato);
      params.set("whatsappChatNumero", contato);
    }
    return await apiFetch(
      `/venda/whatsapp?${params.toString()}`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.error("Erro ao buscar Chat:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar Chat.");
  }
}

export async function vincularVendaWhats(payload: VincularVendaWhatsPayload) {
  try {
    return await apiFetch(`/venda/vincular`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Erro ao vincular venda ao WhatsApp:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao vincular venda ao WhatsApp.");
  }
}

export async function desvincularVendaWhats(vendaWhatsappId: number) {
  try {
    return await apiFetch(`/venda/whatsapp/${vendaWhatsappId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Erro ao desvincular venda do WhatsApp:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao desvincular venda do WhatsApp.");
  }
}

export async function BuscarVendaChatVinculo(vendaId: string | number) {
  try {
    return await apiFetch(`/venda/whatsapp/vinculo/${vendaId}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar vínculo da venda com WhatsApp:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar vínculo da venda.");
  }
}
