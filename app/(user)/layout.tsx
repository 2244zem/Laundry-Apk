"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getLoggedInUser, logout, getStoreProfile } from "@/lib/storage";
import ThemeToggle from "@/components/ThemeToggle";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [storeName, setStoreName] = useState("Ungu Laundry");

  useEffect(() => {
    const u = getLoggedInUser();
    if (!u) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
    setStoreName(getStoreProfile().name);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const nav = [
    { label: "Pesan", path: "/user", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> },
    { label: "Riwayat", path: "/user/orders", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg> },
    { label: "Chat", path: "/user/chat", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { label: "Bayar", path: "/user/payment", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg> },
    { label: "Profil", path: "/user/profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-bg transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M3 12h18M9 18c0 1.5 1 2.5 3 2.5s3-1 3-2.5" /></svg>
          </div>
          <span className="font-black text-primary tracking-tighter text-lg uppercase">{storeName}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center font-black text-xs">
            {user.displayName[0]}
          </div>
          <button onClick={handleLogout} className="text-muted hover:text-red-500 transition-colors p-1" title="Keluar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 pb-32">
        {children}
      </main>

      {/* Premium Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border flex items-center justify-between px-3 py-3 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {nav.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${pathname === item.path ? 'text-primary scale-110' : 'text-muted opacity-50'}`}
          >
            <div className={`p-2 rounded-2xl transition-colors ${pathname === item.path ? 'bg-primary/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
