"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError("Connexion impossible. Vérifie ton email et ton mot de passe.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <span className="badge">FrontaBudget</span>
        <h1>Connexion</h1>
        <p className="auth-note">Retrouve ton budget et tes objectifs.</p>

        <form className="form" onSubmit={submit}>
          {error && <div className="error">{error}</div>}

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="auth-note" style={{ marginTop: 18 }}>
          <Link href="/auth/forgot-password">Mot de passe oublié ?</Link>
        </p>
        <p className="auth-note" style={{ marginTop: 10 }}>
          Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
        </p>
      </div>
    </main>
  );
}
