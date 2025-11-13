import { apiFetch } from "./api";
interface ICriarSedeDto {
  nome: string;
}

export const CriarSede = async (data: ICriarSedeDto) => {
  try {
    await apiFetch("/sede", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Erro ao criar sede:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao criar sede.");
  }
};

export const BuscarSedes = async (parametros: string) => {
  try {
    return await apiFetch(`/sede?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar sedes:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar sedes.");
  }
};
