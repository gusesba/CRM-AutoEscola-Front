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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro na requisição.");
    }

    return response.json();
  } catch (error) {
    console.error("Erro na apiFetch:", error);
    throw error instanceof Error
      ? error
      : new Error("Erro inesperado na requisição.");
  }
}
