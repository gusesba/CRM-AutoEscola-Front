"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Save } from "lucide-react";
import { BuscarUsuarios } from "@/services/authService";
import { BuscarVendas, TransferirVendas } from "@/services/vendaService";
import { toast } from "sonner";

/* =======================
   TIPOS
======================= */

type Vendedor = {
  id: number;
  nome: string;
};

type Venda = {
  id: number;
  cliente: string;
  contato: string;
};

const formatarContato = (valor?: string) => {
  if (!valor) return "";

  // remove tudo que não for número
  const numeros = valor.replace(/\D/g, "");

  // celular com DDD (11 dígitos) → (41) 99999-9999
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  // telefone fixo com DDD (10 dígitos) → (41) 3333-3333
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  // fallback (caso venha incompleto)
  return valor;
};

/* =======================
   PLACEHOLDERS
======================= */

/* =======================
   COMPONENTE
======================= */

export default function TransferirVendasPage() {
  const [vendedorOrigem, setVendedorOrigem] = useState<number | "">("");
  const [vendedorDestino, setVendedorDestino] = useState<number | "">("");
  const [usuarios, setUsuarios] = useState<Vendedor[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [vendasOrigem, setVendasOrigem] = useState<Venda[]>([]);
  const [vendasDestino, setVendasDestino] = useState<Venda[]>([]);

  const [selecionadasOrigem, setSelecionadasOrigem] = useState<number[]>([]);
  const [selecionadasDestino, setSelecionadasDestino] = useState<number[]>([]);

  useEffect(() => {
    const carregarVendedores = async () => {
      setUsuarios((await BuscarUsuarios("pageSize=1000"))?.items || []);
    };
    carregarVendedores();
  }, []);

  const buscarVendas = async () => {
    try {
      // ===============================
      // VENDAS DO VENDEDOR ORIGEM
      // ===============================
      if (vendedorOrigem) {
        const paramsOrigem = new URLSearchParams();
        paramsOrigem.append("VendedorAtualId", vendedorOrigem.toString());
        paramsOrigem.append("Status", "1"); // AgendarContato
        paramsOrigem.append("Status", "3"); // StandBy
        paramsOrigem.append("page", "1");
        paramsOrigem.append("pageSize", "1000");

        const responseOrigem = await BuscarVendas(paramsOrigem.toString());
        setVendasOrigem(responseOrigem?.items || []);
      } else {
        setVendasOrigem([]);
      }

      // ===============================
      // VENDAS DO VENDEDOR DESTINO
      // ===============================
      if (vendedorDestino) {
        const paramsDestino = new URLSearchParams();
        paramsDestino.append("VendedorAtualId", vendedorDestino.toString());
        paramsDestino.append("Status", "1");
        paramsDestino.append("Status", "3");
        paramsDestino.append("page", "1");
        paramsDestino.append("pageSize", "1000");

        const responseDestino = await BuscarVendas(paramsDestino.toString());
        setVendasDestino(responseDestino?.items || []);
      } else {
        setVendasDestino([]);
      }
    } catch (error) {
      console.error("Erro ao buscar vendas", error);
    }
  };

  useEffect(() => {
    buscarVendas();
  }, [vendedorOrigem, vendedorDestino]);

  /* =======================
     AÇÕES VISUAIS
  ======================= */

  const moverParaDestino = () => {
    const selecionadas = vendasOrigem.filter((v) =>
      selecionadasOrigem.includes(v.id)
    );

    setVendasOrigem((prev) =>
      prev.filter((v) => !selecionadasOrigem.includes(v.id))
    );
    setVendasDestino((prev) => [...prev, ...selecionadas]);
    setSelecionadasOrigem([]);
  };

  const moverParaOrigem = () => {
    const selecionadas = vendasDestino.filter((v) =>
      selecionadasDestino.includes(v.id)
    );

    setVendasDestino((prev) =>
      prev.filter((v) => !selecionadasDestino.includes(v.id))
    );
    setVendasOrigem((prev) => [...prev, ...selecionadas]);
    setSelecionadasDestino([]);
  };

  const salvarTransferencia = async () => {
    // limpa mensagens anteriores
    setSuccessMessage(null);
    setSubmitError(null);

    if (!vendedorDestino || vendasDestino.length === 0) {
      toast.error("Selecione o vendedor destino e ao menos uma venda.");
      return;
    }

    try {
      await TransferirVendas(
        vendedorDestino,
        vendasDestino.map((v) => v.id)
      );

      toast.success("Vendas transferidas com sucesso!");

      // 🔄 limpa listas após sucesso
      setVendasOrigem([]);
      setVendasDestino([]);
      setSelecionadasOrigem([]);
      setSelecionadasDestino([]);
      buscarVendas();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao transferir vendas. Tente novamente.");
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <div className="p-6 w-full h-full">
      <div className="max-w-7xl mx-auto bg-card border border-border rounded-xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          Transferência de Leads
        </h1>

        {/* VENDEDORES */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-1">Vendedor Origem</label>
            <select
              className="w-full p-2 border rounded-lg bg-background"
              value={vendedorOrigem}
              onChange={(e) => {
                setVendedorOrigem(Number(e.target.value));
                // 🔌 Placeholder: buscar vendas do vendedor origem
              }}
            >
              <option value="">Selecione</option>
              {usuarios.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Vendedor Destino</label>
            <select
              className="w-full p-2 border rounded-lg bg-background"
              value={vendedorDestino}
              onChange={(e) => {
                setVendedorDestino(Number(e.target.value));
                // 🔌 Placeholder: buscar vendas do vendedor destino
              }}
            >
              <option value="">Selecione</option>
              {usuarios.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABELAS */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* TABELA ORIGEM */}
          <TabelaVendas
            titulo="Vendas do Vendedor Origem"
            vendas={vendasOrigem}
            selecionadas={selecionadasOrigem}
            setSelecionadas={setSelecionadasOrigem}
          />

          {/* SETAS */}
          <div className="flex flex-col gap-2">
            <button
              onClick={moverParaDestino}
              disabled={
                selecionadasOrigem.length === 0 ||
                vendedorDestino == vendedorOrigem ||
                vendedorDestino == "" ||
                vendedorOrigem == ""
              }
              className="p-2 border rounded-lg hover:bg-muted disabled:opacity-50"
            >
              <ArrowRight />
            </button>

            <button
              onClick={moverParaOrigem}
              disabled={
                selecionadasDestino.length === 0 ||
                vendedorDestino == vendedorOrigem ||
                vendedorDestino == "" ||
                vendedorOrigem == ""
              }
              className="p-2 border rounded-lg hover:bg-muted disabled:opacity-50"
            >
              <ArrowLeft />
            </button>
          </div>

          {/* TABELA DESTINO */}
          <TabelaVendas
            titulo="Vendas do Vendedor Destino"
            vendas={vendasDestino}
            selecionadas={selecionadasDestino}
            setSelecionadas={setSelecionadasDestino}
          />
        </div>

        {/* SALVAR */}
        <div className="flex justify-end pt-4">
          <button
            onClick={salvarTransferencia}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <Save size={18} />
            Salvar Transferência
          </button>
        </div>
        {/* MENSAGENS DE FEEDBACK */}
        {successMessage && (
          <p className="text-green-600 text-center font-medium mt-4">
            {successMessage}
          </p>
        )}

        {submitError && (
          <p className="text-error text-center font-medium mt-4">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}

/* =======================
   COMPONENTE TABELA
======================= */

function TabelaVendas({
  titulo,
  vendas,
  selecionadas,
  setSelecionadas,
}: {
  titulo: string;
  vendas: Venda[];
  selecionadas: number[];
  setSelecionadas: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const toggle = (id: number) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted px-4 py-2 font-medium text-sm">{titulo}</div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-3 py-2 text-left w-10"></th>
            <th className="px-3 py-2 text-left">Cliente</th>
            <th className="px-3 py-2 text-left">Contato</th>
          </tr>
        </thead>
        <tbody>
          {vendas.length > 0 ? (
            vendas.map((v) => (
              <tr key={v.id} className="border-t hover:bg-muted/40">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selecionadas.includes(v.id)}
                    onChange={() => toggle(v.id)}
                  />
                </td>
                <td className="px-3 py-2">{v.cliente}</td>
                <td className="px-3 py-2">{formatarContato(v.contato)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={3}
                className="text-center py-6 text-muted-foreground"
              >
                Nenhuma venda
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
