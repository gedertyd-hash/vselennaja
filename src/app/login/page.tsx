import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold mb-8">Вход</h1>
      <LoginForm />
    </main>
  );
}
