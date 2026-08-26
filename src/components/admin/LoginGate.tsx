"use client";

import { useState, type ReactNode } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { adminApi, AdminApiError, isBackendConfigured } from "@/lib/admin/client";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { GlassButton } from "@/components/glass/GlassButton";
import { BackendRequired } from "./BackendRequired";

export function LoginGate({ children }: { children: ReactNode }) {
  const { tokens, setTokens, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isBackendConfigured) return <BackendRequired />;
  if (tokens && isAuthenticated()) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setTokens(await adminApi.login(email, password));
    } catch (err) {
      // The API answers identically for unknown email and wrong password;
      // surfacing anything more specific here would undo that.
      setError(
        err instanceof AdminApiError && err.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "Those credentials were not accepted.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[70dvh] place-items-center px-4">
      <GlassSurface className="w-full max-w-sm p-6">
        <h1 className="text-xl font-bold tracking-tight">Personel Girişi</h1>
        <p className="mt-1 mb-5 text-sm text-[var(--ink-muted)]">MiST Café operations</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            autoComplete="username"
            required
            className="glass w-full rounded-[var(--radius-card)] px-3.5 py-2.5 text-sm outline-none placeholder:text-[var(--ink-faint)]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            autoComplete="current-password"
            required
            className="glass w-full rounded-[var(--radius-card)] px-3.5 py-2.5 text-sm outline-none placeholder:text-[var(--ink-faint)]"
          />

          {error && (
            <p className="flex items-start gap-2 text-xs text-red-500">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <GlassButton
            type="submit"
            variant="accent"
            size="lg"
            className="w-full gap-2"
            disabled={busy}
          >
            <LogIn className="size-4" />
            {busy ? "…" : "Giriş"}
          </GlassButton>
        </form>
      </GlassSurface>
    </div>
  );
}
