"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  adicionarConversaAoGrupo,
  buscarGruposWhatsapp,
  buscarVinculosWhatsapp,
  criarGrupoWhatsapp,
  excluirGrupoWhatsapp,
  removerConversaGrupoWhatsapp,
  GrupoWhatsapp,
  GrupoWhatsappConversa,
  VendaWhatsappVinculo,
} from "@/services/whatsappGroupService";
import { ChevronRight } from "lucide-react";
import { StatusEnum } from "@/enums";

const formatarConversa = (conversa: GrupoWhatsappConversa) => {
  return conversa.venda?.cliente ?? "Cliente nao informado";
};

export default function GruposWhatsappPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoWhatsapp[]>([]);
  const [filtroId, setFiltroId] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState<number | "">("");
  const [dataInicialDe, setDataInicialDe] = useState("");
  const [dataInicialAte, setDataInicialAte] = useState("");
  const [criandoGrupo, setCriandoGrupo] = useState(false);

  const [grupoSelecionado, setGrupoSelecionado] = useState<number | "">("");
  const [vendaWhatsappId, setVendaWhatsappId] = useState("");
  const [pesquisaVinculo, setPesquisaVinculo] = useState("");
  const [vinculos, setVinculos] = useState<VendaWhatsappVinculo[]>([]);
  const [carregandoVinculos, setCarregandoVinculos] = useState(false);
  const [erroVinculos, setErroVinculos] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [excluindoGrupoId, setExcluindoGrupoId] = useState<number | null>(null);
  const [removendoConversaKey, setRemovendoConversaKey] = useState<
    string | null
  >(null);
  const [confirmacaoAberta, setConfirmacaoAberta] = useState<{
    tipo: "excluir-grupo" | "remover-conversa";
    grupoId: number;
    vendaWhatsappId?: number;
  } | null>(null);

  const gruposOrdenados = useMemo(() => {
    return [...grupos].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [grupos]);

  const statusOptions = useMemo(
    () =>
      Object.entries(StatusEnum)
        .filter(([, value]) => typeof value === "number")
        .map(([label, value]) => ({
          label,
          value: Number(value),
        })),
    []
  );
  const statusLabelMap = useMemo(
    () => new Map(statusOptions.map((status) => [status.value, status.label])),
    [statusOptions]
  );

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const getInicioDia = (dateString: string) =>
    formatDateTime(new Date(`${dateString}T00:00:00`));

  const getFimDia = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + 1);
    return formatDateTime(date);
  };

  const carregarGrupos = async () => {
    try {
      setLoading(true);
      setErro(null);
      const id = filtroId.trim() ? Number(filtroId) : undefined;
      const usuarioId = user?.UserId;
      if (!usuarioId) return;
      const data = await buscarGruposWhatsapp({
        id,
        usuarioId: Number(usuarioId),
      });
      setGrupos(data ?? []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os grupos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.UserId) return;
    carregarGrupos();
  }, [filtroId, user?.UserId]);

  useEffect(() => {
    let ativo = true;
    const timer = setTimeout(async () => {
      try {
        setCarregandoVinculos(true);
        setErroVinculos(null);
        const data = await buscarVinculosWhatsapp(pesquisaVinculo);
        if (!ativo) return;
        setVinculos(data ?? []);
      } catch (error) {
        console.error(error);
        if (!ativo) return;
        setErroVinculos("Não foi possível carregar as conversas.");
      } finally {
        if (ativo) {
          setCarregandoVinculos(false);
        }
      }
    }, 400);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [pesquisaVinculo]);

  const handleCriarGrupo = async (event: React.FormEvent) => {
    event.preventDefault();
    const nome = novoGrupoNome.trim();
    if (!nome) return;
    if (!user?.UserId) {
      setErro("Usuario nao identificado.");
      return;
    }

    const temDataDe = dataInicialDe.trim() !== "";
    const temDataAte = dataInicialAte.trim() !== "";

    if (temDataDe && !temDataAte) {
      setErro("Informe a data inicial até.");
      return;
    }

    if (!temDataDe && temDataAte) {
      setErro("Informe a data inicial de.");
      return;
    }

    try {
      setErro(null);
      setCriandoGrupo(true);
      await criarGrupoWhatsapp({
        nome,
        usuarioId: Number(user.UserId),
        status:
          statusSelecionado === "" ? undefined : Number(statusSelecionado),
        dataInicialDe: temDataDe ? getInicioDia(dataInicialDe) : undefined,
        dataInicialAte: temDataAte ? getFimDia(dataInicialAte) : undefined,
      });
      setNovoGrupoNome("");
      setStatusSelecionado("");
      setDataInicialDe("");
      setDataInicialAte("");
      await carregarGrupos();
    } catch (error) {
      console.error(error);
      setErro("NÃ£o foi possÃ­vel criar o grupo.");
    } finally {
      setCriandoGrupo(false);
    }
  };

  const handleAdicionarConversa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!grupoSelecionado || !vendaWhatsappId.trim()) return;

    try {
      setAdicionando(true);
      await adicionarConversaAoGrupo({
        idGrupoWhats: Number(grupoSelecionado),
        idVendaWhats: Number(vendaWhatsappId.trim()),
      });
      setVendaWhatsappId("");
      await carregarGrupos();
    } catch (error) {
      console.error(error);
      setErro("NÃ£o foi possÃ­vel adicionar a conversa.");
    } finally {
      setAdicionando(false);
    }
  };

  const handleExcluirGrupo = (grupoId: number) => {
    setConfirmacaoAberta({ tipo: "excluir-grupo", grupoId });
  };

  const confirmarExcluirGrupo = async (grupoId: number) => {
    try {
      setExcluindoGrupoId(grupoId);
      await excluirGrupoWhatsapp(grupoId);
      await carregarGrupos();
    } catch (error) {
      console.error(error);
      setErro("Nao foi possivel excluir o grupo.");
    } finally {
      setExcluindoGrupoId(null);
    }
  };
  const handleRemoverConversa = (grupoId: number, vendaWhatsappId: number) => {
    setConfirmacaoAberta({
      tipo: "remover-conversa",
      grupoId,
      vendaWhatsappId,
    });
  };

  const confirmarRemoverConversa = async (
    grupoId: number,
    vendaWhatsappId: number
  ) => {
    const key = `${grupoId}-${vendaWhatsappId}`;

    try {
      setRemovendoConversaKey(key);
      await removerConversaGrupoWhatsapp({
        idGrupoWhats: grupoId,
        idsVendaWhats: [vendaWhatsappId],
      });
      await carregarGrupos();
    } catch (error) {
      console.error(error);
      setErro("Nao foi possivel remover a conversa.");
    } finally {
      setRemovendoConversaKey(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-6">
      <div className="w-full h-[calc(100vh-7rem)] max-w-6xl bg-card border border-border rounded-xl shadow-right p-6 flex flex-col gap-6 min-h-0">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground text-center">
            Grupos de WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Visualize os grupos cadastrados, com as conversas vinculadas, e
            gerencie novos envios.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleCriarGrupo}
            className="border border-border rounded-lg p-4 space-y-3 bg-background"
          >
            <h2 className="text-base font-semibold text-foreground">
              Criar novo grupo
            </h2>
            <label className="text-sm text-muted-foreground">
              Nome do grupo
              <input
                value={novoGrupoNome}
                onChange={(event) => setNovoGrupoNome(event.target.value)}
                className="mt-2 w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition mb-2"
                placeholder="Informe o nome do grupo"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Status (opcional)
              <select
                value={statusSelecionado}
                onChange={(event) =>
                  setStatusSelecionado(
                    event.target.value ? Number(event.target.value) : ""
                  )
                }
                className="mt-2 w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
              >
                <option value="">Todos os status</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
              <label className="text-sm text-muted-foreground">
                Data inicial de
                <input
                  type="date"
                  value={dataInicialDe}
                  onChange={(event) => setDataInicialDe(event.target.value)}
                  className="mt-2 w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                Data inicial até
                <input
                  type="date"
                  value={dataInicialAte}
                  onChange={(event) => setDataInicialAte(event.target.value)}
                  className="mt-2 w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={criandoGrupo || !novoGrupoNome.trim()}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
            >
              {criandoGrupo ? "Criando..." : "Criar grupo"}
            </button>
          </form>

          <form
            onSubmit={handleAdicionarConversa}
            className="border border-border rounded-lg p-4 space-y-3 bg-background"
          >
            <h2 className="text-base font-semibold text-foreground">
              Adicionar conversa ao grupo
            </h2>
            <label className="text-sm text-muted-foreground">
              Grupo
              <select
                value={grupoSelecionado}
                onChange={(event) =>
                  setGrupoSelecionado(
                    event.target.value ? Number(event.target.value) : ""
                  )
                }
                className="mt-2 w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
              >
                <option value="">Selecione um grupo</option>
                {gruposOrdenados.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-muted-foreground">
              Conversa (VendaWhatsapp)
              <div className="mt-2 space-y-2">
                <input
                  value={pesquisaVinculo}
                  onChange={(event) => setPesquisaVinculo(event.target.value)}
                  className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                  placeholder="Pesquisar conversa"
                  type="text"
                />
                <select
                  value={vendaWhatsappId}
                  onChange={(event) => setVendaWhatsappId(event.target.value)}
                  className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition mb-2"
                >
                  <option value="">Selecione uma conversa</option>
                  {carregandoVinculos && (
                    <option disabled value="">
                      Carregando conversas...
                    </option>
                  )}
                  {!carregandoVinculos &&
                    vinculos.map((vinculo) => (
                      <option key={vinculo.id} value={vinculo.id}>
                        {vinculo.venda?.cliente ?? "Cliente não informado"} -{" "}
                        {vinculo.venda?.contato ?? "Contato não informado"}
                      </option>
                    ))}
                </select>
                {erroVinculos && (
                  <span className="text-xs text-red-500">{erroVinculos}</span>
                )}
              </div>
            </label>
            <button
              type="submit"
              disabled={
                adicionando || !grupoSelecionado || !vendaWhatsappId.trim()
              }
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
            >
              {adicionando ? "Adicionando..." : "Adicionar conversa"}
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-sm text-muted-foreground">
              Buscar por ID do grupo
              <input
                value={filtroId}
                onChange={(event) => setFiltroId(event.target.value)}
                className="ml-2 mt-2 w-full sm:w-72 p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="Digite o ID do grupo"
                type="number"
                min={1}
              />
            </label>
            <button
              type="button"
              onClick={carregarGrupos}
              className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm hover:bg-muted/80 transition"
            >
              Atualizar lista
            </button>
          </div>

          {erro && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
              {erro}
            </div>
          )}

          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">
                Carregando grupos...
              </div>
            ) : gruposOrdenados.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                Nenhum grupo encontrado.
              </div>
            ) : (
              gruposOrdenados.map((grupo) => (
                <div
                  key={grupo.id}
                  className="border border-border rounded-lg p-4 bg-background shadow-sm"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {grupo.nome}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {grupo.conversas?.length ?? 0} conversas vinculadas
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExcluirGrupo(grupo.id)}
                        disabled={excluindoGrupoId === grupo.id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 transition disabled:opacity-60"
                      >
                        {excluindoGrupoId === grupo.id
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    {grupo.conversas && grupo.conversas.length > 0 ? (
                      <ul className="space-y-2">
                        {grupo.conversas.map((conversa) => (
                          <li
                            key={conversa.id}
                            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground"
                          >
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span>{formatarConversa(conversa)}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                              <span>
                                Contato: {conversa.venda?.contato ?? "N/A"} -
                                Status:{" "}
                                {typeof conversa.venda?.status === "number"
                                  ? statusLabelMap.get(conversa.venda.status) ??
                                    "N/A"
                                  : "N/A"}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoverConversa(
                                      grupo.id,
                                      conversa.vendaWhatsappId
                                    )
                                  }
                                  disabled={
                                    removendoConversaKey ===
                                    `${grupo.id}-${conversa.vendaWhatsappId}`
                                  }
                                  className="text-xs font-semibold text-red-600 hover:text-red-700 transition disabled:opacity-60"
                                >
                                  {removendoConversaKey ===
                                  `${grupo.id}-${conversa.vendaWhatsappId}`
                                    ? "Removendo..."
                                    : "Remover"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/venda/editar/${conversa.vendaId}`
                                    )
                                  }
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-green-600 border border-border text-white cursor-pointer hover:bg-green-700 transition"
                                  aria-label="Editar venda"
                                >
                                  <ChevronRight size={18} />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma conversa vinculada ao grupo.
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        open={confirmacaoAberta?.tipo === "excluir-grupo"}
        title="Excluir grupo"
        description="Tem certeza que deseja excluir este grupo?"
        confirmLabel="Excluir"
        variant="danger"
        onClose={() => setConfirmacaoAberta(null)}
        onConfirm={() => {
          if (!confirmacaoAberta) return;
          confirmarExcluirGrupo(confirmacaoAberta.grupoId);
          setConfirmacaoAberta(null);
        }}
      />

      <ConfirmModal
        open={confirmacaoAberta?.tipo === "remover-conversa"}
        title="Remover conversa do grupo"
        description="Tem certeza que deseja remover esta conversa do grupo?"
        confirmLabel="Remover"
        variant="danger"
        onClose={() => setConfirmacaoAberta(null)}
        onConfirm={() => {
          if (!confirmacaoAberta || !confirmacaoAberta.vendaWhatsappId) return;
          confirmarRemoverConversa(
            confirmacaoAberta.grupoId,
            confirmacaoAberta.vendaWhatsappId
          );
          setConfirmacaoAberta(null);
        }}
      />
    </div>
  );
}
