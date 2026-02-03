"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWhatsLogin, removeWhatsSession } from "@/services/whatsapp";
import { WhatsLogin } from "./WhatsLogin";
import Home from "./Whatsapp";
import { toast } from "sonner";

type Status = "loading" | "waiting" | "qr" | "connected" | "error";

export default function WhatsPage() {
  const { user } = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pollToken, setPollToken] = useState(0);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    console.log(user);
    if (!user?.UserId) return;

    let interval: NodeJS.Timeout;

    async function poll() {
      console.log("Polling WhatsApp login status...");
      try {
        const res = await getWhatsLogin(String(user?.UserId));

        if (res.status === "connected") {
          setStatus("connected");
          setQrCode(null);
          clearInterval(interval);
        }

        if (res.status === "qr") {
          setStatus("qr");
          setQrCode(res.qrCode);
        }

        if (res.status === "waiting") {
          setStatus("waiting");
        }
      } catch (err) {
        console.error("Erro ao verificar status do WhatsApp:", err);
        setStatus("error");
      }
    }

    poll(); // primeira chamada imediata
    interval = setInterval(poll, 5000);

    return () => clearInterval(interval);
  }, [user, pollToken]);

  const handleDisconnect = useCallback(async () => {
    if (!user?.UserId || disconnecting) return;

    try {
      setDisconnecting(true);
      await removeWhatsSession(String(user.UserId));
      toast.success("Sessão do WhatsApp removida com sucesso.");
      setStatus("waiting");
      setQrCode(null);
      setPollToken((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover a sessão do WhatsApp.");
    } finally {
      setDisconnecting(false);
    }
  }, [disconnecting, user?.UserId]);

  // 🟢 Whats conectado
  if (status === "connected") {
    return (
      <Home onDisconnect={handleDisconnect} disconnecting={disconnecting} />
    );
  }

  // 🔴 Login
  return (
    <div className="flex-1 bg-[#f0f2f5]">
      <div
        className="
          mx-auto
          h-[calc(100vh-7rem)]
          max-w-[1400px]
          bg-white
          rounded-xl
          shadow-md
          flex
        "
      >
        <WhatsLogin
          qrCode={qrCode ?? undefined}
          status={status === "qr" ? "qr" : "waiting"}
          onDisconnect={handleDisconnect}
          disconnecting={disconnecting}
        />
      </div>
    </div>
  );
}
