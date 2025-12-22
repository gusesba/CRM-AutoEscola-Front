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
