"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, AlertTriangle, Sparkles } from "lucide-react";
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
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[520px] shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            FULL-DUPLEX CONVERSATION TRANSCRIPT
          </span>
        </div>
        
        {/* Instant Interruption Button */}
        {isSpeaking && (
          <button
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-mono font-semibold animate-pulse hover:bg-rose-500/30 transition-colors shadow-lg shadow-rose-500/20"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            INTERRUPT RIME
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Bot className="h-10 w-10 text-slate-700 mb-2" />
            <p className="text-xs font-mono text-slate-400">SESSION INITIALIZED</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Speak or pick a demo scenario below to test full-duplex interruption and task version fencing.
            </p>
          </div>
        ) : (
          turns.map((turn, i) => {
            const isUser = turn.role === "user";
            return (
              <div
                key={turn.turn_id || i}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-xs shadow-md border ${
                    isUser
                      ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-100 rounded-tr-none"
                      : "bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">
                      {isUser ? "USER" : "SENTINEL (RIME)"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {turn.task_version && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800/80 text-cyan-400 border border-slate-700">
                          v{turn.task_version}
                        </span>
                      )}
                      {turn.interrupted && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          INTERRUPT
                        </span>
                      )}
                      {turn.language_detected && turn.language_detected !== "en" && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {turn.language_detected}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <p className="leading-relaxed whitespace-pre-wrap">{turn.content}</p>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Scenario Triggers */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
        <span className="text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-cyan-400" /> Demo:
        </span>
        <button
          onClick={() => onSendMessage("Find the fastest route from Coimbatore to Chennai.")}
          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap"
        >
          1. Coimbatore → Chennai (v1)
        </button>
        <button
          onClick={() => onSendMessage("Wait! Don't use highways. I want the cheapest route.")}
          className="px-2.5 py-1 rounded bg-rose-950/30 border border-rose-900/60 hover:border-rose-500/50 text-rose-300 transition-colors whitespace-nowrap"
        >
          2. Interrupt: No Highways (v2)
        </button>
        <button
          onClick={() => onSendMessage("Chennai-ku fastest route find pannu, but highway avoid pannanum.")}
          className="px-2.5 py-1 rounded bg-purple-950/30 border border-purple-900/60 hover:border-purple-500/50 text-purple-300 transition-colors whitespace-nowrap"
        >
          3. Tanglish Code-Switching
        </button>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak or type instruction (e.g. 'Wait, find cheapest route without tolls')..."
          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
        >
          <span>Send</span>
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
