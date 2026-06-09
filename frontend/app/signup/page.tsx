import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="bg-slate-50 px-6 py-16">
      <AuthForm mode="signup" />
    </main>
  );
}