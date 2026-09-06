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
import { Video, Sparkles, Mic, Radio, Sliders } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-cyan-500/30">
      {/* Top Header */}
      <TopNav
        isConnected={isConnected}
        isStressMode={isStressMode}
        onToggleStressMode={toggleStressMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Control Bar: Voice Personas, Hands-Free Duplex & Recording Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Start Voice Mic Button */}
            <button
              onClick={startListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all shadow-lg ${
                orbState === "LISTENING"
                  ? "bg-cyan-500 text-slate-950 border border-cyan-300 animate-pulse shadow-cyan-500/30"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20"
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>{orbState === "LISTENING" ? "LISTENING..." : "START VOICE (MIC)"}</span>
            </button>

            {/* Hands-Free Full-Duplex Toggle */}
            <button
              onClick={toggleHandsFree}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all border shadow-sm ${
                isHandsFree
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20 animate-pulse"
                  : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Radio className={`h-4 w-4 ${isHandsFree ? "text-emerald-400 animate-spin" : "text-slate-500"}`} />
              <span>{isHandsFree ? "HANDS-FREE DUPLEX (LIVE)" : "HANDS-FREE DUPLEX"}</span>
            </button>

            {/* Voice Persona Dropdown */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 text-[11px]">VOICE:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="neerja" className="bg-slate-900 text-slate-200">Neerja (Indian English / Tanglish)</option>
                <option value="pallavi" className="bg-slate-900 text-slate-200">Pallavi (Tamil Neural)</option>
                <option value="prabhat" className="bg-slate-900 text-slate-200">Prabhat (Indian Male)</option>
                <option value="aria" className="bg-slate-900 text-slate-200">Aria (US Studio Neural)</option>
                <option value="andrew" className="bg-slate-900 text-slate-200">Andrew (US Multilingual)</option>
                <option value="amber" className="bg-slate-900 text-slate-200">Amber (Rime AI Studio)</option>
              </select>
            </div>

            {/* Speech Rate Selector */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 text-[11px]">SPEED:</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                className="bg-transparent text-slate-300 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="-10%" className="bg-slate-900 text-slate-200">0.9x</option>
                <option value="+0%" className="bg-slate-900 text-slate-200">1.0x (Normal)</option>
                <option value="+5%" className="bg-slate-900 text-slate-200">1.05x (Crisp)</option>
                <option value="+12%" className="bg-slate-900 text-slate-200">1.15x (Fast)</option>
              </select>
            </div>

            {/* Interruption Button */}
            {orbState === "SPEAKING" && (
              <button
                onClick={() => triggerInterrupt("User pressed manual interrupt")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold animate-pulse shadow-lg shadow-rose-600/30"
              >
                <span>STOP SPEECH (INTERRUPT)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Tuning Drawer Toggle */}
            <button
              onClick={() => setShowAudioControls(!showAudioControls)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                showAudioControls
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>AUDIO DSP</span>
            </button>

            {/* Recording Mode Switch */}
            <button
              onClick={() => setIsRecordingMode(!isRecordingMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                isRecordingMode
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/20"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Video className="h-3.5 w-3.5 text-purple-400" />
              <span>{isRecordingMode ? "RECORDING (ON)" : "RECORDING"}</span>
            </button>
          </div>
        </div>

        {/* Expandable Audio DSP Mastering Controls */}
        {showAudioControls && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Master Volume ({Math.round(audioVolume * 100)}%):</span>
              <input
                type="range"
                min="0.2"
                max="1.8"
                step="0.1"
                value={audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer w-32"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Speech Presence EQ (+{vocalClarity.toFixed(1)}dB):</span>
              <input
                type="range"
                min="0.0"
                max="6.0"
                step="0.5"
                value={vocalClarity}
                onChange={(e) => handleClarityChange(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer w-32"
              />
            </div>
          </div>
        )}

        {/* Centerpiece: Voice Orb & Audio Waveform */}
        <div className="glass-panel-glow rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>VOICE AGENT HUB</span>
          </div>

          <VoiceOrb
            orbState={orbState}
            onClick={startListening}
            taskVersion={activeTask?.current_version || 1}
          />

          <WaveformVisualizer
            audioPlayer={audioPlayer}
            orbState={orbState}
          />
        </div>

        {/* Middle Section: 3-Column Command Grid (or 2-Column in Recording Mode) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Conversation Stream (5 Cols) */}
          <div className={isRecordingMode ? "lg:col-span-6" : "lg:col-span-5"}>
            <ConversationPanel
              turns={turns}
              onSendMessage={sendUtterance}
              onInterrupt={() => triggerInterrupt("User clicked interrupt")}
              isSpeaking={orbState === "SPEAKING"}
            />
          </div>

          {/* Right/Center Panels */}
          <div className={isRecordingMode ? "lg:col-span-6 space-y-6" : "lg:col-span-7 space-y-6"}>
            {/* Task Version Progression Visualizer */}
            <TaskVersionVisualizer
              task={activeTask}
              activeVersion={activeTask?.current_version || 1}
              onSelectVersion={setSelectedVersionForModal}
            />

            {/* System State & Event Timeline */}
            <div className={`grid ${isRecordingMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-6`}>
              <SystemStatePanel
                task={activeTask}
                currentLanguage={currentLanguage}
                staleAlert={staleAlert}
                toolDelayMs={isStressMode ? 7500 : 3500}
              />

              {!isRecordingMode && (
                <EventTimeline events={events} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Real-time Telemetry Metrics Bar */}
        <div className="mt-2">
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

