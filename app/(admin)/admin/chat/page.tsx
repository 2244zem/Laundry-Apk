"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { getAllConversations, getConversation, sendMessage, markConversationRead, formatDate } from "@/lib/storage";
import { ChatMessage } from "@/lib/types";

export default function AdminChatPage() {
  const [convos, setConvos] = useState<{ username: string; messages: ChatMessage[]; unread: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(true);

  const refresh = useCallback(() => {
    const all = getAllConversations();
    setConvos(all);
    if (selected) {
      const activeMessages = getConversation(selected);
      setMessages(prev => {
        if (prev.length !== activeMessages.length) return activeMessages;
        return prev;
      });
    }
  }, [selected]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (selected) {
      markConversationRead(selected, "admin");
      setMessages(getConversation(selected));
      if (window.innerWidth < 768) setView("chat");
    }
  }, [selected]);

  useEffect(() => {
    if (shouldScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShouldScroll(isAtBottom);
  };

  const handleSend = (imageUrl?: string) => {
    if (!input.trim() && !imageUrl) return;
    sendMessage(selected!, "admin", input.trim(), imageUrl);
    setInput("");
    setMessages(getConversation(selected!));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleSend(base64);
    };
    reader.readAsDataURL(file);
  };

  const filteredConvos = convos.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-[fadeIn_0.4s_ease-out] h-[calc(100vh-140px)] md:h-[calc(100vh-180px)]">
      <div className="flex flex-col md:flex-row h-full card overflow-hidden border-none md:border border-border bg-card">
        
        {/* Sidebar / Conversation List */}
        <div className={`w-full md:w-80 flex flex-col bg-card border-r border-border min-h-0 ${view === "chat" ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold tracking-tight text-primary">Pesan</h2>
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
            </div>
            
            <div className="relative group">
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama pelanggan..." 
                className="w-full bg-gray-100/80 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <svg className="absolute left-3.5 top-3 text-muted group-focus-within:text-primary transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvos.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted">Belum ada percakapan.</div>
            ) : (
              filteredConvos.map((c) => (
                <button
                  key={c.username}
                  onClick={() => setSelected(c.username)}
                  className={`w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-gray-50 border-b border-gray-50 ${selected === c.username ? "bg-primary-50 hover:bg-primary-50" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {c.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-bold text-sm truncate">{c.username}</p>
                      <span className="text-[10px] text-muted">
                        {c.messages.length > 0 ? new Date(c.messages[c.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted truncate max-w-[140px]">
                        {c.messages[c.messages.length - 1]?.message || (c.messages[c.messages.length - 1]?.imageUrl ? "📷 Foto" : "Belum ada pesan")}
                      </p>
                      {c.unread > 0 && (
                        <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-bg min-h-0 ${view === "list" ? "hidden md:flex" : "flex"}`}>
          {selected ? (
            <>
              {/* Header */}
              <div className="p-3 md:p-4 bg-white border-b border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView("list")} className="md:hidden p-1 -ml-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {selected[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selected}</p>
                    <p className="text-[10px] text-green-600 font-medium">Pelanggan Terverifikasi</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0" onScroll={handleScroll}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p className="text-xs mt-3">Mulai percakapan dengan {selected}</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.fromRole === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] ${m.fromRole === "admin" ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={m.fromRole === "admin" ? "chat-bubble-user" : "chat-bubble-admin"}>
                          {m.imageUrl && (
                            <div className="mb-2">
                              <img 
                                src={m.imageUrl} 
                                alt="Attachment" 
                                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(m.imageUrl, "_blank")}
                              />
                            </div>
                          )}
                          {m.message && <div>{m.message}</div>}
                        </div>
                        <p className="text-[10px] text-muted mt-1 px-1">
                          {formatDate(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-4 bg-white border-t border-border">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                  <label className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </label>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Tulis pesan Anda..."
                    className="input-field py-3 text-sm rounded-xl"
                  />
                  <button 
                    onClick={() => handleSend()} 
                    className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted animate-[fadeIn_0.5s_ease-out]">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p className="text-sm font-medium">Pilih percakapan untuk dibalas</p>
              <p className="text-xs mt-1">Chat pelanggan akan muncul di panel kiri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
