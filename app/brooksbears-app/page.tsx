"use client";

import { Mic, Phone, Keyboard } from "lucide-react";
import Image from "next/image";

const messages = [
  {
    id: 1,
    sender: "bear",
    text: "Hi friend! I missed you. Want to hear a story or play a game?",
    time: "9:41 AM",
  },
  {
    id: 2,
    sender: "user",
    text: "Let\'s hear the story about the starlit forest!",
    time: "9:42 AM",
  },
  {
    id: 3,
    sender: "bear",
    text: "Once upon a time, a tiny bear found a glowing path that sang like crickets...",
    time: "9:42 AM",
  },
];

export default function BrooksBearsAppPage() {
  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#140d12] via-[#1a0f16] to-[#120c16] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#140d12]/90 px-6 py-4 backdrop-blur">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">/BrooksBears/</p>
          <h1 className="font-pixel text-lg text-white">Benjamin Bear</h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white/10">
            <Image
              src="/icons/brooksbears-appicon.png"
              alt="Benjamin Bear"
              fill
              className="object-cover"
              sizes="40px"
              priority
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Benjamin</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Listening
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] space-y-2 rounded-3xl px-5 py-4 text-sm shadow-lg ${
                  message.sender === "user"
                    ? "bg-[#3a2533] text-white"
                    : "bg-white/10 text-white/90"
                }`}
              >
                <p>{message.text}</p>
                <p
                  className={`text-xs ${
                    message.sender === "user" ? "text-white/60" : "text-white/50"
                  }`}
                >
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="border-t border-white/10 bg-[#140d12]/95 px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-3 text-white/60">
            <Keyboard className="h-5 w-5" />
            <span className="text-sm">Type a message...</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              type="button"
              aria-label="Start voice message"
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a2533] text-white transition hover:bg-[#4a3141]"
              type="button"
              aria-label="Start call"
            >
              <Phone className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <nav className="border-t border-white/10 bg-[#120c16] px-6 py-3">
        <div className="flex items-center justify-around">
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-sm font-semibold text-white"
          >
            <span className="h-1.5 w-6 rounded-full bg-emerald-400" />
            Chat
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-sm font-semibold text-white/50"
          >
            <span className="h-1.5 w-6 rounded-full bg-transparent" />
            History
          </button>
        </div>
      </nav>
    </div>
  );
}
