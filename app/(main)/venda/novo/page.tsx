"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { BuscarUsuarios } from "@/services/authService";
import { BuscarCondicaoVendas } from "@/services/condicaoVendaService";
import { BuscarServicos } from "@/services/servicoService";
import { BuscarSedes } from "@/services/sedeService"; // supondo que exista
import { CriarVenda } from "@/services/vendaService";
import { useAuth } from "@/hooks/useAuth";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  valorVenda: string;
  indicacao: string;
  dataNascimento: string;
};

type OptionType = {
  value: number;
  label: string;
};

export default function NovaVenda() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormData>();

  const { isAdmin, user } = useAuth();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [sedes, setSedes] = useState<{ id: number; nome: string }[]>([]);
  const [vendedores, setVendedores] = useState<{ id: number; nome: string }[]>(
    []
  );
  const [servicos, setServicos] = useState<{ id: number; nome: string }[]>([]);
  const [condicoes, setCondicoes] = useState<{ id: number; nome: string }[]>(
    []
  );
  const router = useRouter();
  useEffect(() => {
    const carregarListas = async () => {
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
    };

    carregarListas();
  }, []);

  useEffect(() => {
    if (user?.UserId) {
      setValue("vendedorId", Number(user.UserId));
    }
  }, [user, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const venda = await CriarVenda(data);
      toast.success("Venda registrada com sucesso!");
      await router.push(`/venda/editar/${venda.id}`);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao registrar a venda. Tente novamente mais tarde.");
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
          Nova Venda
        </h1>

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

          {/* Vendedor */}
          <Controller
            name="vendedorId"
            control={control}
            rules={{ required: "Selecione o vendedor." }}
            render={({ field, fieldState }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Vendedor
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
                  isClearable={isAdmin}
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

          {/* Cliente */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Cliente
            </label>
            <input
              {...register("cliente", {
                required: "O nome do cliente é obrigatório.",
              })}
              className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
              placeholder="Nome do cliente"
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

          <Controller
            name="fone"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Fone
                </label>

                <PatternFormat
                  value={field.value || ""}
                  onValueChange={(values) => field.onChange(values.value)}
                  format="(##) #####-####"
                  mask="_"
                  className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                  placeholder="(41) 99999-9999"
                />
              </div>
            )}
          />

          <Controller
            name="contato"
            control={control}
            rules={{ required: "O contato é obrigatório." }}
            render={({ field, fieldState }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Contato (Telefone)
                </label>

                <PatternFormat
                  value={field.value || ""}
                  onValueChange={(values) => field.onChange(values.value)}
                  format="(##) #####-####"
                  mask="_"
                  className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                  placeholder="(41) 99999-9999"
                />

                {fieldState.error && (
                  <p className="text-error text-sm mt-1">
                    {fieldState.error.message}
                  </p>
                )}
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
            rules={{ required: "O status é obrigatório." }}
            render={({ field, fieldState }) => (
              <div>
                <label className="block mb-1 text-sm font-medium text-muted-foreground">
                  Status
                </label>

                <Select<OptionType, false>
                  {...field}
                  options={statusOptions}
                  value={
                    statusOptions.find((opt) => opt.value === field.value) ||
                    null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  placeholder="Selecione o status"
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

          {/* Data de Nascimento */}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60 mt-4"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>

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
