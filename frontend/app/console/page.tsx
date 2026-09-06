"use client";

import { useState } from "react";
import { TopNav } from "../../components/TopNav";
import { VoiceOrb } from "../../components/VoiceOrb";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { ConversationPanel } from "../../components/ConversationPanel";
import { TaskVersionVisualizer } from "../../components/TaskVersionVisualizer";
import { SystemStatePanel } from "../../components/SystemStatePanel";
import { EventTimeline } from "../../components/EventTimeline";
import { MetricsBar } from "../../components/MetricsBar";
import { TruthGraphModal } from "../../components/TruthGraphModal";
import { useVoiceSession } from "../../hooks/useVoiceSession";
import { Video, Sparkles, Mic, Radio, Sliders, AlertTriangle, Play } from "lucide-react";
import { TaskVersionRecord } from "../../types";

export default function ConsolePage() {
  const {
    orbState,
    activeTask,
    turns,
    events,
    metrics,
    isStressMode,
    isConnected,
    currentLanguage,
    staleAlert,
    selectedVoice,
    setSelectedVoice,
    speechRate,
    setSpeechRate,
    isHandsFree,
    toggleHandsFree,
    sendUtterance,
    triggerInterrupt,
    toggleStressMode,
    startListening,
    audioPlayer,
  } = useVoiceSession();

  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);
  const [selectedVersionForModal, setSelectedVersionForModal] = useState<TaskVersionRecord | null>(null);
  const [showAudioControls, setShowAudioControls] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(1.0);
  const [vocalClarity, setVocalClarity] = useState<number>(3.0);

  const handleVolumeChange = (v: number) => {
    setAudioVolume(v);
    audioPlayer?.setVolume(v);
  };

  const handleClarityChange = (c: number) => {
    setVocalClarity(c);
    audioPlayer?.setEqualizer(2.0, c, 1.5);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-cyan-500/30">
      {/* Studio Header */}
      <TopNav
        isConnected={isConnected}
        isStressMode={isStressMode}
        onToggleStressMode={toggleStressMode}
      />

      {/* Main Studio Cockpit */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 flex flex-col gap-4">
        {/* Top Control Bar: Master Voice Controls, Personas, Speeds, and DSP */}
        <div className="studio-glass rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start Voice Mic Button */}
            <button
              onClick={startListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-lg cursor-pointer ${
                orbState === "LISTENING"
                  ? "bg-cyan-500 text-slate-950 border border-cyan-300 animate-pulse shadow-cyan-500/40"
                  : "bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 border border-cyan-400/30"
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>{orbState === "LISTENING" ? "LISTENING (MIC LIVE)..." : "START VOICE (MIC)"}</span>
            </button>

            {/* Hands-Free Full-Duplex Toggle */}
            <button
              onClick={toggleHandsFree}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border shadow-sm cursor-pointer ${
                isHandsFree
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20 animate-pulse"
                  : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Radio className={`h-4 w-4 ${isHandsFree ? "text-emerald-400 animate-spin" : "text-slate-500"}`} />
              <span>{isHandsFree ? "HANDS-FREE DUPLEX (ON)" : "HANDS-FREE DUPLEX"}</span>
            </button>

            {/* Voice Persona Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 text-[11px] font-bold">VOICE:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="neerja" className="bg-slate-900 text-slate-200">Neerja (Indian English / Tanglish)</option>
                <option value="pallavi" className="bg-slate-900 text-slate-200">Pallavi (Tamil Neural)</option>
                <option value="prabhat" className="bg-slate-900 text-slate-200">Prabhat (Indian Male)</option>
                <option value="aria" className="bg-slate-900 text-slate-200">Aria (US Studio Neural)</option>
                <option value="andrew" className="bg-slate-900 text-slate-200">Andrew (US Multilingual)</option>
                <option value="amber" className="bg-slate-900 text-slate-200">Amber (Rime AI Studio)</option>
              </select>
            </div>

            {/* Playback Rate Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 text-[11px] font-bold">RATE:</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="-10%" className="bg-slate-900 text-slate-200">0.9x</option>
                <option value="+0%" className="bg-slate-900 text-slate-200">1.0x (Normal)</option>
                <option value="+5%" className="bg-slate-900 text-slate-200">1.05x (Crisp)</option>
                <option value="+12%" className="bg-slate-900 text-slate-200">1.15x (Fast)</option>
              </select>
            </div>

            {/* Emergency Interruption Paddle */}
            {orbState === "SPEAKING" && (
              <button
                onClick={() => triggerInterrupt("User pressed manual interrupt paddle")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-extrabold animate-pulse shadow-lg shadow-rose-600/35 border border-rose-400 cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>INTERRUPT RIME (&lt;12ms)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Audio DSP Expander Toggle */}
            <button
              onClick={() => setShowAudioControls(!showAudioControls)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                showAudioControls
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm"
                  : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>AUDIO DSP</span>
            </button>

            {/* Recording Mode Switch */}
            <button
              onClick={() => setIsRecordingMode(!isRecordingMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                isRecordingMode
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/20"
                  : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Video className="h-3.5 w-3.5 text-purple-400" />
              <span>{isRecordingMode ? "RECORD MODE (ON)" : "RECORD"}</span>
            </button>
          </div>
        </div>

        {/* Audio DSP Mastering Rack (Collapsible) */}
        {showAudioControls && (
          <div className="studio-glass rounded-2xl p-4 border border-cyan-500/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono animate-fadeIn">
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <span className="text-slate-300 font-bold block">Master Volume:</span>
                <span className="text-cyan-400 text-[11px] font-mono">{Math.round(audioVolume * 100)}% Gain</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.8"
                step="0.1"
                value={audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer w-36"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <span className="text-slate-300 font-bold block">Consonant Clarity EQ:</span>
                <span className="text-cyan-400 text-[11px] font-mono">+{vocalClarity.toFixed(1)}dB @ 3.2kHz</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="6.0"
                step="0.5"
                value={vocalClarity}
                onChange={(e) => handleClarityChange(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer w-36"
              />
            </div>
          </div>
        )}

        {/* 3-Column Studio Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Column 1: Voice & Audio Agent Hub (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Integrated Voice Orb & Reactive Audio Spectrum Card */}
            <div className="studio-glass rounded-2xl p-5 border border-cyan-500/25 relative overflow-hidden flex flex-col items-center justify-center shadow-xl">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span>VOICE COCKPIT</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  <span>SAMPLE: 22.05kHz</span>
                </div>
              </div>

              {/* Reactive Voice Orb */}
              <div className="my-2">
                <VoiceOrb
                  orbState={orbState}
                  onClick={startListening}
                  taskVersion={activeTask?.current_version || 1}
                />
              </div>

              {/* Integrated Waveform Spectrum */}
              <div className="w-full mt-1">
                <WaveformVisualizer
                  audioPlayer={audioPlayer}
                  orbState={orbState}
                />
              </div>
            </div>

            {/* Quick Benchmark Palette Card */}
            <div className="studio-glass rounded-2xl p-4 border border-slate-800/90 text-xs font-mono">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-cyan-400" /> QUICK TEST SCENARIOS
                </span>
                <span className="text-[10px] text-slate-500">CLICK TO EXECUTE</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => sendUtterance("Find the fastest route from Coimbatore to Chennai.")}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-cyan-300 group-hover:text-cyan-200">1. Initial Task (v1)</span>
                    <span className="text-[10px] text-slate-500">Tool: Route</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    &ldquo;Find fastest route from Coimbatore to Chennai.&rdquo;
                  </p>
                </button>

                <button
                  onClick={() => sendUtterance("Wait! Don't use highways. I want the cheapest route.")}
                  className="w-full text-left p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:border-rose-500/60 hover:bg-rose-950/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-rose-300 group-hover:text-rose-200">2. Interruption & Mutation (v2)</span>
                    <span className="text-[10px] text-rose-400 font-bold">&lt;15ms Cutoff</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    &ldquo;Wait! Don&apos;t use highways. I want the cheapest route.&rdquo;
                  </p>
                </button>

                <button
                  onClick={() => sendUtterance("Chennai-ku fastest route find pannu, but highway avoid pannanum.")}
                  className="w-full text-left p-2.5 rounded-xl bg-purple-950/20 border border-purple-900/50 hover:border-purple-500/60 hover:bg-purple-950/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-purple-300 group-hover:text-purple-200">3. Tanglish Code-Switching</span>
                    <span className="text-[10px] text-purple-400">Tamil + English</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    &ldquo;Chennai-ku fastest route find pannu, highway avoid pannanum.&rdquo;
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Neural Transcript Stream (4.5 Cols in standard, 8 Cols in recording mode) */}
          <div className={isRecordingMode ? "lg:col-span-8" : "lg:col-span-4"}>
            <ConversationPanel
              turns={turns}
              onSendMessage={sendUtterance}
              onInterrupt={() => triggerInterrupt("User clicked interrupt paddle")}
              isSpeaking={orbState === "SPEAKING"}
            />
          </div>

          {/* Column 3: Task Versioning & System State Deck (3.5 Cols) */}
          <div className={isRecordingMode ? "hidden" : "lg:col-span-4 space-y-4"}>
            {/* Monotonic Versioning Tree */}
            <TaskVersionVisualizer
              task={activeTask}
              activeVersion={activeTask?.current_version || 1}
              onSelectVersion={setSelectedVersionForModal}
            />

            {/* System State & Audit Log */}
            <SystemStatePanel
              task={activeTask}
              currentLanguage={currentLanguage}
              staleAlert={staleAlert}
              toolDelayMs={isStressMode ? 7500 : 3500}
            />

            <EventTimeline events={events} />
          </div>
        </div>

        {/* Real-time Telemetry Benchmarks Dock */}
        <div className="mt-1">
          <MetricsBar metrics={metrics} />
        </div>
      </main>

      {/* Truth Inspector Modal */}
      <TruthGraphModal
        isOpen={!!selectedVersionForModal}
        onClose={() => setSelectedVersionForModal(null)}
        task={activeTask}
        selectedVersion={selectedVersionForModal}
      />
    </div>
  );
}
