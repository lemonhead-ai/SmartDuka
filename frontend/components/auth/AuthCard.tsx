"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";

import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { authApi } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiRequestError, gameplayApi } from "@/features/gameplay/api";
import { MiloAlert } from "@/components/ui/MiloAlert";
import { formatMiloMessage } from "@/features/feedback/toast-store";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

const copy: Record<AuthMode, { title: string; description: string; submit: string }> = {
  "sign-in": { title: "Welcome back", description: "Sign in to manage your duka.", submit: "Sign in" },
  "sign-up": { title: "Create your account", description: "Set up a secure shopkeeper account.", submit: "Create account" },
  "forgot-password": { title: "Reset your password", description: "We will send reset instructions if this email has an account.", submit: "Send instructions" }
};

export function AuthCard({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { setShopkeeper } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = copy[mode];

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (mode === "sign-up" && password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Your passwords do not match yet.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === "sign-up") {
        const response = await authApi.signUp(email, displayName, password);
        if (response.access_token) authApi.storeSessionToken(response.access_token);
        setShopkeeper(response.shopkeeper);
        router.replace("/setup");
      } else if (mode === "sign-in") {
        const response = await authApi.signIn(email, password);
        if (response.access_token) authApi.storeSessionToken(response.access_token);
        setShopkeeper(response.shopkeeper);
        try {
          await gameplayApi.shop();
          router.replace("/dashboard");
        } catch (requestError) {
          if (requestError instanceof ApiRequestError && requestError.status === 404) {
            router.replace("/setup");
          } else {
            throw requestError;
          }
        }
      } else {
        const response = await authApi.requestPasswordReset(email);
        setMessage(response.message);
      }
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.errors?.length) {
        setError(requestError.errors.map((issue) => formatMiloMessage(issue.message)).join(" "));
      } else {
        setError(requestError instanceof Error ? formatMiloMessage(requestError.message) : "Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main id="main-content" className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full max-w-md rounded-[24px] border border-line bg-surface p-6 shadow-card sm:p-8">
      <div className="flex justify-center"><SmartDukaLogo /></div>
      <h1 className="mt-8 text-3xl font-bold tracking-tight">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{content.description}</p>
      <form className="mt-7 grid gap-4" onSubmit={submit} noValidate>
        {mode === "sign-up" && <label className="grid gap-2 text-sm font-semibold">Your name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} autoComplete="name" className="rounded-[14px] border border-line bg-canvas px-4 py-3 font-normal" /></label>}
        <label className="grid gap-2 text-sm font-semibold">Email address<input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" className="rounded-[14px] border border-line bg-canvas px-4 py-3 font-normal" /></label>
        {mode !== "forgot-password" && <PasswordField label="Password" value={password} onChange={setPassword} showPassword={showPassword} onToggle={() => setShowPassword((current) => !current)} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} helper="Use at least 6 characters." />}
        {mode === "sign-up" && <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} showPassword={showPassword} onToggle={() => setShowPassword((current) => !current)} autoComplete="new-password" error={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords do not match yet." : undefined} />}
        {error && <MiloAlert kind="error" message={error} />}
        {message && <MiloAlert kind="success" message={message} />}
        <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} disabled={isSubmitting} className="mt-2 rounded-[14px] bg-ink px-5 py-3 font-bold text-white disabled:opacity-50">{isSubmitting ? "Please wait…" : content.submit}</motion.button>
      </form>
      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-accent">
        {mode === "sign-in" && <><Link href="/sign-up">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></>}
        {mode === "sign-up" && <Link href="/sign-in">Already have an account? Sign in</Link>}
        {mode === "forgot-password" && <Link href="/sign-in">Back to sign in</Link>}
      </div>
    </motion.section>
  </main>;
}

function PasswordField({ label, value, onChange, showPassword, onToggle, autoComplete, helper, error }: { label: string; value: string; onChange: (value: string) => void; showPassword: boolean; onToggle: () => void; autoComplete: string; helper?: string; error?: string }) {
  const inputId = label.toLowerCase().replaceAll(" ", "-");
  return <label className="grid gap-2 text-sm font-semibold" htmlFor={inputId}>{label}<div className="relative"><input id={inputId} value={value} onChange={(event) => onChange(event.target.value)} required minLength={6} type={showPassword ? "text" : "password"} autoComplete={autoComplete} className="w-full rounded-[14px] border border-line bg-canvas px-4 py-3 pr-12 font-normal" aria-describedby={helper || error ? `${inputId}-help` : undefined} /><button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted" aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={showPassword}>{showPassword ? <ViewOffIcon size={20} color="currentColor" /> : <ViewIcon size={20} color="currentColor" />}</button></div>{(helper || error) && <span id={`${inputId}-help`} className={`text-xs font-normal ${error ? "text-red-700" : "text-muted"}`}>{error ?? helper}</span>}</label>;
}
