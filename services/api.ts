import { toast } from "sonner";

class ApiFetchError extends Error {
  handled: boolean;

  constructor(message: string) {
    super(message);
    this.name = "ApiFetchError";
    this.handled = true;
  }
}

type ApiErrorPayload = {
  title?: string;
  detail?: string;
  message?: string;
};

function getErrorDetails(errorData: ApiErrorPayload | null) {
  const title =
    errorData?.title?.trim() ||
    errorData?.message?.trim() ||
    "Erro na requisição";
  const detail = errorData?.detail?.trim();

  return { title, detail };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("URL do servidor não definida");

  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      window.location.href = "/auth";
      return; // garante que nada mais execute
    }

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      let errorData: ApiErrorPayload | null = null;

      if (contentType.includes("application/json")) {
        errorData = await response.json().catch(() => null);
      } else {
        const errorText = await response.text().catch(() => "");
        errorData = errorText ? { message: errorText } : null;
      }

      const { title, detail } = getErrorDetails(errorData);
      toast.error(title, {
        description: detail ?? "Tente novamente mais tarde.",
      });
      throw new ApiFetchError(detail ?? title);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiFetchError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado na requisição.";
    console.error("Erro na apiFetch:", error);
    toast.error("Erro ao conectar com o servidor.", {
      description: message,
    });
    throw new Error(message);
  }
}
