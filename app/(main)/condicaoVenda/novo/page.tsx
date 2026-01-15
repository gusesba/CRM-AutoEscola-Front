"use client";

import { CriarCondicaoVenda } from "@/services/condicaoVendaService";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormData = {
  nome: string;
};

export default function NovoCondicaoVenda() {
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
      await CriarCondicaoVenda(data);
      toast.success("Condição venda adicionada com sucesso!");
      reset();
    } catch (err) {
      console.log(err);
      toast.error("Erro ao adicionar condição venda. Tente novamente.");
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
            Nova Condição de Venda
          </h1>

          <div>
            <label
              htmlFor="nome"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Nome
            </label>
            <input
              id="nome"
              type="text"
              {...register("nome", { required: "O nome é obrigatório." })}
              aria-invalid={errors.nome ? "true" : "false"}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.nome
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                }`}
              placeholder="Digite o nome do condição venda"
            />
            {errors.nome && (
              <p className="text-error text-sm mt-1">{errors.nome.message}</p>
            )}
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
