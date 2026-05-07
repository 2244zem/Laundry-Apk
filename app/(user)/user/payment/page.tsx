"use client";

import React, { useState } from "react";

const PAYMENT_METHODS = [
  {
    id: "dana",
    bank: "Dana",
    account: "083823223372",
    holder: "Ungu Laundry",
    color: "#1A73E8",
    accent: "#4195E8",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: "bca",
    bank: "BCA",
    account: "4373160311",
    holder: "Ungu Laundry",
    color: "#00529C",
    accent: "#1A6FBF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
];

function PaymentCard({ bank, account, holder, color, accent, icon }: typeof PAYMENT_METHODS[0]) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${color} 0%, ${accent} 100%)`,
      borderRadius: 16, padding: "20px 24px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <div style={{ position: "absolute", bottom: -20, right: 40, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

      <div className="relative z-10">
        {/* Bank header */}
        <div className="flex items-center justify-between mb-4">
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 10px" }}>
            {icon}
          </div>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.04em" }}>
            {bank}
          </span>
        </div>

        {/* Account number */}
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          Nomor Rekening
        </p>
        <p style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.06em", fontFamily: "monospace" }}>
          {account}
        </p>

        {/* Holder + Copy */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Atas Nama</p>
            <p style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 600 }}>{holder}</p>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8, padding: "8px 14px",
              color: "#fff", fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Tersalin
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Salin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserPaymentPage() {
  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Informasi Pembayaran</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Transfer manual ke salah satu rekening berikut</p>
      </div>

      <div className="space-y-4">
        {PAYMENT_METHODS.map((m) => (
          <PaymentCard key={m.id} {...m} />
        ))}
      </div>

      {/* Instructions */}
      <div className="card p-5 space-y-3">
        <p className="text-sm font-semibold">Petunjuk Pembayaran</p>
        {[
          "Transfer sesuai total tagihan yang tertera di struk pesanan.",
          "Sertakan nomor struk (misal: LND-20240101-0001) pada catatan transfer.",
          "Konfirmasi pembayaran via chat admin setelah melakukan transfer.",
          "Status pembayaran akan diperbarui oleh admin dalam 1x24 jam.",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "var(--primary-100)", color: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <p className="text-sm" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
