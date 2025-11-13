import { apiFetch } from "./api";

interface ICriarCondicaoVendaDto {
  nome: string;
}

export const CriarCondicaoVenda = async (data: ICriarCondicaoVendaDto) => {
  try {
    await apiFetch("/condicaoVenda", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Erro ao criar condição venda:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao criar condição venda.");
  }
};

export const BuscarCondicaoVendas = async (parametros: string) => {
  try {
    return await apiFetch(`/condicaoVenda?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar condição vendas:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar condição vendas.");
  }
};
