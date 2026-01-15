"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BuscarUsuarios, EditarUsuario } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

const statusOptions = [
  { value: 1, label: "Ativo" },
  { value: 2, label: "Desligado" },
  { value: 3, label: "Afastado" },
];

type Usuario = {
  id: number;
  nome: string;
  usuario: string;
  isAdmin: boolean;
  status: number;
};

type FormData = {
  nome: string;
  usuario: string;
  senha?: string;
  isAdmin: boolean;
  status: number;
};

export default function EditarUsuarioPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const usuarioId = Number(params.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      if (!usuarioId || Number.isNaN(usuarioId)) {
        setErroCarregamento("Usuário inválido.");
        setCarregandoUsuario(false);
        return;
      }

      try {
        setCarregandoUsuario(true);
        const resultado = await BuscarUsuarios(`id=${usuarioId}&pageSize=1`);
        const usuario = (resultado?.items || [])[0] as Usuario | undefined;

        if (!usuario) {
          setErroCarregamento("Usuário não encontrado.");
          return;
        }

        reset({
          nome: usuario.nome,
          usuario: usuario.usuario,
          isAdmin: usuario.isAdmin,
          status: usuario.status,
          senha: "",
        });
      } catch (error) {
        console.error(error);
        setErroCarregamento("Erro ao carregar usuário.");
      } finally {
        setCarregandoUsuario(false);
      }
    };

    carregarUsuario();
  }, [reset, usuarioId]);

  const onSubmit = async (data: FormData) => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem editar usuários.");
      return;
    }

    try {
      await EditarUsuario({
        id: usuarioId,
        nome: data.nome,
        usuario: data.usuario,
        senha: data.senha ? data.senha : null,
        isAdmin: data.isAdmin,
        status: Number(data.status),
      });
      toast.success("Usuário atualizado com sucesso!");
      router.push("/vendedor");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar usuário.");
    }
  };

  if (loading || carregandoUsuario) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-muted-foreground">Carregando usuário...</p>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="bg-card border border-border rounded-xl shadow-right p-6 text-center space-y-3">
          <p className="text-foreground font-medium">{erroCarregamento}</p>
          <button
            type="button"
            onClick={() => router.push("/vendedor")}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full p-6">
      <div className="w-full max-w-xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card shadow-right border border-border rounded-xl p-8 space-y-6"
          noValidate
        >
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Editar Usuário
            </h1>
            {!isAdmin && (
              <p className="text-sm text-error">
                Apenas administradores podem editar usuários.
              </p>
            )}
          </div>

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
              disabled={!isAdmin}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.nome
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                } ${!isAdmin ? "opacity-60" : ""}`}
              placeholder="Digite o nome completo"
            />
            {errors.nome && (
              <p className="text-error text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

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
              {...register("usuario", {
                required: "O usuário é obrigatório.",
              })}
              aria-invalid={errors.usuario ? "true" : "false"}
              disabled={!isAdmin}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition
                ${
                  errors.usuario
                    ? "ring-1 focus:ring-2 ring-error"
                    : "focus:ring-2 focus:ring-primary"
                } ${!isAdmin ? "opacity-60" : ""}`}
              placeholder="Digite o usuário"
            />
            {errors.usuario && (
              <p className="text-error text-sm mt-1">
                {errors.usuario.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Nova senha (opcional)
            </label>
            <input
              id="senha"
              type="password"
              {...register("senha")}
              disabled={!isAdmin}
              className={`w-full p-2 border rounded-lg bg-background focus:outline-none transition focus:ring-2 focus:ring-primary ${
                !isAdmin ? "opacity-60" : ""
              }`}
              placeholder="Deixe em branco para manter"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="status"
              {...register("status", { valueAsNumber: true })}
              disabled={!isAdmin}
              className={`w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary outline-none ${
                !isAdmin ? "opacity-60" : ""
              }`}
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <label
              htmlFor="isAdmin"
              className="relative flex items-center cursor-pointer select-none"
            >
              <input
                id="isAdmin"
                type="checkbox"
                {...register("isAdmin")}
                disabled={!isAdmin}
                className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-lg cursor-pointer 
                transition-all duration-200 bg-background checked:bg-primary checked:border-primary disabled:cursor-not-allowed"
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

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !isAdmin}
              className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/vendedor")}
              className="w-full border border-border rounded-lg py-2 text-sm hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
