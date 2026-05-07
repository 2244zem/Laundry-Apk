"use client";

import React, { useState, useEffect } from "react";
import { getLoggedInUser, getAchievement } from "@/lib/storage";
import { Achievement, ACHIEVEMENT_THRESHOLDS } from "@/lib/types";

const LEVEL_LABELS = { none: "—", bronze: "Bronze", silver: "Silver", gold: "Gold" };
const LEVEL_DESC = {
  none: "Buat pesanan pertamamu untuk mendapatkan badge!",
  bronze: "Pelanggan setia! Lanjutkan untuk naik ke Silver.",
  silver: "Pelanggan terpercaya! Hampir Gold.",
  gold: "Pelanggan Gold — terima kasih atas kepercayaan Anda!",
};

export default function UserProfilePage() {
  const [user, setUser] = useState<{ username: string; displayName: string; role: string } | null>(null);
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const u = getLoggedInUser();
    if (u) {
      setUser(u);
      setAchievement(getAchievement(u.username));
    }
  }, []);

  if (!user || !achievement) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const progressPct = () => {
    if (achievement.level === "gold") return 100;
    const currentTotal = achievement.totalOrders;
    
    if (achievement.level === "none") {
      return Math.min(100, (currentTotal / ACHIEVEMENT_THRESHOLDS.bronze) * 100);
    }
    
    const thresholds: Record<string, number> = {
      bronze: ACHIEVEMENT_THRESHOLDS.silver,
      silver: ACHIEVEMENT_THRESHOLDS.gold,
    };
    const starts: Record<string, number> = {
      bronze: ACHIEVEMENT_THRESHOLDS.bronze,
      silver: ACHIEVEMENT_THRESHOLDS.silver,
    };
    
    const start = starts[achievement.level as string] || 0;
    const end = thresholds[achievement.level as string] || 1;
    return Math.min(100, ((currentTotal - start) / (end - start)) * 100);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-black tracking-tight text-primary">PROFIL SAYA</h1>
        <p className="text-xs text-muted uppercase tracking-widest font-bold mt-1">Kelola akun dan pencapaian Anda</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        <div className="w-20 h-20 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-primary/30 mb-4 transform rotate-3">
          {user.displayName[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-sm text-muted font-medium">@{user.username}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Member {user.role}</span>
          </div>
        </div>
      </div>

      {/* Achievement */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-widest text-primary">Loyalty & Achievement</p>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
        </div>

        {/* Badge & Level */}
        <div className="flex items-center gap-5 p-4 rounded-2xl bg-bg border border-border/50">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
            achievement.level === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-orange-600' :
            achievement.level === 'silver' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
            achievement.level === 'bronze' ? 'bg-gradient-to-br from-orange-400 to-red-600' :
            'bg-gray-200 dark:bg-gray-700'
          }`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M8.003 14.5a5 5 0 0 1 7.994 0"/><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="M12 22v-2"/><path d="m19.07 19.07-1.41-1.41"/><path d="M22 12h-2"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-muted uppercase tracking-widest mb-1">Status Saat Ini</p>
            <h3 className={`text-lg font-black uppercase tracking-tighter ${
              achievement.level === 'none' ? 'text-muted' : 'text-primary'
            }`}>
              {LEVEL_LABELS[achievement.level as keyof typeof LEVEL_LABELS] || 'Tanpa Badge'}
            </h3>
            <p className="text-[10px] text-muted font-medium leading-relaxed mt-1">
              {LEVEL_DESC[achievement.level as keyof typeof LEVEL_DESC]}
            </p>
          </div>
        </div>

        {/* Progress */}
        {achievement.level !== "gold" && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Progress Berikutnya</p>
                <p className="text-xs font-bold">{achievement.ordersToNext} Pesanan Lagi ke {achievement.nextLevel ? LEVEL_LABELS[achievement.nextLevel] : ""}</p>
              </div>
              <span className="text-xs font-black text-primary">{Math.round(progressPct())}%</span>
            </div>
            <div className="h-3 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/5">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                style={{ width: `${progressPct()}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/5 text-center">
            <p className="text-2xl font-black text-primary">{achievement.totalOrders}</p>
            <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Total Order</p>
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/5 text-center">
            <p className="text-2xl font-black text-primary">0</p>
            <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Point Reward</p>
          </div>
        </div>

        {/* Tier Guide */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">Panduan Level Keanggotaan</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { level: "bronze", min: 1 },
              { level: "silver", min: 5 },
              { level: "gold", min: 15 },
            ].map((tier) => (
              <div key={tier.level} className="flex items-center justify-between p-2 rounded-xl hover:bg-primary/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tier.level === 'gold' ? 'bg-yellow-500' : tier.level === 'silver' ? 'bg-slate-400' : 'bg-orange-600'
                  }`}></div>
                  <span className="text-xs font-bold">{LEVEL_LABELS[tier.level as keyof typeof LEVEL_LABELS]}</span>
                </div>
                <span className="text-[10px] text-muted font-bold group-hover:text-primary transition-colors">{tier.min}+ Pesanan</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
