export type Message = {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: "chat" | "image" | "video" | "audio" | "sticker" | "document";
  hasMedia: boolean;
  author?: string | null;

  mediaUrl?: string;
  mimetype?: string;
  filename?: string;
};
