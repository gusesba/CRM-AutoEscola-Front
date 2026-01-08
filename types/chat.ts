export type Chat = {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  profilePicUrl?: string | null;
  lastMessage?: {
    body: string;
    timestamp: number;
  } | null;
};
