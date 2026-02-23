import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { Loading } from "@/components/ui/loading";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
          <Loading size="lg" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
