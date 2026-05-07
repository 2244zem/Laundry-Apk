"use client";

import React, { useState, useEffect, useRef } from "react";
import { getLoggedInUser, getConversation, sendMessage, markConversationRead, formatDate } from "@/lib/storage";
import { ChatMessage } from "@/lib/types";

export default function UserChatPage() {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(true);

  const refresh = React.useCallback(() => {
    if (username) {
      const msgs = getConversation(username);
      setMessages(prev => {
        if (prev.length !== msgs.length) return msgs;
        return prev;
      });
      markConversationRead(username, "user");
    }
  }, [username]);

  useEffect(() => {
    const u = getLoggedInUser();
    if (!u) return;
    setUsername(u.username);
  }, []);

  useEffect(() => {
    if (username) {
      refresh();
      const interval = setInterval(refresh, 4000);
      return () => clearInterval(interval);
    }
  }, [username, refresh]);

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
    sendMessage(username, "user", input.trim(), imageUrl);
    setMessages(getConversation(username));
    setInput("");
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

  return (
    <div className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Chat Admin</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Tanyakan seputar pesanan atau layanan</p>
      </div>

      <div className="card overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Belum ada percakapan.</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Mulai chat untuk bertanya kepada admin.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromRole === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${m.fromRole === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {m.fromRole === "admin" && (
                    <p className="text-[10px] mb-1 font-bold uppercase tracking-wider text-primary">Admin</p>
                  )}
                  <div className={m.fromRole === "user" ? "chat-bubble-user" : "chat-bubble-admin"}>
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
                  <p className="text-[10px] mt-1 text-muted px-1">
                    {formatDate(m.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 bg-white border-t border-border flex items-center gap-2">
          <label className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors flex-shrink-0">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tulis pesan..."
            className="input-field py-2.5 md:py-3 text-sm rounded-xl"
          />
          <button 
            onClick={() => handleSend()} 
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
