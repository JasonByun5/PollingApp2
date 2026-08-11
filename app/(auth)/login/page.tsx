import { LoginForm } from "@/components/auth/login-form";

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center px-6 py-16 md:py-24">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
