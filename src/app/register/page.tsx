import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold mb-8">Регистрация</h1>
      <RegisterForm />
    </main>
  );
}
