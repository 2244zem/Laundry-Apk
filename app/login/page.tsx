"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccess("Pendaftaran berhasil! Silakan masuk.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const user = await login(username.trim().toLowerCase(), password);
      if (user) {
        router.replace(user.role === "admin" ? "/admin" : "/user");
      } else {
        setError("Username atau password tidak valid.");
        setLoading(false);
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(145deg, #4C1D95 0%, #6d28d9 60%, #7c3aed 100%)" }}
    >
      <div className="w-full max-w-sm relative z-10 animate-[scaleIn_0.3s_ease-out]">
        <div className="text-center mb-8">
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M9 18c0 1.5 1 2.5 3 2.5s3-1 3-2.5-1-2.5-3-2.5" />
              <circle cx="12" cy="4" r="1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ungu Laundry</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Platform Manajemen Laundry
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card p-6 space-y-4"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {success && (
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#059669" }}>
              {success}
            </div>
          )}

          <div>
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="input-field"
              autoFocus
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="input-field"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Belum punya akun?{" "}
              <Link href="/signup" className="font-semibold" style={{ color: "var(--primary)" }}>
                Daftar sekarang
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          &copy; {new Date().getFullYear()} Ungu Laundry. All rights reserved.
        </p>
      </div>
    </div>
  );
}
