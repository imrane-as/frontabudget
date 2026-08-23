"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    const origin = window.location.origin;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: { full_name: fullName }
      }
    });

    if (error) {
      setError(
        "Inscription impossible. Vérifie les informations ou réessaie plus tard."
      );
      setLoading(false);
      return;
    }

    setMessage("Compte créé. Vérifie ton email pour confirmer ton inscription.");
    setLoading(false);
  }

  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <Link href="/" className="auth-brand"><BrandLogo /></Link>
        <span className="badge">Compte gratuit</span>
        <h1>Créer mon compte</h1>

        <form className="form" onSubmit={submit}>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <label>
            Nom
            <input
              required
              autoComplete="name"
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

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
              autoComplete="new-password"
              minLength={12}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-note" style={{ marginTop: 18 }}>
          Déjà inscrit ? <Link href="/login">Connexion</Link>
        </p>
      </div>
    </main>
  );
}
