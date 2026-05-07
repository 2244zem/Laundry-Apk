"use client";

import React, { useState } from "react";

const ACCOUNTS = [
  { type: "Dana", number: "083823223372", icon: "D" },
  { type: "BCA", number: "4373160311", icon: "B" },
];

export default function PaymentInfo() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (number: string, type: string) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Informasi Pembayaran</h2>
        <p className="text-sm text-gray-500 mb-5">Transfer ke salah satu rekening berikut, lalu konfirmasi ke petugas.</p>

        <div className="space-y-3">
          {ACCOUNTS.map((acc) => (
            <div key={acc.type} className="flex items-center gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {acc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary-700 uppercase tracking-wider">{acc.type}</p>
                <p className="text-lg font-bold text-gray-900 font-mono tracking-wide">{acc.number}</p>
              </div>
              <button
                onClick={() => handleCopy(acc.number, acc.type)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                  copied === acc.type
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-white text-primary-700 border border-primary-200 hover:bg-primary-100"
                }`}
              >
                {copied === acc.type ? "Tersalin" : "Salin Nomor"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Panduan Pembayaran</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
            <span>Transfer sesuai total tagihan ke salah satu rekening di atas.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
            <span>Simpan bukti transfer sebagai konfirmasi pembayaran.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
            <span>Tunjukkan bukti transfer kepada petugas untuk verifikasi.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
