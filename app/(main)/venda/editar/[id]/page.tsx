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
import { useAuth } from "@/hooks/useAuth";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";

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
  const { isAdmin } = useAuth();

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
      } catch (err) {
        setLoadError("Erro ao carregar dados da venda.");
        console.error(err);
        setLoadingVinculo(false);
      } finally {
        setLoadingVenda(false);
      }
    };

    carregarDados();
  }, [vendaId, reset]);

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

  return (
    <div className="w-full flex justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        onSubmitCapture={() => {
          setSuccessMessage(null);
          setSubmitError(null);
        }}
        className="bg-card border border-border rounded-xl p-8 shadow-md w-full max-w-6xl max-h-[80vh] overflow-y-auto space-y-6"
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
  );
}
