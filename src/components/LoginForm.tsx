"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = undefined;

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-cream focus:border-yolk outline-none transition"
        />
        {state?.errors?.email && (
          <p className="text-xs text-paprika">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-cream focus:border-yolk outline-none transition"
        />
        {state?.errors?.password && (
          <p className="text-xs text-paprika">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-paprika">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition disabled:opacity-50"
      >
        {pending ? "Входим…" : "Войти"}
      </button>

      <p className="text-sm text-center text-text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-cream underline">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
