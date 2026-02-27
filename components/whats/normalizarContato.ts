import type { Chat } from "@/types/chat";

type ContatoEntrada =
  | (Pick<Chat, "id" | "name" | "isGroup"> & { nmr?: string | null })
  | null
  | undefined;

export function normalizarContato(chat: ContatoEntrada) {
  if (!chat || chat?.isGroup) return null;

  const id = chat?.id ?? "";
  const name = chat?.name ?? "";

  // 1) ID padrão de telefone: 55...@c.us
  if (id.endsWith("@c.us")) {
    const somenteDigitos = id.replace(/\D/g, ""); // remove @c.us etc
    return somenteDigitos.replace(/^(00)?55/, ""); // tira 55 (e 0055)
  }

  if (id.endsWith("@lid") && chat?.nmr) {
    return chat?.nmr.replace(/\D/g, "").replace(/^(00)?55/, "");
  }

  // 2) Se for @lid (ou outro), tenta pegar do "name" caso seja telefone
  const nameDigitos = name.replace(/\D/g, "");
  // Heurística simples BR: com DDD fica 10 ou 11 dígitos (sem +55)
  // Se vier com 55 na frente, remove.
  const semPais = nameDigitos.replace(/^(00)?55/, "");
  if (semPais.length === 10 || semPais.length === 11) {
    return semPais;
  }

  // 3) Não consegui inferir número
  return null;
}
