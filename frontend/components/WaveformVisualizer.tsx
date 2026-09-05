"use client";

import { useRef, useEffect, useState } from "react";
import { AudioPlaybackClient } from "../lib/audio-player";
import { OrbState } from "../types";
import { Volume2, VolumeX, Activity } from "lucide-react";

interface WaveformVisualizerProps {
  audioPlayer: AudioPlaybackClient | null;
  orbState: OrbState;
}

export function WaveformVisualizer({ audioPlayer, orbState }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentDb, setCurrentDb] = useState<number>(-48);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isSpeaking = orbState === "SPEAKING";
      const isListening = orbState === "LISTENING";
      const isInterrupted = orbState === "INTERRUPTED";

      let dataArray: any = null;
      let calculatedRms = 0;

      if (audioPlayer && audioPlayer.analyser) {
        const bufferLength = audioPlayer.analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        audioPlayer.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let j = 0; j < dataArray.length; j++) {
          sum += dataArray[j] * dataArray[j];
        }
        calculatedRms = Math.sqrt(sum / dataArray.length);
      }

      if (isSpeaking && calculatedRms > 0) {
        const db = Math.max(-60, Math.min(0, Math.round(20 * Math.log10(calculatedRms / 255))));
        setCurrentDb(db);
      } else if (isListening) {
        setCurrentDb(-32);
      } else {
        setCurrentDb(-54);
      }

      const barCount = 52;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (dataArray && isSpeaking) {
          const index = Math.floor((i / barCount) * dataArray.length);
          const rawValue = dataArray[index] || 0;
          barHeight = Math.max(4, (rawValue / 255) * (height - 12));
        } else if (isListening) {
          const t = Date.now() / 180;
          barHeight = 6 + Math.sin(t + i * 0.35) * 12;
        } else if (isInterrupted) {
          barHeight = Math.random() * 8;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        // Gradient styling
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isInterrupted) {
          grad.addColorStop(0, "#f43f5e");
          grad.addColorStop(0.5, "#fb7185");
          grad.addColorStop(1, "#e11d48");
        } else if (isSpeaking) {
          grad.addColorStop(0, "#06b6d4");
          grad.addColorStop(0.5, "#10b981");
          grad.addColorStop(1, "#047857");
        } else {
          grad.addColorStop(0, "#0284c7");
          grad.addColorStop(1, "#0369a1");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2.5);
        ctx.fill();

        // Top mirror glow dot
        if (barHeight > 10) {
          ctx.fillStyle = isInterrupted ? "#fecdd3" : "#6ee7b7";
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, y - 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [audioPlayer, orbState]);

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-1">
      <canvas
        ref={canvasRef}
        width={460}
        height={54}
        className="w-full max-w-lg h-14 opacity-95"
      />
      {/* Telemetry Audio Gauge */}
      <div className="flex items-center justify-between w-full max-w-md px-2 text-[10px] font-mono text-slate-400 mt-1">
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span>SPECTRUM ANALYZER</span>
        </span>
        <span className="flex items-center gap-2">
          <span>PEAK: <strong className={currentDb > -20 ? "text-emerald-400" : "text-slate-300"}>{currentDb} dB</strong></span>
          <span className={`w-1.5 h-1.5 rounded-full ${orbState === "SPEAKING" ? "bg-emerald-400 animate-ping" : orbState === "INTERRUPTED" ? "bg-rose-500" : "bg-cyan-500"}`}></span>
        </span>
      </div>
    </div>
  );
}
