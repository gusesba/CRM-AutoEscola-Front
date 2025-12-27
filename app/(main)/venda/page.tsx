"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { BuscarVendas } from "@/services/vendaService";
import { useRouter } from "next/navigation";

/* ======================================================
   MODELOS (alinhados ao backend)
====================================================== */

type Sede = {
  id: number;
  nome: string;
};

type Usuario = {
  id: number;
  nome: string;
  usuario: string;
  isAdmin: boolean;
};

type Servico = {
  id: number;
  nome: string;
};

type CondicaoVenda = {
  id: number;
  nome: string;
};

type Venda = {
  id: number;

  sedeId: number;
  sede: Sede;

  dataInicial: string;
  dataAlteracao: string;

  vendedorId: number;
  vendedor: Usuario;

  cliente: string;

  genero: number;
  origem: number;

  email?: string;
  fone?: string;
  celular?: string;
  contato?: string;

  comoConheceu?: string;
  motivoEscolha?: string;

  servicoId: number;
  servico: Servico;

  obs?: string;

  condicaoVendaId: number;
  condicaoVenda: CondicaoVenda;

  status: number;
  valorVenda: number;
  indicacao?: string;
};

const StatusVendaMap: Record<number, string> = {
  1: "Agendar contato",
  2: "Venda efetivada",
  3: "Stand by",
  4: "Optou pela concorrência",
  5: "Não enviar mais",
};

type PagedResult<T> = {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

type FiltroVenda = {
  cliente?: string;
  vendedor?: string;
  contato?: string;
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
};

/* ======================================================
   API
====================================================== */
const statusRowClass = (status: number) => {
  switch (status) {
    case 2: // Venda efetivada
      return "bg-green-100 hover:bg-green-200";
    case 1: // Agendar contato
      return "bg-yellow-100 hover:bg-yellow-200";
    case 4: // Optou pela concorrência
    case 5: // Não enviar mais
      return "bg-red-100 hover:bg-red-200";
    case 3: // Stand by
    default:
      return "hover:bg-muted/40";
  }
};

const formatarContato = (valor?: string) => {
  if (!valor) return "";

  // remove tudo que não for número
  const numeros = valor.replace(/\D/g, "");

  // celular com DDD (11 dígitos) → (41) 99999-9999
  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  // telefone fixo com DDD (10 dígitos) → (41) 3333-3333
  if (numeros.length === 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  // fallback (caso venha incompleto)
  return valor;
};

async function buscarVendas(filtro: FiltroVenda): Promise<PagedResult<Venda>> {
  const params = new URLSearchParams();

  if (filtro.cliente) params.append("cliente", filtro.cliente);
  if (filtro.vendedor) params.append("vendedor", filtro.vendedor);
  if (filtro.contato) params.append("contato", filtro.contato);

  params.append("page", filtro.page.toString());
  params.append("pageSize", filtro.pageSize.toString());

  if (filtro.orderBy) params.append("orderBy", filtro.orderBy);
  if (filtro.orderDirection)
    params.append("orderDirection", filtro.orderDirection);

  return await BuscarVendas(params.toString());
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function ListaVendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtro, setFiltro] = useState<FiltroVenda>({
    page: 1,
    pageSize: 10,
    orderBy: "id",
    orderDirection: "desc",
  });

  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    carregarVendas();
  }, [filtro]);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      const data = await buscarVendas(filtro);
      setVendas(data.items);
      setTotalPaginas(data.totalPages);
      setTotalRegistros(data.totalCount);
    } catch (error) {
      console.error("Erro ao buscar vendas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrdenacao = (campo: string) => {
    setFiltro((prev) => ({
      ...prev,
      orderBy: campo,
      orderDirection:
        prev.orderBy === campo && prev.orderDirection === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFiltro((prev) => ({
      ...prev,
      [name]: value || undefined,
      page: 1,
    }));
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <div className="w-full max-w-7xl bg-card border border-border rounded-xl shadow-md p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Vendas</h1>

        {/* ================= FILTROS ================= */}
        <div className="grid grid-cols-3 gap-3">
          <input
            name="cliente"
            placeholder="Nome do cliente"
            className="p-2 border rounded-lg bg-background text-sm"
            onChange={handleFiltroChange}
          />
          <input
            name="vendedor"
            placeholder="Vendedor"
            className="p-2 border rounded-lg bg-background text-sm"
            onChange={handleFiltroChange}
          />
          <input
            name="contato"
            placeholder="Contato"
            className="p-2 border rounded-lg bg-background text-sm"
            onChange={handleFiltroChange}
          />
        </div>

        {/* ================= TABELA ================= */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                {[
                  { key: "cliente", label: "Cliente" },
                  { key: "contato", label: "Contato" },
                  { key: "dataInicial", label: "Data Inicial" },
                  { key: "sede", label: "Sede" },
                  { key: "vendedor", label: "Vendedor" },
                  { key: "servico", label: "Serviço" },
                  { key: "condicaoVenda", label: "Condição" },
                  { key: "valorVenda", label: "Valor" },
                  { key: "status", label: "Status" },
                ].map((c) => (
                  <th
                    key={c.key}
                    onClick={() => handleOrdenacao(c.key)}
                    className="px-4 py-3 text-left cursor-pointer hover:text-primary"
                  >
                    <div className="flex items-center gap-1">
                      {c.label}
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    Carregando...
                  </td>
                </tr>
              ) : vendas.length > 0 ? (
                vendas.map((v) => (
                  <tr
                    key={v.id}
                    className={`border-t transition cursor-pointer ${statusRowClass(v.status)}`}
                    onDoubleClick={() => router.push(`/venda/editar/${v.id}`)}
                  >
                    <td className="px-4 py-2">{v.cliente}</td>
                    <td className="px-4 py-2">{formatarContato(v.contato)}</td>
                    <td className="px-4 py-2">
                      {new Date(v.dataInicial).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2">{v.sede?.nome}</td>
                    <td className="px-4 py-2">{v.vendedor?.nome}</td>
                    <td className="px-4 py-2">{v.servico?.nome}</td>
                    <td className="px-4 py-2">{v.condicaoVenda?.nome}</td>
                    <td className="px-4 py-2">{v.valorVenda && `R$ ${v.valorVenda.toFixed(2)}`}</td>
                    <td className="px-4 py-2">
                      {StatusVendaMap[v.status] ?? "Desconhecido"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    Nenhuma venda encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINAÇÃO ================= */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">
            Total: {totalRegistros} registros
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={filtro.page <= 1}
              onClick={() =>
                setFiltro((prev) => ({
                  ...prev,
                  page: prev.page - 1,
                }))
              }
              className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm">
              Página {filtro.page} de {totalPaginas}
            </span>

            <button
              disabled={filtro.page >= totalPaginas}
              onClick={() =>
                setFiltro((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
              className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
