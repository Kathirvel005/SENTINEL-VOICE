"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, AlertTriangle, Sparkles, Volume2 } from "lucide-react";
import { ConversationTurn } from "../types";

interface ConversationPanelProps {
  turns: ConversationTurn[];
  onSendMessage: (text: string) => void;
  onInterrupt: () => void;
  isSpeaking: boolean;
}

export function ConversationPanel({
  turns,
  onSendMessage,
  onInterrupt,
  isSpeaking,
}: ConversationPanelProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="studio-glass rounded-2xl border border-slate-800/90 flex flex-col h-[560px] shadow-2xl overflow-hidden">
      {/* Top Console Bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </div>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            NEURAL TRANSCRIPT STREAM
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            ({turns.length} TURNS)
          </span>
        </div>
        
        {/* Instant Interruption Button */}
        {isSpeaking && (
          <button
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs font-mono font-bold animate-pulse hover:bg-rose-500/30 transition-all shadow-lg shadow-rose-500/25"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>HALT RIME (ESC)</span>
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
              <Bot className="h-7 w-7 text-cyan-400/70" />
            </div>
            <p className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
              DUAL-STREAM ENGINE READY
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1.5 leading-relaxed font-mono">
              Speak or select a quick benchmark scenario below. Say something mid-sentence to test &lt;15ms zero-stale speech cutoff.
            </p>
          </div>
        ) : (
          turns.map((turn, i) => {
            const isUser = turn.role === "user";
            return (
              <div
                key={turn.turn_id || i}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 shadow-md shadow-cyan-600/20 border border-cyan-400/30">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-2xl p-3.5 text-xs shadow-lg transition-all border ${
                    isUser
                      ? "bg-gradient-to-br from-cyan-950/50 to-blue-950/40 border-cyan-500/30 text-cyan-100 rounded-tr-none"
                      : "bg-slate-900/95 border-slate-800 text-slate-200 rounded-tl-none hover:border-slate-700"
                  }`}
                >
                  {/* Message Meta Header */}
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-slate-800/60">
                    <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      {isUser ? "USER" : "SENTINEL // RIME"}
                      {!isUser && isSpeaking && i === turns.length - 1 && (
                        <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {turn.task_version && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-400 border border-cyan-500/30 font-bold">
                          v{turn.task_version}
                        </span>
                      )}
                      {turn.interrupted && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-300 border border-rose-500/50 font-bold animate-pulse">
                          ⚡ INTERRUPTED
                        </span>
                      )}
                      {turn.language_detected && turn.language_detected !== "en" && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {turn.language_detected}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <p className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                    {turn.content}
                  </p>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Scenario Triggers */}
      <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/70 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
        <span className="text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-cyan-400" /> Quick:
        </span>
        <button
          onClick={() => onSendMessage("Find the fastest route from Coimbatore to Chennai.")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap shadow-sm"
        >
          1. Coimbatore → Chennai (v1)
        </button>
        <button
          onClick={() => onSendMessage("Wait! Don't use highways. I want the cheapest route.")}
          className="px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/60 hover:border-rose-500/50 text-rose-300 transition-colors whitespace-nowrap shadow-sm"
        >
          2. Interrupt: No Highways (v2)
        </button>
        <button
          onClick={() => onSendMessage("Chennai-ku fastest route find pannu, but highway avoid pannanum.")}
          className="px-2.5 py-1 rounded-lg bg-purple-950/30 border border-purple-900/60 hover:border-purple-500/50 text-purple-300 transition-colors whitespace-nowrap shadow-sm"
        >
          3. Tanglish Code-Switching
        </button>
      </div>

      {/* Input Dock */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950/90 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak or type (e.g., 'Stop, find cheapest route avoiding tolls')..."
          className="flex-1 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/25 cursor-pointer shrink-0"
        >
          <span>TRANSMIT</span>
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
