"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLoggedInUser, logout } from "@/lib/storage";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasNotif, setHasNotif] = useState(true);

  useEffect(() => {
    const u = getLoggedInUser();
    if (!u || u.role !== "admin") window.location.href = "/login";
    else setUser(u);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const nav = [
    { label: "Dashboard", path: "/admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { label: "Pesanan", path: "/admin/orders", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { label: "Chat", path: "/admin/chat", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
    { label: "Stok", path: "/admin/inventory", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
    { label: "Layanan", path: "/admin/pricelist", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];

  return (
    <div className="min-h-screen bg-bg transition-colors duration-300">
      {/* Sidebar (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white hidden lg:flex flex-col shadow-2xl z-50">
        <div className="p-8">
          <h1 className="text-xl font-black tracking-tight text-primary">UNGU LAUNDRY</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          {nav.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.path ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-red-500/20 hover:text-red-400 w-full transition-all">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="lg:hidden font-black text-primary tracking-tighter text-xl">UNGU</div>
          <div className="hidden lg:block text-xs font-bold uppercase tracking-widest text-muted">Admin Portal — {user.displayName}</div>
          
          <div className="flex items-center gap-3 md:gap-5">
            <ThemeToggle />
            <div className="relative p-2 text-muted hover:bg-primary/5 rounded-full cursor-pointer transition-colors" onClick={() => setHasNotif(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {hasNotif && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-card rounded-full animate-pulse"></span>}
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
              {user.displayName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-32 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-card/90 backdrop-blur-lg border-t border-border flex items-center justify-between px-3 py-3 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        {nav.map((item) => (
          <Link key={item.path} href={item.path} className={`flex-1 flex flex-col items-center gap-1 transition-all ${pathname === item.path ? 'text-primary scale-110' : 'text-muted opacity-50'}`}>
            <div className={`p-2 rounded-2xl ${pathname === item.path ? 'bg-primary/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="flex-1 flex flex-col items-center gap-1 text-muted opacity-50">
          <div className="p-2 rounded-2xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Keluar</span>
        </button>
      </nav>
    </div>
  );
}
