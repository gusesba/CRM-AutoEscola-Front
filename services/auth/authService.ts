import { apiFetch } from "../api";

interface ILoginDto {
  usuario: string;
  senha: string;
}

interface ICriarVendedorDto {
  nome: string;
  usuario: string;
  senha: string;
  isAdmin: boolean;
}

export const Login = async (data: ILoginDto) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) throw new Error("URL do servidor não definida");

    const response = await fetch(`${baseUrl}/usuario/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // tenta extrair uma mensagem mais específica do backend
      const errorData = await response.json().catch(() => null);
      const message =
        errorData?.message ||
        "Falha ao fazer login. Verifique suas credenciais.";
      throw new Error(message);
    }

    const result = await response.json();

    if (!result?.token) {
      throw new Error("Falha ao autenticar. Token não recebido.");
    }

    // Armazena o token localmente
    localStorage.setItem("token", result.token);
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao fazer login.");
  }
};

export const CriarVendedor = async (data: ICriarVendedorDto) => {
  try {
    await apiFetch("/usuario/registrar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Erro ao criar vendedor:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao criar vendedor.");
  }
};

export const BuscarUsuarios = async (parametros: string) => {
  try {
    return await apiFetch(`/usuario?${parametros}`, {
      method: "GET",
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao buscar usuários.");
  }
};
