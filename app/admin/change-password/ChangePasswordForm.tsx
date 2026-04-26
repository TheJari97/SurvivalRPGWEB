"use client";

import { FormEvent, useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "No se pudo cambiar la contrasena.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <h3>Cambiar contrasena</h3>
      <label className="field">
        <span>Contrasena actual</span>
        <input
          autoComplete="current-password"
          className="input"
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          type="password"
          value={currentPassword}
        />
      </label>
      <label className="field">
        <span>Nueva contrasena</span>
        <input
          autoComplete="new-password"
          className="input"
          onChange={(event) => setNewPassword(event.target.value)}
          required
          type="password"
          value={newPassword}
        />
      </label>
      <label className="field">
        <span>Confirmar nueva contrasena</span>
        <input
          autoComplete="new-password"
          className="input"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>
      <p className="form-note">
        Minimo 12 caracteres con mayuscula, minuscula, numero y simbolo.
      </p>
      {error ? <p className="alert">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Guardando..." : "Guardar nueva contrasena"}
      </button>
    </form>
  );
}
