import { IVendaServicoDto } from "@/services/vendaService";

export type Chat = {
  id: string;
  name: string;
  isGroup: boolean;
  nmr?: string | null;
  archived?: boolean;
  unreadCount: number;
  profilePicUrl?: string | null;
  lastMessage?: {
    body: string;
    timestamp: number;
  } | null;
};

export enum WhatsStatusEnum {
  Criado = 1,
  NaoEncontrado = 2,
  NaoCriado = 3,
}

export type ChatStatusDto = {
  status: WhatsStatusEnum;
  venda: IVendaServicoDto | null;
};
