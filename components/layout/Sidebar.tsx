"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React from "react";

export const Sidebar = () => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  if (loading) {
    return (
      <div className="w-64 fixed top-14 left-0 h-full shadow-right border-r-2 border-gray-200 p-5"></div>
    );
  }
  return (
    <aside
      className="
  w-64
  fixed
  top-14
  left-0
  h-[calc(100vh-3.5rem)]
  shadow-right
  border-r-2
  border-gray-200
  p-5
  overflow-y-auto
  scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent
"
    >
      {/* Atividades */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          Atividades
        </span>
        <ul className="mt-2 space-y-1 text-sm">
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/agendamento/diario")}
          >
            Meus Agendamentos
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/agendamento/diario")}
          >
            Meus Leads
          </li>
          <li className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
            Disparos
          </li>
          {isAdmin && (
            <>
              <li
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </li>
              <li
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/venda/trocar")}
              >
                Transferir Leads
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Cadastros */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          Cadastros
        </span>
        <ul className="mt-2 space-y-1 text-sm">
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/venda/novo")}
          >
            Vendas e Leads
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/agendamento/novo")}
          >
            Agendamentos
          </li>
          {isAdmin && (
            <>
              <li
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/vendedor/novo")}
              >
                Vendedores
              </li>
              <li
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/servico/novo")}
              >
                Serviços
              </li>
              <li
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/sede/novo")}
              >
                Sedes
              </li>
              <li
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/condicaoVenda/novo")}
              >
                Condições de Venda
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Consultar */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          Consultar
        </span>
        <ul className="mt-2 space-y-1 text-sm">
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/venda")}
          >
            Vendas e Leads
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/agendamento")}
          >
            Agendamentos
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/vendedor")}
          >
            Vendedores
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/servico")}
          >
            Serviços
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/sede")}
          >
            Sedes
          </li>
          <li
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/condicaoVenda")}
          >
            Condições de Venda
          </li>
        </ul>
      </div>
      {/* Botão de sair */}
      <div className="mt-auto">
        <button
          onClick={() => {
            // Aqui você pode limpar sessão ou redirecionar
            router.push("/auth");
          }}
          className="w-full text-red-600 font-semibold py-2 rounded-lg hover:bg-red-100 transition"
        >
          Sair
        </button>
      </div>
    </aside>
  );
};
