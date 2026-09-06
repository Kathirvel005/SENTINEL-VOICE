"use client";

import { useState } from "react";
import { TopNav } from "../../components/TopNav";
import { VoiceOrb } from "../../components/VoiceOrb";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { TaskVersionVisualizer } from "../../components/TaskVersionVisualizer";
import { MetricsBar } from "../../components/MetricsBar";
import { useVoiceSession } from "../../hooks/useVoiceSession";
import { Play, Navigation, Globe, Compass } from "lucide-react";

export default function DemoPage() {
  const {
    orbState,
    activeTask,
    metrics,
    isStressMode,
    isConnected,
    staleAlert,
    sendUtterance,
    triggerInterrupt,
    toggleStressMode,
    startListening,
    audioPlayer,
  } = useVoiceSession("demo_session");

  const [activeScenario, setActiveScenario] = useState<number>(1);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const scenarios = [
    {
      id: 1,
      title: "Scenario 1: Route Rescue",
      subtitle: "The Master Interruption Flow",
      icon: Navigation,
      badge: "CORE JUDGING FLOW",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      description: "Demonstrates mid-tool interruption. A slow route search from Coimbatore to Chennai is running. The user interrupts with 'No highways, find cheapest route'. Rime audio stops instantly, v1 is invalidated and rejected, v2 is computed and spoken.",
      steps: [
        {
          label: "1. Initiate Task v1",
          actionText: "Send: 'Find fastest route from Coimbatore to Chennai.'",
          execute: () => {
            sendUtterance("Find the fastest route from Coimbatore to Chennai.");
            setStepIndex(1);
          },
        },
        {
          label: "2. Trigger Voice Interruption (v2)",
          actionText: "Interrupt: 'Wait! Don't use highways. I want the cheapest route.'",
          execute: () => {
            triggerInterrupt(
              "User voice interrupt: No highways, cheapest route",
              "Wait! Don't use highways. I want the cheapest route."
            );
            sendUtterance("Wait! Don't use highways. I want the cheapest route.");
            setStepIndex(2);
          },
        },
        {
          label: "3. Verify Truth & Spoken Delivery",
          actionText: "Check Stale Result Guard & observe Rime v2 response.",
          execute: () => {
            setStepIndex(0);
          },
        },
      ],
    },
    {
      id: 2,
      title: "Scenario 2: Multilingual Code-Switching",
      subtitle: "Natural Tanglish Route Planning",
      icon: Globe,
      badge: "NATURAL SPEECH",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      description: "Demonstrates natural mixed-language Tamil-English understanding. Preserves destination (Chennai), intent, and negation (avoid highways) without loss of context.",
      steps: [
        {
          label: "1. Send Tanglish Utterance",
          actionText: "Send: 'Chennai-ku fastest route find pannu, but highway avoid pannanum.'",
          execute: () => {
            sendUtterance("Chennai-ku fastest route find pannu, but highway avoid pannanum.");
            setStepIndex(1);
          },
        },
        {
          label: "2. Observe Language Detection",
          actionText: "Review extracted entities & constraints in live system panel.",
          execute: () => {
            setStepIndex(0);
          },
        },
      ],
    },
    {
      id: 3,
      title: "Scenario 3: Tool Continuity",
      subtitle: "Domain Pivot Mid-Execution",
      icon: Compass,
      badge: "TASK CONTINUITY",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      description: "User starts an outdoor activity search, then interrupts: 'Actually, forget outdoor activities. Find an indoor activity.' The outdoor search is cancelled/fenced and indoor recommendations are synthesized.",
      steps: [
        {
          label: "1. Start Outdoor Activity Search",
          actionText: "Send: 'Check the weather and find an outdoor activity.'",
          execute: () => {
            sendUtterance("Check the weather and find an outdoor activity.");
            setStepIndex(1);
          },
        },
        {
          label: "2. Interrupt & Pivot to Indoor",
          actionText: "Send: 'Actually, forget outdoor activities. Find an indoor activity.'",
          execute: () => {
            triggerInterrupt(
              "User switched to indoor activities",
              "Actually, forget outdoor activities. Find an indoor activity."
            );
            sendUtterance("Actually, forget outdoor activities. Find an indoor activity.");
            setStepIndex(2);
          },
        },
        {
          label: "3. Verify Indoor Result Spoken",
          actionText: "Confirm outdoor recommendation was blocked and indoor was spoken.",
          execute: () => {
            setStepIndex(0);
          },
        },
      ],
    },
  ];

  const currentScen = scenarios.find((s) => s.id === activeScenario) || scenarios[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <TopNav
        isConnected={isConnected}
        isStressMode={isStressMode}
        onToggleStressMode={toggleStressMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Scenario Selection Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scen) => {
            const Icon = scen.icon;
            const isSelected = scen.id === activeScenario;
            return (
              <button
                key={scen.id}
                onClick={() => {
                  setActiveScenario(scen.id);
                  setStepIndex(0);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-slate-900/90 border-cyan-500/50 shadow-xl shadow-cyan-500/10"
                    : "glass-panel border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${scen.badgeColor}`}>
                    {scen.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-200">{scen.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{scen.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Guided Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Guide Panel */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  GUIDED STEP-BY-STEP FLOW
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Step {stepIndex + 1} of {currentScen.steps.length}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {currentScen.description}
              </p>

              {/* Step Sequence Buttons */}
              <div className="space-y-3">
                {currentScen.steps.map((st, idx) => {
                  const isCurrent = idx === stepIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-cyan-950/30 border-cyan-500/50 shadow-md"
                          : "bg-slate-900/40 border-slate-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {st.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold animate-pulse">
                            ACTIVE STEP
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mb-3 font-mono">
                        {st.actionText}
                      </p>

                      <button
                        onClick={st.execute}
                        className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>EXECUTE STEP {idx + 1}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stale Alert Banner */}
            {staleAlert && (
              <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs shadow-lg">
                <span className="font-mono font-bold block mb-1">STALE RESULT GUARD REJECTION:</span>
                <p className="text-[11px] font-mono">
                  Obsolete version {staleAlert.rejectedVersion} result arrived but was suppressed. Zero stale speech generated!
                </p>
              </div>
            )}
          </div>

          {/* Right Live Visualizer */}
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-800">
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

            <TaskVersionVisualizer
              task={activeTask}
              activeVersion={activeTask?.current_version || 1}
            />
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <MetricsBar metrics={metrics} />
      </main>
    </div>
  );
}
