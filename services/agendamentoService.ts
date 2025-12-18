import { apiFetch } from "./api";

interface ICriarAgendamentoDto {
  vendaId: number;
  dataAgendamento: string;
  obs?: string;
}

export const CriarAgendamento = async (data: ICriarAgendamentoDto) => {
  try {
    await apiFetch("/agendamento", {
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

export const BuscarAgendamentos = async (parametros: string) => {
  try {
    return await apiFetch(`/agendamento?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar serviços.");
  }
};
