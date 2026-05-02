import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authState";
import { getErrorMessage } from "../utils/errorMessage";
import { getStoredTheme, getThemeStyle } from "../utils/theme";

type LocationState = {
  message?: string;
  from?: { pathname?: string };
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigate(state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      footer={
        <>
          Need an account?{" "}
          <Link className="font-semibold text-[#FF7A1A]" to="/register">
            Create one
          </Link>
        </>
      }
      subtitle="Use your username and password to continue."
      title="Sign in to your portfolio"
    >
      {state?.message ? (
        <p className="rounded-[2px] bg-[#00B37A]/10 px-4 py-3 text-sm text-[#00B37A]">
          {state.message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[2px] bg-[#E34855]/10 px-4 py-3 text-sm text-[#E34855]">
          {error}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          autoComplete="username"
          label="Username"
          onChange={setUsername}
          value={username}
        />
        <FormField
          autoComplete="current-password"
          label="Password"
          onChange={setPassword}
          type="password"
          value={password}
        />
        <button
          className="w-full rounded-[2px] bg-[#FF7A1A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ff8f3d] disabled:cursor-not-allowed disabled:bg-[#687284]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthPageShell>
  );
}

function AuthPageShell({
  children,
  footer,
  subtitle,
  title,
}: {
  children: ReactNode;
  footer: ReactNode;
  subtitle: string;
  title: string;
}) {
  const theme = getStoredTheme();

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-(--app-bg) px-6 py-12 text-(--text-secondary)"
      data-testid="auth-shell"
      data-theme={theme}
      style={getThemeStyle(theme)}
    >
      <section className="w-full max-w-md rounded-[2px] border border-(--border-soft) bg-(--panel-bg) p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF7A1A]">
          Portfolio Dashboard
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-(--text-primary)">
          {title}
        </h1>
        <p className="mt-2 text-sm text-(--text-muted)">{subtitle}</p>
        <div className="mt-8 space-y-4">{children}</div>
        <p className="mt-6 text-center text-sm text-(--text-muted)">{footer}</p>
      </section>
    </main>
  );
}

function FormField({
  autoComplete,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
      {label}
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-[2px] bg-(--panel-alt) px-4 py-3 text-(--text-primary) outline-none transition placeholder:text-(--text-subtle) focus:ring-1 focus:ring-[#FF7A1A]"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
