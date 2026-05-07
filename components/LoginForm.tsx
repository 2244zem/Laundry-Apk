"use client";

import React, { useState } from "react";
import { AppUser } from "@/lib/types";
import { login } from "@/lib/storage";

interface LoginFormProps {
  onLogin: (user: AppUser) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(username.trim().toLowerCase(), password);
      if (user) {
        onLogin(user);
      } else {
        setError("Username atau password salah.");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #4C1D95 0%, #7c3aed 100%)" }}>
      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 7V4a2 2 0 1 1 4 0" />
              <path d="m2 16 10-9 10 9" />
              <path d="M2 16v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ungu Laundry</h1>
          <p className="text-sm text-white/60 mt-1">Masuk untuk melanjutkan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="input-field"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="input-field"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

