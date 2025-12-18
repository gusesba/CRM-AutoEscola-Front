"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { BuscarAgendamentos } from "@/services/agendamentoService";

type Agendamento = {
  id: number;
  vendaId: number;
  venda: {
    id: number;
    cliente: string;
  };
  dataAgendamento: string;
  obs: string;
};

type PagedResult<T> = {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

type Filtro = {
  vendaId?: number;
  cliente?: string;
  dataAgendamentoDe?: string;
  dataAgendamentoAte?: string;
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
};

async function buscarAgendamentos(filtro: Filtro): Promise<PagedResult<Agendamento>> {
  const params = new URLSearchParams();
  if (filtro.vendaId) params.append("vendaId", filtro.vendaId.toString());
  if (filtro.cliente) params.append("cliente", filtro.cliente);
  if (filtro.dataAgendamentoDe) params.append("dataAgendamentoDe", filtro.dataAgendamentoDe);
  if (filtro.dataAgendamentoAte) params.append("dataAgendamentoAte", filtro.dataAgendamentoAte);
  params.append("page", filtro.page.toString());
  params.append("pageSize", filtro.pageSize.toString());
  if (filtro.orderBy) params.append("orderBy", filtro.orderBy);
  if (filtro.orderDirection) params.append("orderDirection", filtro.orderDirection);

  return await BuscarAgendamentos(params.toString());
}

export default function AgendamentosDiarios() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [filtro, setFiltro] = useState<Filtro>({
    page: 1,
    pageSize: 10,
    orderBy: "dataAgendamento",
    orderDirection: "asc",
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);

  // Define a data de hoje no formato YYYY-MM-DD (horário de Brasília)
  useEffect(() => {
    const now = new Date();
    const brasiliaDate = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const [day, month, year] = brasiliaDate.split("/");
    const todayStart = `${year}-${month}-${day}T00:00:00`;
    const todayEnd = `${year}-${month}-${day}T23:59:59`;

    setFiltro((prev) => ({
      ...prev,
      dataAgendamentoDe: todayStart,
      dataAgendamentoAte: todayEnd,
    }));
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [filtro]);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const data = await buscarAgendamentos(filtro);
      setAgendamentos(data.items);
      setTotalPaginas(data.totalPages);
      setTotalRegistros(data.totalCount);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrdenacao = (campo: string) => {
    setFiltro((prev) => ({
      ...prev,
      orderBy: campo,
      orderDirection: prev.orderBy === campo && prev.orderDirection === "asc" ? "desc" : "asc",
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
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <div className="w-full max-w-6xl bg-card border border-border rounded-xl shadow-right p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground text-center">
          Agendamentos de Hoje
        </h1>

        {/* Filtros adicionais */}
        <div className="grid grid-cols-3 gap-3">
          <input
            name="vendaId"
            type="number"
            placeholder="Filtrar por ID da Venda"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
            onChange={handleFiltroChange}
          />
          <input
            name="cliente"
            type="text"
            placeholder="Filtrar por Cliente"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
            onChange={handleFiltroChange}
          />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-foreground">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                {["id", "vendaId", "cliente", "dataAgendamento", "obs"].map(
                  (campo) => (
                    <th
                      key={campo}
                      onClick={() => handleOrdenacao(campo)}
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-primary transition"
                    >
                      <div className="flex items-center gap-1">
                        {campo.charAt(0).toUpperCase() + campo.slice(1)}
                        <ArrowUpDown
                          size={14}
                          className={`transition ${
                            filtro.orderBy === campo ? "text-primary" : ""
                          }`}
                        />
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : agendamentos.length > 0 ? (
                agendamentos.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-border hover:bg-muted/40 transition"
                  >
                    <td className="px-4 py-2">{a.id}</td>
                    <td className="px-4 py-2">{a.vendaId}</td>
                    <td className="px-4 py-2">{a.venda?.cliente}</td>
                    <td className="px-4 py-2">
                      {new Date(new Date(a.dataAgendamento).getTime() + 3 * 60 * 60 * 1000).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{a.obs}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhum agendamento para hoje
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">
            Total: {totalRegistros} registros
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={filtro.page <= 1}
              onClick={() =>
                setFiltro((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm">
              Página {filtro.page} de {totalPaginas}
            </span>
            <button
              disabled={filtro.page >= totalPaginas}
              onClick={() =>
                setFiltro((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
