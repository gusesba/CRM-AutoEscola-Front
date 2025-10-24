"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { BuscarSedes } from "@/services/auth/sedeService";

type Sede = {
  id: number;
  nome: string;
  ativo: boolean;
  dataInclusao: string; // formato ISO vindo do backend
};

type PagedResult<T> = {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

type Filtro = {
  id?: number | null;
  nome?: string;
  ativo?: boolean | null;
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
};

// Função para buscar os dados da API
async function buscarSedes(filtro: Filtro): Promise<PagedResult<Sede>> {
  const params = new URLSearchParams();

  if (filtro.nome) params.append("nome", filtro.nome);
  if (filtro.id) params.append("id", filtro.id.toString());
  if (filtro.ativo !== null && filtro.ativo !== undefined)
    params.append("ativo", filtro.ativo.toString());

  params.append("page", filtro.page.toString());
  params.append("pageSize", filtro.pageSize.toString());
  if (filtro.orderBy) params.append("orderBy", filtro.orderBy);
  if (filtro.orderDirection)
    params.append("orderDirection", filtro.orderDirection);

  return await BuscarSedes(params.toString());
}

export default function ListaSedes() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [filtro, setFiltro] = useState<Filtro>({
    page: 1,
    pageSize: 10,
    orderBy: "id",
    orderDirection: "asc",
    ativo: null,
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarSedes();
  }, [filtro]);

  const carregarSedes = async () => {
    try {
      setLoading(true);
      const data = await buscarSedes(filtro);
      setSedes(data.items);
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
      orderDirection:
        prev.orderBy === campo && prev.orderDirection === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleFiltroChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFiltro((prev) => ({
      ...prev,
      [name]:
        value === "" ? undefined : name === "ativo" ? value === "true" : value,
      page: 1,
    }));
  };

  const colunas = [
    { campo: "id", label: "ID" },
    { campo: "nome", label: "Nome" },
    { campo: "ativo", label: "Ativo" },
    { campo: "dataInclusao", label: "Data de Inclusão" },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <div className="w-full max-w-5xl bg-card border border-border rounded-xl shadow-right p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground text-center">
          Sedes
        </h1>

        {/* Filtros */}
        <div className="grid grid-cols-3 gap-3">
          <input
            name="id"
            type="number"
            placeholder="Filtrar por ID"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
            onChange={handleFiltroChange}
          />
          <input
            name="nome"
            type="text"
            placeholder="Filtrar por Nome"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
            onChange={handleFiltroChange}
          />
          <select
            name="ativo"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
            onChange={handleFiltroChange}
          >
            <option value="">Filtrar por Status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-foreground">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                {colunas.map(({ campo, label }) => (
                  <th
                    key={campo}
                    onClick={() => handleOrdenacao(campo)}
                    className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-primary transition"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <ArrowUpDown
                        size={14}
                        className={`transition ${
                          filtro.orderBy === campo ? "text-primary" : ""
                        }`}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : sedes.length > 0 ? (
                sedes.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-border hover:bg-muted/40 transition"
                  >
                    <td className="px-4 py-2">{s.id}</td>
                    <td className="px-4 py-2">{s.nome}</td>
                    <td className="px-4 py-2">
                      {s.ativo ? "Ativo" : "Inativo"}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(s.dataInclusao).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhum resultado encontrado
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
