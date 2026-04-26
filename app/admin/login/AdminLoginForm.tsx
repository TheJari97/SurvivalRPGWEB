"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; mustChangePassword?: boolean };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "No se pudo iniciar sesion.");
        return;
      }

      window.location.href = result.mustChangePassword ? "/admin/change-password" : "/admin";
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <h3>Login admin</h3>
      <label className="field">
        <span>Usuario</span>
        <input
          autoComplete="username"
          className="input"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          required
          type="text"
          value={username}
        />
      </label>
      <label className="field">
        <span>Contrasena</span>
        <input
          autoComplete="current-password"
          className="input"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="alert">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Validando..." : "Entrar"}
      </button>
    </form>
  );
}
