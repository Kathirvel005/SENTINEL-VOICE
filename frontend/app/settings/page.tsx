"use client";

import { useState, useEffect } from "react";
import { TopNav } from "../../components/TopNav";
import { useVoiceSession } from "../../hooks/useVoiceSession";
import { Settings, Sparkles, Sliders, Cpu, Save, CheckCircle2 } from "lucide-react";
import { RimeConfig } from "../../types";

export default function SettingsPage() {
  const { isConnected, isStressMode, toggleStressMode } = useVoiceSession();
  const [rimeConfig, setRimeConfig] = useState<RimeConfig>({
    provider: "Rime TTS",
    model: "mist",
    speaker: "amber",
    language: "en",
    endpoint: "https://users.rime.ai/v1/rime-tts",
    audio_format: "wav",
    sample_rate: 22050,
    transport: "http_chunked",
    is_live_connected: false,
    mode: "DEVELOPMENT_FALLBACK_SYNTHESIZER",
  });

  const [toolDelay, setToolDelay] = useState<number>(3500);
  const [vadThreshold, setVadThreshold] = useState<number>(0.65);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.rime) setRimeConfig(data.rime);
          if (data.default_tool_delay_ms) setToolDelay(data.default_tool_delay_ms);
          if (data.default_interruption_threshold) setVadThreshold(data.default_interruption_threshold);
        }
      } catch (err) {
        // Backend offline
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      await fetch(`${backendUrl}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "global",
          is_stress_mode: isStressMode,
          tool_delay_ms: toolDelay,
          interruption_threshold: vadThreshold,
          rime_speaker: rimeConfig.speaker,
          rime_model: rimeConfig.model,
        }),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <TopNav
        isConnected={isConnected}
        isStressMode={isStressMode}
        onToggleStressMode={toggleStressMode}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-cyan-400" />
          <h1 className="text-xl font-bold font-mono tracking-wider text-slate-100">
            SYSTEM & PROVIDER CONFIGURATION
          </h1>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Configuration updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Rime TTS Section */}
          <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <h2 className="text-xs font-mono font-bold text-slate-200 uppercase">
                  RIME TTS CONFIGURATION
                </h2>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                rimeConfig.is_live_connected 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-orange-500/20 text-orange-300 border-orange-500/40"
              }`}>
                {rimeConfig.mode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Rime Neural Model</label>
                <select
                  value={rimeConfig.model}
                  onChange={(e) => setRimeConfig({ ...rimeConfig, model: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="mist">mist (Low-latency conversational)</option>
                  <option value="arcana">arcana (Expressive neural)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Speaker Voice / Persona</label>
                <select
                  value={rimeConfig.speaker}
                  onChange={(e) => setRimeConfig({ ...rimeConfig, speaker: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="neerja">neerja (Indian English / Tanglish)</option>
                  <option value="pallavi">pallavi (Tamil Native Neural)</option>
                  <option value="prabhat">prabhat (Indian Male Authoritative)</option>
                  <option value="aria">aria (US Studio Neural)</option>
                  <option value="andrew">andrew (US Multilingual Neural)</option>
                  <option value="amber">amber (Rime AI Studio Neural)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Audio Format</label>
                <input
                  type="text"
                  readOnly
                  value="WAV / PCM 16-bit Mono (22050 Hz)"
                  className="w-full p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rime API Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value={rimeConfig.endpoint}
                  className="w-full p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Engine Parameters Section */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold text-slate-200 uppercase">
                ENGINE TIMING & INTERRUPT THRESHOLDS
              </h2>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Simulated Tool Delay: {toolDelay} ms</span>
                  <span className="text-slate-500">{isStressMode ? "STRESS ACTIVE (7500ms)" : "NORMAL (3500ms)"}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={10000}
                  step={500}
                  value={toolDelay}
                  onChange={(e) => setToolDelay(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Confidence-Aware VAD Interruption Threshold: {vadThreshold}</span>
                  <span className="text-slate-500">Higher = fewer false interruptions</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={0.9}
                  step={0.05}
                  value={vadThreshold}
                  onChange={(e) => setVadThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-600/20"
          >
            <Save className="h-4 w-4" />
            <span>SAVE CONFIGURATION</span>
          </button>
        </form>
      </main>
    </div>
  );
}
