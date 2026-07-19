import { Suspense } from "react";
import { ResetPasswordCard } from "@/components/auth/ResetPasswordCard";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-canvas p-6"><p className="text-muted">Loading...</p></main>}>
      <ResetPasswordCard />
    </Suspense>
  );
}
