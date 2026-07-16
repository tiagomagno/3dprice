"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Criar empresa</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Crie sua conta e comece a precificar suas peças.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700">
              Nome da empresa/oficina
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            {state?.errors?.companyName && (
              <p className="mt-1 text-xs text-red-600">{state.errors.companyName[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              Seu nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Mínimo 8 caracteres, com letras e números.
            </p>
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
            )}
          </div>

          {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? "Criando…" : "Criar empresa"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
