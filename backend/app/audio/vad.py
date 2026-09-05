import time
import numpy as np
import logging
from typing import Optional, Tuple

logger = logging.getLogger("sentinel.vad")


class ConfidenceAwareVAD:
    """Confidence-aware Voice Activity & Interruption Detector.
    
    Evaluates audio energy, zero-crossing rate, speech probability, and minimum continuous
    duration to differentiate genuine user interruptions from short background noises or breathing.
    """

    def __init__(
        self,
        threshold: float = 0.65,
        min_speech_duration_ms: float = 120.0,
        debounce_ms: float = 80.0,
        sample_rate: int = 16000
    ):
        self.threshold = threshold
        self.min_speech_duration_ms = min_speech_duration_ms
        self.debounce_ms = debounce_ms
        self.sample_rate = sample_rate
        
        self.speech_start_time: Optional[float] = None
        self.last_speech_time: Optional[float] = None
        self.consecutive_speech_frames: int = 0
        self.is_speaking: bool = False

    def process_frame(self, audio_bytes: bytes, is_assistant_speaking: bool = False) -> Tuple[bool, float, bool]:
        """Analyzes a PCM16 audio chunk.
        
        Returns:
            (is_voice_active: bool, confidence: float, is_interruption_confirmed: bool)
        """
        now = time.time()
        
        if len(audio_bytes) < 2:
            return False, 0.0, False

        # Convert raw PCM16 bytes to numpy float array normalized to [-1.0, 1.0]
        try:
            pcm_data = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        except Exception:
            return False, 0.0, False

        if len(pcm_data) == 0:
            return False, 0.0, False

        # 1. Compute RMS energy
        rms = np.sqrt(np.mean(pcm_data ** 2) + 1e-12)
        
        # 2. Compute Zero Crossing Rate (ZCR)
        zero_crossings = np.sum(np.abs(np.diff(pcm_data > 0))) / len(pcm_data)
        
        # 3. Compute Spectral estimate & speech probability
        # Speech typical RMS: 0.03 - 0.5, ZCR: 0.04 - 0.35
        energy_score = min(1.0, rms * 15.0)
        zcr_score = 1.0 if (0.02 < zero_crossings < 0.45) else 0.3
        
        speech_probability = (0.7 * energy_score) + (0.3 * zcr_score)
        
        # If assistant is currently speaking (AEC / full duplex scenario), 
        # raise the threshold slightly to suppress echo/bleed
        effective_threshold = self.threshold * 1.15 if is_assistant_speaking else self.threshold
        is_active = speech_probability >= effective_threshold

        is_interruption_confirmed = False

        if is_active:
            self.last_speech_time = now
            self.consecutive_speech_frames += 1
            if self.speech_start_time is None:
                self.speech_start_time = now
            
            duration_ms = (now - self.speech_start_time) * 1000.0
            
            # If speaking continuously for longer than min_speech_duration_ms and assistant is speaking
            if is_assistant_speaking and duration_ms >= self.min_speech_duration_ms:
                is_interruption_confirmed = True
                self.is_speaking = True
        else:
            # Check debounce before resetting
            if self.last_speech_time and (now - self.last_speech_time) * 1000.0 > self.debounce_ms:
                self.speech_start_time = None
                self.consecutive_speech_frames = 0
                self.is_speaking = False

        return is_active, float(speech_probability), is_interruption_confirmed

    def reset(self):
        self.speech_start_time = None
        self.last_speech_time = None
        self.consecutive_speech_frames = 0
        self.is_speaking = False
