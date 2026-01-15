import { useEffect } from "react";
import { socket } from "@/services/socket";

export function useWhatsSocket(userId: string, onMessage: (data: any) => void) {
  useEffect(() => {
    if (!userId) {
      return;
    }
    socket.connect();
    socket.emit("join", userId);

    socket.on("message", onMessage);

    return () => {
      socket.off("message", onMessage);
      socket.disconnect();
    };
  }, [userId]);
}
