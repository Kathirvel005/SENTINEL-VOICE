import logging
from typing import Dict, Any, Optional
from app.providers.stt.base import BaseSTTProvider

logger = logging.getLogger("sentinel.stt.simulated")


class SimulatedSTTProvider(BaseSTTProvider):
    """Reliable fallback/test STT provider for automated suites and browser speech-recognition bridge."""

    def __init__(self):
        self.last_transcript: str = ""

    def feed_utterance(self, text: str):
        self.last_transcript = text

    async def transcribe_chunk(self, audio_chunk: bytes) -> Optional[str]:
        return None

    async def transcribe_audio(self, audio_bytes: bytes) -> Dict[str, Any]:
        # Return last fed utterance or fallback indication
        text = self.last_transcript or "Find route to Chennai"
        return {
            "transcript": text,
            "confidence": 0.98,
            "language": "en-IN",
            "provider": "simulated",
        }
