import { apiFetch } from "./api";

interface ICriarServicoDto {
  nome: string;
}

export const CriarServico = async (data: ICriarServicoDto) => {
  try {
    await apiFetch("/servico", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao criar serviço.");
  }
};

export const BuscarServicos = async (parametros: string) => {
  try {
    return await apiFetch(`/servico?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar serviços.");
  }
};
