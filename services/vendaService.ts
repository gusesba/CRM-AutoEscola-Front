import { apiFetch } from "./api";

interface IVendaServicoDto {
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
  valorVenda: number;
  indicacao: string;
  dataNascimento: string;
}

export const CriarVenda = async (data: IVendaServicoDto) => {
  try {
    await apiFetch("/venda", {
      method: "POST",
      body: JSON.stringify(data),
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
    return await apiFetch(`/venda/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Erro ao atualizar venda:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao atualizar venda.");
  }
};
