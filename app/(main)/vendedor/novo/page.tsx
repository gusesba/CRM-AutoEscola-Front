"use client";

import { CriarVendedor } from "@/services/authService";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormData = {
  nome: string;
  usuario: string;
  senha: string;
  isAdmin: boolean;
};

export default function NovoVendedor() {
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
      await CriarVendedor(data);
      toast.success("Vendedor adicionado com sucesso!");
      reset();
    } catch (err) {
      console.log(err);
      // toast.error("Erro ao adicionar vendedor. Tente novamente mais tarde.");
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
            Novo Vendedor
          </h1>

          {/* Nome */}
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
              placeholder="Digite o nome completo"
            />
            {errors.nome && (
              <p className="text-error text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Login */}
          <div>
            <label
              htmlFor="usuario"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Login
            </label>
            <input
              id="usuario"
              type="text"
              {...register("usuario", { required: "O usuário é obrigatório." })}
              aria-invalid={errors.usuario ? "true" : "false"}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.usuario
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                }`}
              placeholder="Digite o usuário"
            />
            {errors.usuario && (
              <p className="text-error text-sm mt-1">
                {errors.usuario.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="senha"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              {...register("senha", {
                required: "A senha é obrigatória.",
              })}
              aria-invalid={errors.senha ? "true" : "false"}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.senha
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                }`}
              placeholder="Digite a senha"
            />
            {errors.senha && (
              <p className="text-error text-sm mt-1">{errors.senha.message}</p>
            )}
          </div>

          {/* Checkbox - Admin */}
          <div className="flex items-center gap-3 justify-end">
            <label
              htmlFor="isAdmin"
              className="relative flex items-center cursor-pointer select-none"
            >
              <input
                id="isAdmin"
                type="checkbox"
                {...register("isAdmin")}
                className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-lg cursor-pointer 
                transition-all duration-200 bg-background checked:bg-primary checked:border-primary"
              />
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </label>
            <span className="text-sm text-muted-foreground select-none">
              Administrador
            </span>
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
