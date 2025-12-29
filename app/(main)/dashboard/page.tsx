"use client";

import { useEffect, useState } from "react";
import {
    Users,
    CheckCircle,
    XCircle,
    BarChart3,
} from "lucide-react";
import { BuscarSedes } from "@/services/sedeService";
import { BuscarUsuarios } from "@/services/authService";
import { BuscarServicos } from "@/services/servicoService";
import { BuscarDashboard } from "@/services/vendaService";

/* =====================
   TIPOS (PLACEHOLDER)
===================== */

type FiltroOption = {
    id: number;
    nome: string;
};

type DashboardResumo = {
    totalLeads: number;
    totalMatriculas: number;
    leadsAbertos: number;
    leadsSemSucesso: number;
};

type ComparativoVendedor = {
    id: number;
    nome: string;
    leads: number;
    matriculas: number;
};

const getMesAnterior = () => {
    const hoje = new Date();

    const primeiroDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 1,
        1
    );

    const ultimoDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        0
    );

    return {
        inicio: primeiroDia.toISOString().split("T")[0],
        fim: ultimoDia.toISOString().split("T")[0],
    };
};


/* =====================
   COMPONENTE
===================== */

export default function DashboardPage() {
    /* ===== FILTROS ===== */
    const mesAnterior = getMesAnterior();
    const [sede, setSede] = useState<number | "">("");
    const [sedes, setSedes] = useState<FiltroOption[]>([]);
    const [vendedor, setVendedor] = useState<number | "">("");
    const [vendedores, setVendedores] = useState<FiltroOption[]>([]);
    const [servico, setServico] = useState<number | "">("");
    const [servicos, setServicos] = useState<FiltroOption[]>([]);
    const [dataInicio, setDataInicio] = useState<string>(mesAnterior.inicio);
    const [dataFim, setDataFim] = useState<string>(mesAnterior.fim);
    const [resumo, setResumo] = useState<DashboardResumo | null>(null);
    const [comparativo, setComparativo] = useState<ComparativoVendedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);


    useEffect(() => {
        const carregarListas = async () => {
            const [sedesRes, vendRes, servRes] = await Promise.all([
                BuscarSedes("pageSize=1000"),
                BuscarUsuarios("pageSize=1000"),
                BuscarServicos("pageSize=1000"),
            ]);

            setSedes(sedesRes?.items || []);
            setVendedores(vendRes?.items || []);
            setServicos(servRes?.items || []);
        };

        carregarListas();
    }, []);

    useEffect(() => {
  const buscarDashboard = async () => {
    if (!dataInicio || !dataFim) return;

    try {
      setLoading(true);
      setErro(null);

      const params = new URLSearchParams();

      params.append("DataInicial", dataInicio);
      params.append("DataFinal", dataFim);

      if (sede) params.append("SedeId", sede.toString());
      if (servico) params.append("ServicoId", servico.toString());

      // ⚠️ vendedor afeta SOMENTE os cards
      if (vendedor) params.append("VendedorId", vendedor.toString());

      const response = await BuscarDashboard(params.toString());

      setResumo({
        totalLeads: response.totalLeads,
        totalMatriculas: response.totalMatriculas,
        leadsAbertos: response.leadsAbertos,
        leadsSemSucesso: response.leadsSemSucesso,
      });

      setComparativo(
        response.comparativoVendedores.map((v: any) => ({
          id: v.vendedorId,
          nome: v.vendedorNome,
          leads: v.totalLeads,
          matriculas: v.totalMatriculas,
        }))
      );
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar dados do dashboard.");
    } finally {
      setLoading(false);
    }
  };

  buscarDashboard();
}, [sede, vendedor, servico, dataInicio, dataFim]);


    /* =====================
       UI
    ===================== */

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <BarChart3 />
                Dashboard de Leads e Vendas
            </h1>

            {/* =====================
          FILTROS
      ===================== */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-card p-4 rounded-xl border">
                <Select
                    label="Sede"
                    value={sede}
                    onChange={setSede}
                    options={sedes}
                />
                <Select
                    label="Vendedor"
                    value={vendedor}
                    onChange={setVendedor}
                    options={vendedores}
                />
                <Select
                    label="Serviço"
                    value={servico}
                    onChange={setServico}
                    options={servicos}
                />

                <div>
                    <label className="text-sm">Data início</label>
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-background"
                        required
                    />
                </div>

                <div>
                    <label className="text-sm">Data fim</label>
                    <input
                        type="date"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-background"
                        required
                    />
                </div>
            </div>

            {/* =====================
          CARDS
      ===================== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DashboardCard
                    titulo="Total de Leads"
                    valor={resumo?.totalLeads ?? 0}
                    icon={<Users />}
                />
                <DashboardCard
                    titulo="Matrículas Efetuadas"
                    valor={resumo?.totalLeads ?? 0}
                    icon={<CheckCircle />}
                    destaque
                />
                <DashboardCard
                    titulo="Leads Abertos"
                    valor={resumo?.totalLeads ?? 0}
                    icon={<Users />}
                />
                <DashboardCard
                    titulo="Leads Sem Sucesso"
                    valor={resumo?.totalLeads ?? 0}
                    icon={<XCircle />}
                    danger
                />
            </div>

            {/* =====================
          COMPARATIVO
      ===================== */}
            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-4 py-3 font-medium">
                    Comparativo entre Vendedores
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-2 text-left">Vendedor</th>
                            <th className="px-4 py-2 text-right">Leads</th>
                            <th className="px-4 py-2 text-right">Matrículas</th>
                            <th className="px-4 py-2 text-right">Conversão</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comparativo.map(v => {
                            const conversao =
                                v.leads > 0
                                    ? ((v.matriculas / v.leads) * 100).toFixed(1)
                                    : "0";

                            return (
                                <tr key={v.id} className="border-t">
                                    <td className="px-4 py-2">{v.nome}</td>
                                    <td className="px-4 py-2 text-right">{v.leads}</td>
                                    <td className="px-4 py-2 text-right">{v.matriculas}</td>
                                    <td className="px-4 py-2 text-right">
                                        {conversao}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =====================
   COMPONENTES AUX
===================== */

function DashboardCard({
    titulo,
    valor,
    icon,
    destaque,
    danger,
}: {
    titulo: string;
    valor: number;
    icon: React.ReactNode;
    destaque?: boolean;
    danger?: boolean;
}) {
    return (
        <div
            className={`p-4 rounded-xl border flex items-center justify-between
      ${destaque ? "border-primary" : ""}
      ${danger ? "border-red-500" : ""}
    `}
        >
            <div>
                <p className="text-sm text-muted-foreground">{titulo}</p>
                <p className="text-2xl font-semibold">{valor}</p>
            </div>
            <div className="text-muted-foreground">{icon}</div>
        </div>
    );
}

function Select({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: number | "";
    onChange: (v: number | "") => void;
    options: FiltroOption[];
}) {
    return (
        <div>
            <label className="text-sm">{label}</label>
            <select
                value={value}
                onChange={e =>
                    onChange(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full p-2 border rounded-lg bg-background"
            >
                <option value="">Todos</option>
                {options.map(o => (
                    <option key={o.id} value={o.id}>
                        {o.nome}
                    </option>
                ))}
            </select>
        </div>
    );
}
