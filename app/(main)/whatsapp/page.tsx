"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWhatsLogin } from "@/services/whatsapp";
import { WhatsLogin } from "./WhatsLogin";
import Home from "./Whatsapp";

type Status = "loading" | "waiting" | "qr" | "connected" | "error";

export default function WhatsPage() {
  const { user } = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.UserId) return;

    let interval: NodeJS.Timeout;

    async function poll() {
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
      } catch {
        setStatus("error");
      }
    }

    poll(); // primeira chamada imediata
    interval = setInterval(poll, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // 🟢 Whats conectado
  if (status === "connected") {
    return <Home />;
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
        />
      </div>
    </div>
  );
}
