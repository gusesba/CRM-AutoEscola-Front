type Props = {
  qrCode?: string;
  status: "waiting" | "qr";
  onDisconnect?: () => void;
  disconnecting?: boolean;
};

export function WhatsLogin({
  qrCode,
  status,
  onDisconnect,
  disconnecting,
}: Props) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
      <div
        className="
          bg-white
          rounded-xl
          shadow-md
          p-8
          flex
          flex-col
          items-center
          gap-6
          w-[360px]
        "
      >
        <h1 className="text-xl font-semibold text-gray-800">
          Conectar ao WhatsApp
        </h1>

        {status === "qr" && qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
            <p className="text-sm text-gray-500 text-center">
              Abra o WhatsApp no seu celular e escaneie o QR Code
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
              <span className="text-gray-400">Gerando QR Code…</span>
            </div>
            <p className="text-sm text-gray-500">Aguardando autenticação…</p>
            {onDisconnect ? (
              <button
                type="button"
                onClick={onDisconnect}
                disabled={disconnecting}
                className="rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {disconnecting ? "Removendo sessão..." : "Remover sessão"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
