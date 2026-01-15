"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BuscarUsuarios } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

/* =======================
   TIPOS
======================= */

type Usuario = {
  id: number;
  nome: string;
  usuario: string;
  status: number;
};

type PagedResult<T> = {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

type Filtro = {
  nome?: string;
  usuario?: string;
  id?: number | null;
  status?: number | null;
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
};

/* =======================
   ENUM (MAPEAMENTO)
======================= */

const StatusUsuarioMap: Record<number, string> = {
  1: "Ativo",
  2: "Desligado",
  3: "Afastado",
};

/* =======================
   API
======================= */

async function buscarUsuarios(
  filtro: Filtro
): Promise<PagedResult<Usuario>> {
  const params = new URLSearchParams();

  if (filtro.nome) params.append("nome", filtro.nome);
  if (filtro.usuario) params.append("usuario", filtro.usuario);
  if (filtro.status) params.append("status", filtro.status.toString());

  params.append("page", filtro.page.toString());
  params.append("pageSize", filtro.pageSize.toString());

  if (filtro.orderBy) params.append("orderBy", filtro.orderBy);
  if (filtro.orderDirection)
    params.append("orderDirection", filtro.orderDirection);

  return await BuscarUsuarios(params.toString());
}

/* =======================
   COMPONENTE
======================= */

export default function ListaUsuarios() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState<Filtro>({
    page: 1,
    pageSize: 10,
    orderBy: "nome",
    orderDirection: "asc",
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, [filtro]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await buscarUsuarios(filtro);
      setUsuarios(data.items);
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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
          Usuários
        </h1>

        {/* FILTROS */}
        <div className="grid grid-cols-4 gap-3">

          <input
            name="nome"
            type="text"
            placeholder="Filtrar por Nome"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            onChange={handleFiltroChange}
          />

          <input
            name="usuario"
            type="text"
            placeholder="Filtrar por Usuário"
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            onChange={handleFiltroChange}
          />

          <select
            className="p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            onChange={(e) =>
              setFiltro((prev) => ({
                ...prev,
                status: e.target.value
                  ? Number(e.target.value)
                  : undefined,
                page: 1,
              }))
            }
          >
            <option value="">Todos os status</option>
            <option value="1">Ativo</option>
            <option value="2">Desligado</option>
            <option value="3">Afastado</option>
          </select>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-foreground">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                {["nome", "usuario", "status"].map((campo) => (
                  <th
                    key={campo}
                    onClick={() => handleOrdenacao(campo)}
                    className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-primary"
                  >
                    <div className="flex items-center gap-1">
                      {campo === "status"
                        ? "Status"
                        : campo.charAt(0).toUpperCase() +
                          campo.slice(1)}
                      <ArrowUpDown
                        size={14}
                        className={
                          filtro.orderBy === campo
                            ? "text-primary"
                            : ""
                        }
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
              ) : usuarios.length > 0 ? (
                usuarios.map((u) => (
                  <tr
                    key={u.id}
                    onDoubleClick={() => {
                      if (!isAdmin) {
                        toast.error(
                          "Apenas administradores podem editar usuários."
                        );
                        return;
                      }
                      router.push(`/vendedor/editar/${u.id}`);
                    }}
                    className={`border-t border-border hover:bg-muted/40 ${
                      isAdmin ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                  >
                    <td className="px-4 py-2">{u.nome}</td>
                    <td className="px-4 py-2">{u.usuario}</td>
                    <td className="px-4 py-2">
                      {StatusUsuarioMap[u.status] ??
                        "Desconhecido"}
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

        {/* PAGINAÇÃO */}
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
                setFiltro((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
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
