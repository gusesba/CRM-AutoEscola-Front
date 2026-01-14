"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import Select from "react-select";
import { BuscarUsuarios } from "@/services/authService";
import { BuscarCondicaoVendas } from "@/services/condicaoVendaService";
import { BuscarServicos } from "@/services/servicoService";
import { BuscarSedes } from "@/services/sedeService";
import {
  AtualizarVenda,
  BuscarVendaChatVinculo,
  BuscarVendaPorId,
  VendaChatVinculoDto,
} from "@/services/vendaService";
import {
  adicionarConversaAoGrupo,
  buscarGruposWhatsapp,
  buscarGruposWhatsappPorVenda,
  GrupoWhatsapp,
  removerConversaGrupoWhatsapp,
} from "@/services/whatsappGroupService";
import { useAuth } from "@/hooks/useAuth";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

type FormData = {
  sedeId: number;
  vendedorId: number;
  cliente: string;
  genero: number;
  origem: number;
  email: string;
  fone: string;
  contato: string;
  comoConheceu: string;
  motivoEscolha: string;
  servicoId: number;
  obs: string;
  condicaoVendaId: number;
  status: number;
  valorVenda: number;
  indicacao: string;
  dataNascimento: string;
};

type OptionType = {
  value: number;
  label: string;
};

export default function EditarVenda() {
  const params = useParams();
  const router = useRouter();
  const vendaId = params.id as string;

  // TODO: Implementar lógica real de verificação de admin
  const { isAdmin, user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingVenda, setLoadingVenda] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [vendaChatVinculo, setVendaChatVinculo] =
    useState<VendaChatVinculoDto | null>(null);
  const [loadingVinculo, setLoadingVinculo] = useState(true);
  const [vinculoError, setVinculoError] = useState<string | null>(null);
  const [gruposWhatsapp, setGruposWhatsapp] = useState<GrupoWhatsapp[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [gruposError, setGruposError] = useState<string | null>(null);
  const [removendoGrupo, setRemovendoGrupo] = useState<number | null>(null);
  const [grupoChatIndex, setGrupoChatIndex] = useState(0);
  const gruposChatPorPagina = 3;
  const [modalAdicionarGrupoOpen, setModalAdicionarGrupoOpen] = useState(false);
  const [gruposDisponiveis, setGruposDisponiveis] = useState<GrupoWhatsapp[]>(
    []
  );
  const [carregandoGruposDisponiveis, setCarregandoGruposDisponiveis] =
    useState(false);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<number | "">("");
  const [erroAdicionarGrupo, setErroAdicionarGrupo] = useState<string | null>(
    null
  );
  const [adicionandoGrupo, setAdicionandoGrupo] = useState(false);

  const [sedes, setSedes] = useState<{ id: number; nome: string }[]>([]);
  const [vendedores, setVendedores] = useState<{ id: number; nome: string }[]>(
    []
  );
  const [servicos, setServicos] = useState<{ id: number; nome: string }[]>([]);
  const [condicoes, setCondicoes] = useState<{ id: number; nome: string }[]>(
    []
  );

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar listas
        const [sedesRes, vendRes, servRes, condRes] = await Promise.all([
          BuscarSedes("pageSize=1000"),
          BuscarUsuarios("pageSize=1000"),
          BuscarServicos("pageSize=1000"),
          BuscarCondicaoVendas("pageSize=1000"),
        ]);

        setSedes(sedesRes?.items || []);
        setVendedores(vendRes?.items || []);
        setServicos(servRes?.items || []);
        setCondicoes(condRes?.items || []);

        // Carregar venda específica
        const venda = await BuscarVendaPorId(vendaId);

        if (venda) {
          reset({
            sedeId: venda.sedeId,
            vendedorId: venda.vendedorId,
            cliente: venda.cliente,
            genero: venda.genero,
            origem: venda.origem,
            email: venda.email,
            fone: venda.fone,
            contato: venda.contato,
            comoConheceu: venda.comoConheceu,
            motivoEscolha: venda.motivoEscolha,
            servicoId: venda.servicoId,
            obs: venda.obs,
            condicaoVendaId: venda.condicaoVendaId,
            status: venda.status,
            valorVenda: venda.valorVenda,
            indicacao: venda.indicacao,
            dataNascimento: venda.dataNascimento,
          });
        } else {
          setLoadError("Venda não encontrada.");
        }

        try {
          const vinculo = await BuscarVendaChatVinculo(vendaId);
          setVendaChatVinculo(vinculo);
        } catch (error) {
          console.error(error);
          setVinculoError("Não foi possível carregar o vínculo com WhatsApp.");
        } finally {
          setLoadingVinculo(false);
        }

        try {
          const grupos = await buscarGruposWhatsappPorVenda(vendaId);
          setGruposWhatsapp(grupos);
        } catch (error) {
          console.error(error);
          setGruposError("Não foi possível carregar os grupos do WhatsApp.");
        } finally {
          setLoadingGrupos(false);
        }
      } catch (err) {
        setLoadError("Erro ao carregar dados da venda.");
        console.error(err);
        setLoadingVinculo(false);
        setLoadingGrupos(false);
      } finally {
        setLoadingVenda(false);
      }
    };

    carregarDados();
  }, [vendaId, reset]);

  useEffect(() => {
    if (!modalAdicionarGrupoOpen || !user?.UserId) return;

    const carregarGruposDisponiveis = async () => {
      try {
        setCarregandoGruposDisponiveis(true);
        setErroAdicionarGrupo(null);

        const grupos = await buscarGruposWhatsapp({
          usuarioId: Number(user.UserId),
        });

        const gruposAtuais = new Set(gruposWhatsapp.map((grupo) => grupo.id));
        const disponiveis = (grupos ?? []).filter(
          (grupo) => !gruposAtuais.has(grupo.id)
        );

        setGruposDisponiveis(disponiveis);
      } catch (error) {
        console.error(error);
        setErroAdicionarGrupo("Não foi possível carregar os grupos.");
      } finally {
        setCarregandoGruposDisponiveis(false);
      }
    };

    carregarGruposDisponiveis();
  }, [modalAdicionarGrupoOpen, user?.UserId, gruposWhatsapp]);

  useEffect(() => {
    setGrupoChatIndex((prev) => {
      const totalPaginas = Math.max(
        1,
        Math.ceil(gruposWhatsapp.length / gruposChatPorPagina)
      );
      return Math.min(prev, totalPaginas - 1);
    });
  }, [gruposWhatsapp.length]);

  const onSubmit = async (data: FormData) => {
    try {
      await AtualizarVenda(vendaId, data);
      toast.success("Venda atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar venda. Tente novamente mais tarde.");
      console.error(error);
    }
  };

  // Opções estáticas
  const generoOptions = [
    { value: 1, label: "Masculino" },
    { value: 2, label: "Feminino" },
    { value: 3, label: "Outro" },
    { value: 4, label: "Prefiro não informar" },
  ];

  const origemOptions = [
    { value: 1, label: "Presencialmente" },
    { value: 2, label: "Fone" },
    { value: 3, label: "Email" },
  ];

  const statusOptions = [
    { value: 1, label: "Agendar Contato" },
    { value: 2, label: "Venda Efetivada" },
    { value: 3, label: "Stand By" },
    { value: 4, label: "Optou pela Concorrência" },
    { value: 5, label: "Não Enviar Mais" },
  ];

  const handleRemoverGrupo = async (grupo: GrupoWhatsapp) => {
    const confirmado = window.confirm(
      "Tem certeza que deseja remover esta venda do grupo?"
    );
    if (!confirmado) return;

    const idsVendaWhats = grupo.conversas
      .filter((conversa) => conversa.vendaId === Number(vendaId))
      .map((conversa) => conversa.vendaWhatsappId);

    if (idsVendaWhats.length === 0) {
      toast.error("Não foi possível identificar a conversa da venda.");
      return;
    }

    try {
      setRemovendoGrupo(grupo.id);
      await removerConversaGrupoWhatsapp({
        idGrupoWhats: grupo.id,
        idsVendaWhats,
      });
      setGruposWhatsapp((prev) => prev.filter((item) => item.id !== grupo.id));
      toast.success("Venda removida do grupo com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover venda do grupo.");
    } finally {
      setRemovendoGrupo(null);
    }
  };

  const fecharModalAdicionarGrupo = () => {
    setModalAdicionarGrupoOpen(false);
    setGrupoSelecionadoId("");
    setErroAdicionarGrupo(null);
  };

  const handleAdicionarGrupo = async () => {
    if (!grupoSelecionadoId) {
      setErroAdicionarGrupo("Selecione um grupo para adicionar.");
      return;
    }

    if (!vendaChatVinculo?.vendaWhatsappId) {
      setErroAdicionarGrupo(
        "Vincule a conversa a esta venda para adicionar ao grupo."
      );
      return;
    }

    try {
      setAdicionandoGrupo(true);
      await adicionarConversaAoGrupo({
        idGrupoWhats: Number(grupoSelecionadoId),
        idVendaWhats: Number(vendaChatVinculo.vendaWhatsappId),
      });
      const gruposAtualizados = await buscarGruposWhatsappPorVenda(vendaId);
      setGruposWhatsapp(gruposAtualizados);
      fecharModalAdicionarGrupo();
      toast.success("Venda adicionada ao grupo com sucesso!");
    } catch (error) {
      console.error(error);
      setErroAdicionarGrupo("Não foi possível adicionar ao grupo.");
    } finally {
      setAdicionandoGrupo(false);
    }
  };

  if (loadingVenda) {
    return (
      <div className="w-full flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando dados da venda...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-error mb-4">{loadError}</p>
          <button
            onClick={() => router.push("/venda")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const totalPaginasGrupoChat = Math.ceil(
    gruposWhatsapp.length / gruposChatPorPagina
  );

  const gruposChatPaginados = gruposWhatsapp.slice(
    grupoChatIndex * gruposChatPorPagina,
    (grupoChatIndex + 1) * gruposChatPorPagina
  );

  return (
    <>
      <div className="w-full flex justify-center p-4">
        <div className="w-full max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex flex-1 items-center gap-2 overflow-hidden">
              {grupoChatIndex !== 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setGrupoChatIndex((prev) => Math.max(0, prev - 1))
                  }
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40 cursor-pointer"
                  aria-label="Ver grupos anteriores"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="flex items-center gap-2 overflow-hidden">
                {loadingGrupos && (
                  <span className="text-xs text-gray-500">
                    Carregando grupos...
                  </span>
                )}
                {!loadingGrupos && gruposChatPaginados.length === 0 && (
                  <span className="text-xs text-gray-500">
                    Nenhum grupo associado
                  </span>
                )}
                {!loadingGrupos &&
                  gruposChatPaginados.map((grupo) => (
                    <span
                      key={grupo.id}
                      className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-full bg-green-600 pl-3 pr-2 py-1 text-xs font-semibold text-white"
                      title={grupo.nome}
                    >
                      <span className="truncate">{grupo.nome}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoverGrupo(grupo);
                        }}
                        disabled={removendoGrupo === grupo.id}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-red-200 transition hover:bg-red-500/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        aria-label={`Remover venda do grupo ${grupo.nome}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                <button
                  type="button"
                  onClick={() => setModalAdicionarGrupoOpen(true)}
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 cursor-pointer"
                  aria-label="Adicionar venda ao grupo"
                >
                  <Plus size={14} />
                </button>
              </div>
              {grupoChatIndex < totalPaginasGrupoChat - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setGrupoChatIndex((prev) =>
                      Math.min(totalPaginasGrupoChat - 1, prev + 1)
                    )
                  }
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40 cursor-pointer"
                  aria-label="Ver próximos grupos"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            onSubmitCapture={() => {
              setSuccessMessage(null);
              setSubmitError(null);
            }}
            className="bg-card border border-border rounded-xl p-8 shadow-md w-full max-h-[80vh] overflow-y-auto space-y-6"
            noValidate
          >
        <h1 className="text-2xl font-semibold text-center text-foreground mb-6">
          Editar Lead
        </h1>

        {loadingVinculo ? (
          <p className="text-sm text-muted-foreground mt-[-30px]">
            Carregando vínculo...
          </p>
        ) : vinculoError ? (
          <p className="text-sm text-error mt-[-30px]">{vinculoError}</p>
        ) : vendaChatVinculo?.vinculado ? (
          <p className="text-sm font-medium text-green-500 mt-[-30px]">
            Lead vinculado a uma conversa
          </p>
        ) : (
          <p className="text-sm font-medium text-red-500 mt-[-30px]">
            Lead não vinculado a nenhuma conversa
          </p>
        )}

        {gruposError && (
          <p className="text-sm text-error">{gruposError}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sede */}
          <Controller
            name="sedeId"
            control={control}
            rules={{ required: "Selecione a sede." }}
            render={({ field, fieldState }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Sede
                </label>
                <Select<OptionType, false>
                  {...field}
                  options={sedes.map((s) => ({ value: s.id, label: s.nome }))}
                  value={
                    sedes
                      .map((s) => ({ value: s.id, label: s.nome }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione a sede"
                  isClearable
                  classNamePrefix="react-select"
                />
                {fieldState.error && (
                  <p className="text-error text-sm mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Vendedor - Apenas admin pode editar */}
          <Controller
            name="vendedorId"
            control={control}
            rules={{ required: "Selecione o vendedor." }}
            render={({ field, fieldState }) => (
              <div className={`${!isAdmin && "cursor-not-allowed"}`}>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Vendedor {!isAdmin && "(Somente admin)"}
                </label>
                <Select<OptionType, false>
                  {...field}
                  value={
                    vendedores
                      .map((s) => ({ value: s.id, label: s.nome }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  options={vendedores.map((v) => ({
                    value: v.id,
                    label: v.nome,
                  }))}
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione o vendedor"
                  isClearable
                  isDisabled={!isAdmin}
                  classNamePrefix="react-select"
                />
                {fieldState.error && (
                  <p className="text-error text-sm mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Cliente - Apenas admin pode editar */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Cliente {!isAdmin && "(Somente admin)"}
            </label>
            <input
              {...register("cliente", {
                required: "O nome do cliente é obrigatório.",
              })}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Nome do cliente"
              disabled={!isAdmin}
            />
            {errors.cliente && (
              <p className="text-error text-sm mt-1">
                {errors.cliente.message}
              </p>
            )}
          </div>

          {/* Gênero */}
          <Controller
            name="genero"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Gênero
                </label>
                <Select<OptionType, false>
                  {...field}
                  options={generoOptions}
                  value={
                    generoOptions
                      .map((s) => ({ value: s.value, label: s.label }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione o gênero"
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>
            )}
          />

          {/* Origem */}
          <Controller
            name="origem"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Origem
                </label>
                <Select<OptionType, false>
                  {...field}
                  options={origemOptions}
                  value={
                    origemOptions
                      .map((s) => ({ value: s.value, label: s.label }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione a origem"
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>
            )}
          />

          {/* Contatos */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
              placeholder="exemplo@email.com"
            />
          </div>

          {/* Fone - Apenas admin pode editar */}
          <Controller
            name="fone"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Fone {!isAdmin && "(Somente admin)"}
                </label>

                <PatternFormat
                  value={field.value || ""}
                  onValueChange={(values) => field.onChange(values.value)}
                  format="(##) #####-####"
                  disabled={!isAdmin}
                  mask="_"
                  className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary disabled:cursor-not-allowed"
                  placeholder="(41) 99999-9999"
                />
              </div>
            )}
          />

          {/* Contato - Apenas admin pode editar */}
          <Controller
            name="contato"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Contato (Telefone) {!isAdmin && "(Somente admin)"}
                </label>

                <PatternFormat
                  value={field.value || ""}
                  onValueChange={(values) => field.onChange(values.value)}
                  format="(##) #####-####"
                  disabled={!isAdmin}
                  mask="_"
                  className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary disabled:cursor-not-allowed"
                  placeholder="(41) 99999-9999"
                />
              </div>
            )}
          />

          {/* Indicação */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Indicação
            </label>
            <input
              {...register("indicacao")}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
              placeholder="Quem indicou?"
            />
          </div>

          {/* Como conheceu / Motivo */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Como conheceu
            </label>
            <input
              {...register("comoConheceu")}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Motivo da escolha
            </label>
            <input
              {...register("motivoEscolha")}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Serviço */}
          <Controller
            name="servicoId"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Serviço
                </label>
                <Select<OptionType, false>
                  {...field}
                  options={servicos.map((s) => ({
                    value: s.id,
                    label: s.nome,
                  }))}
                  value={
                    servicos
                      .map((s) => ({ value: s.id, label: s.nome }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione o serviço"
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>
            )}
          />

          {/* Condição de venda */}
          <Controller
            name="condicaoVendaId"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Condição de Venda
                </label>
                <Select<OptionType, false>
                  {...field}
                  options={condicoes.map((c) => ({
                    value: c.id,
                    label: c.nome,
                  }))}
                  value={
                    condicoes
                      .map((s) => ({ value: s.id, label: s.nome }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione a condição"
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>
            )}
          />

          {/* Status */}
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <Select<OptionType, false>
                  {...field}
                  options={statusOptions}
                  value={
                    statusOptions
                      .map((s) => ({ value: s.value, label: s.label }))
                      .find((opt) => opt.value === field.value) || null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione o status"
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>
            )}
          />

          {/* Valor da venda */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Valor da Venda
            </label>
            <input
              {...register("valorVenda")}
              type="number"
              step="0.01"
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
              placeholder="R$"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Data de Nascimento
            </label>
            <input
              type="date"
              {...register("dataNascimento")}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Observações */}
          <div className="md:col-span-1 lg:col-span-2">
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Observações
            </label>
            <textarea
              {...register("obs")}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setIsRedirecting(true);
              router.push(`/agendamento/venda/${vendaId}`);
            }}
            className="flex-1 bg-gray-200 text-gray-800 font-medium py-2 rounded-lg hover:bg-gray-300 transition"
          >
            {isRedirecting ? "Redirecionando..." : "Agendamentos"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? "Salvando..." : "Atualizar"}
          </button>
        </div>

        {successMessage && (
          <p className="text-green-600 text-center font-medium mt-2">
            {successMessage}
          </p>
        )}
        {submitError && (
          <p className="text-error text-center font-medium mt-2">
            {submitError}
          </p>
        )}
          </form>
        </div>
      </div>

      {modalAdicionarGrupoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Adicionar ao grupo
                </h2>
                <p className="text-xs text-gray-500">
                  Selecione o grupo para incluir esta venda.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalAdicionarGrupo}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Grupo
                </label>
                <select
                  value={grupoSelecionadoId}
                  onChange={(event) =>
                    setGrupoSelecionadoId(
                      event.target.value ? Number(event.target.value) : ""
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  disabled={carregandoGruposDisponiveis}
                >
                  <option value="">Selecione um grupo</option>
                  {gruposDisponiveis.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
                {carregandoGruposDisponiveis && (
                  <p className="mt-1 text-xs text-gray-500">
                    Carregando grupos...
                  </p>
                )}
                {!carregandoGruposDisponiveis &&
                  gruposDisponiveis.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Não há grupos disponíveis para adicionar esta venda.
                    </p>
                  )}
              </div>

              {!vendaChatVinculo?.vendaWhatsappId && (
                <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  Vincule a conversa a esta venda para habilitar a inclusão em
                  grupos.
                </p>
              )}

              {erroAdicionarGrupo && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {erroAdicionarGrupo}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={fecharModalAdicionarGrupo}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarGrupo}
                disabled={
                  adicionandoGrupo ||
                  carregandoGruposDisponiveis ||
                  !grupoSelecionadoId ||
                  !vendaChatVinculo?.vendaWhatsappId
                }
                className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adicionandoGrupo ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
