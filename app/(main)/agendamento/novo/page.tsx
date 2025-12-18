"use client";

import { CriarAgendamento } from "@/services/agendamentoService";
import { useState } from "react";
import { useForm } from "react-hook-form";

type FormData = {
  vendaId: number;
  dataAgendamento: string;
  obs?: string;
};

export default function NovoAgendamento() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      await CriarAgendamento({
        vendaId: Number(data.vendaId),
        dataAgendamento: data.dataAgendamento,
        obs: data.obs,
      });

      setSuccessMessage("Agendamento criado com sucesso!");
      reset();
    } catch (err) {
      setSubmitError("Erro ao criar agendamento. Tente novamente.");
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          onSubmitCapture={() => {
            setSuccessMessage(null);
            setSubmitError(null);
          }}
          className="bg-card shadow-right border border-border rounded-xl p-8 space-y-6"
          noValidate
        >
          <h1 className="text-2xl font-semibold text-center text-foreground">
            Novo Agendamento
          </h1>

          {/* Venda */}
          <div>
            <label
              htmlFor="vendaId"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              ID da Venda
            </label>
            <input
              id="vendaId"
              type="number"
              {...register("vendaId", {
                required: "A venda é obrigatória.",
                valueAsNumber: true,
              })}
              aria-invalid={errors.vendaId ? "true" : "false"}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.vendaId
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                }`}
              placeholder="Informe o ID da venda"
            />
            {errors.vendaId && (
              <p className="text-error text-sm mt-1">
                {errors.vendaId.message}
              </p>
            )}
          </div>

          {/* Data do Agendamento */}
          <div>
            <label
              htmlFor="dataAgendamento"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Data do Agendamento
            </label>
            <input
              id="dataAgendamento"
              type="datetime-local"
              {...register("dataAgendamento", {
                required: "A data do agendamento é obrigatória.",
              })}
              aria-invalid={errors.dataAgendamento ? "true" : "false"}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.dataAgendamento
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                }`}
            />
            {errors.dataAgendamento && (
              <p className="text-error text-sm mt-1">
                {errors.dataAgendamento.message}
              </p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label
              htmlFor="obs"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Observações
            </label>
            <textarea
              id="obs"
              rows={3}
              {...register("obs")}
              className="w-full p-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition"
              placeholder="Observações adicionais (opcional)"
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>

          {/* Mensagens globais */}
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
  );
}
