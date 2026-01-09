type Props = {
  qrCode?: string;
  status: "waiting" | "qr";
};

export function WhatsLogin({ qrCode, status }: Props) {
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
          </div>
        )}
      </div>
    </div>
  );
}
