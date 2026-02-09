import { apiFetch } from "./api";

export type GrupoWhatsappConversa = {
  id: number;
  vendaWhatsappId: number;
  vendaId: number;
  venda?: {
    cliente: string;
    contato: string;
    status: string | number;
    servicoId?: number;
    servico?: {
      id: number;
      nome: string;
    };
  };
  whatsappChatId: string;
  whatsappUserId: string;
};

export type GrupoWhatsapp = {
  id: number;
  nome: string;
  conversas: GrupoWhatsappConversa[];
};

export type VendaWhatsappVinculo = {
  id: number;
  vendaId: number;
  whatsappChatId: string;
  whatsappUserId: string;
  venda?: {
    cliente: string;
    contato: string;
    status: string | number;
    servicoId?: number;
    servico?: {
      id: number;
      nome: string;
    };
  };
};

export type BuscarGruposWhatsappParams = {
  id?: number;
  usuarioId?: number;
};

export async function buscarGruposWhatsapp(
  params: BuscarGruposWhatsappParams = {},
): Promise<GrupoWhatsapp[]> {
  const query = new URLSearchParams();

  if (params.id) query.append("id", String(params.id));
  if (params.usuarioId) query.append("usuarioId", String(params.usuarioId));

  const queryString = query.toString();
  const endpoint = queryString
    ? `/venda/whatsapp/grupos?${queryString}`
    : "/venda/whatsapp/grupos";

  return await apiFetch(endpoint, { method: "GET" });
}

export async function buscarVinculosWhatsapp(
  pesquisa?: string,
): Promise<VendaWhatsappVinculo[]> {
  const query = new URLSearchParams();

  if (pesquisa?.trim()) {
    query.append("Pesquisa", pesquisa.trim());
  }

  const queryString = query.toString();
  const endpoint = queryString
    ? `/venda/whatsapp/vinculos?${queryString}`
    : "/venda/whatsapp/vinculos";

  return await apiFetch(endpoint, { method: "GET" });
}

export async function buscarGruposWhatsappPorVenda(
  vendaId: number | string,
): Promise<GrupoWhatsapp[]> {
  return await apiFetch(`/venda/whatsapp/grupos/venda/${vendaId}`, {
    method: "GET",
  });
}

export async function buscarGruposWhatsappPorChat(
  whatsappChatId: string,
): Promise<GrupoWhatsapp[]> {
  return await apiFetch(`/venda/whatsapp/grupos/chat/${whatsappChatId}`, {
    method: "GET",
  });
}

export async function criarGrupoWhatsapp(data: {
  nome: string;
  usuarioId: number;
  status?: number;
  dataInicialDe?: string;
  dataInicialAte?: string;
}) {
  return await apiFetch("/venda/grupo", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adicionarConversaAoGrupo(data: {
  idGrupoWhats: number;
  idVendaWhats: number;
}) {
  return await apiFetch("/venda/adicionargrupo", {
    method: "POST",
    body: JSON.stringify({
      idGrupoWhats: data.idGrupoWhats,
      idVendaWhats: data.idVendaWhats,
    }),
  });
}

export async function excluirGrupoWhatsapp(grupoId: number) {
  return await apiFetch(`/venda/grupo/${grupoId}`, { method: "DELETE" });
}

export async function removerConversaGrupoWhatsapp({
  idGrupoWhats,
  idsVendaWhats,
}: {
  idGrupoWhats: number;
  idsVendaWhats: number[];
}) {
  return await apiFetch(`/venda/grupo/conversas`, {
    method: "DELETE",
    body: JSON.stringify({
      idGrupoWhats,
      idsVendaWhats,
    }),
  });
}
