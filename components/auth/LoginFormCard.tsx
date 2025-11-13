"use client";
import React, { useEffect } from "react";
import InputLabel from "../UI/InputLabel";
import Button from "../UI/Button";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Login } from "@/services/authService";

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

  const onSubmit: SubmitHandler<IFormValues> = async (data) => {
    try {
      await Login(data);
      router.push("/vendedor/novo");
    } catch (error) {
      console.error(error);
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
        {/* <InputLabel
                    text="Nome"
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    register={register}
                    rules={{ required: "Digite seu nome" }}
                    errorMesage={errors.name?.message}
                /> */}

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

        <Button>Login</Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-4 text-gray-400 text-sm">
        <Link href="#" className="hover:text-primary">
          Esqueceu a senha?
        </Link>
        <span>•</span>
        <Link href="#" className="hover:text-primary">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
