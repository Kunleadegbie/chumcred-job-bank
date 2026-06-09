import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="bg-slate-50 px-6 py-16">
      <AuthForm mode="login" />
    </main>
  );
}