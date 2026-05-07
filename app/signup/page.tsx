"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/storage";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!form.username || !form.email || !form.password || !form.displayName) {
      setError("Semua field wajib diisi.");
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Format email tidak valid.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const result = await register(form.username, form.email, form.password, form.displayName);
      if (result.success) {
        setStep("verify");
      } else {
        setError(result.error || "Gagal mendaftar.");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulated verification logic
    setTimeout(() => {
      if (verifyCode === "123456") {
        router.replace("/login?registered=true");
      } else {
        setError("Kode verifikasi salah. Coba 123456.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(145deg, #4C1D95 0%, #6d28d9 60%, #7c3aed 100%)" }}
    >
      <div className="w-full max-w-sm relative z-10 animate-[scaleIn_0.3s_ease-out]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {step === "form" ? "Daftar Akun" : "Verifikasi Email"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {step === "form" 
              ? "Mulai kelola laundry Anda hari ini" 
              : `Masukkan kode yang dikirim ke ${form.email}`}
          </p>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div>
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Contoh: Budi Santoso"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                placeholder="Masukkan username"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@contoh.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="form-label">Konfirmasi Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Ulangi password"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold" style={{ color: "var(--primary)" }}>
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="card p-6 space-y-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div>
              <label className="form-label text-center mb-4">Kode Verifikasi (6 Digit)</label>
              <input
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                required
                autoFocus
              />
              <p className="text-[10px] text-center mt-2" style={{ color: "var(--muted)" }}>
                Gunakan kode simulasi: <span className="font-bold">123456</span>
              </p>
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Memverifikasi..." : "Verifikasi Akun"}
            </button>

            <button 
              type="button" 
              onClick={() => setStep("form")} 
              className="btn-ghost w-full text-xs"
            >
              Kembali ke Pendaftaran
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
