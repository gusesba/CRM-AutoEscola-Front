"use client";
import React, { useState } from "react";
import InputLabel from "../UI/InputLabel";
import Button from "../UI/Button";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Login } from "@/services/authService";
import { toast } from "sonner";

interface IFormValues {
  usuario: string;
  senha: string;
}

export default function LoginFormCard() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormValues>();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: SubmitHandler<IFormValues> = async (data) => {
    try {
      setIsLoading(true);

      await Login(data);

      toast.success("Logado com sucesso!");
      await router.push("/vendedor/novo");
    } catch (error: any) {
      console.error(error);

      if (
        error.message === "Falha ao fazer login. Verifique suas credenciais."
      ) {
        toast.error("Credenciais inválidas. Tente novamente.");
      } else {
        toast.error("Falha inesperada no login. Tente novamente mais tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-10 md:p-16">
      <h2 className="text-3xl font-bold text-primary mb-2">
        Bem vindo à Agenda!
      </h2>
      <p className="text-secondary mb-6">Digite seus dados para acessar</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 text-gray-400"
      >
        <InputLabel
          text="Usuário"
          id="usuario"
          type="text"
          placeholder="Usuário"
          register={register}
          rules={{ required: "Digite seu usuário" }}
          errorMesage={errors.usuario?.message}
        />

        <InputLabel
          text="Senha"
          id="senha"
          type="password"
          placeholder="••••••••"
          register={register}
          rules={{
            required: "Digite sua senha",
            minLength: {
              value: 3,
              message: "A senha deve ter no mínimo 3 caracteres",
            },
          }}
          errorMesage={errors.senha?.message}
        />

        <Button disabled={isLoading}>
          {isLoading ? "Entrando..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
