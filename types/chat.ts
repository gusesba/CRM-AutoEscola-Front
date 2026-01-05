export type Chat = {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: {
    body: string;
    timestamp: number;
  } | null;
};
