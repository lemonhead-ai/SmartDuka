"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { authApi } from "@/features/auth/api";

export function ResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = searchParams.get("token") ?? "";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return setError("This reset link is incomplete or has expired.");
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      router.replace("/sign-in");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main id="main-content" className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full max-w-md rounded-[24px] border border-line bg-surface p-6 shadow-card sm:p-8">
      <SmartDukaLogo />
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Use at least 6 characters to protect your shopkeeper account.</p>
      <form className="mt-7 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold">New password<input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} type="password" autoComplete="new-password" className="rounded-[14px] border border-line bg-canvas px-4 py-3 font-normal" /></label>
        {error && <p role="alert" className="rounded-[14px] bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} disabled={isSubmitting} className="rounded-[14px] bg-ink px-5 py-3 font-bold text-white disabled:opacity-50">{isSubmitting ? "Saving…" : "Save new password"}</motion.button>
      </form>
      <Link href="/sign-in" className="mt-6 inline-block text-sm font-semibold text-accent">Back to sign in</Link>
    </motion.section>
  </main>;
}
