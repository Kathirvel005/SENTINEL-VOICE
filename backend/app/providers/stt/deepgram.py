import os
import logging
from typing import Dict, Any, Optional
import httpx
from app.providers.stt.base import BaseSTTProvider

logger = logging.getLogger("sentinel.stt.deepgram")


class DeepgramSTTProvider(BaseSTTProvider):
    """Deepgram speech recognition provider."""

    def __init__(self):
        self.api_key = os.getenv("DEEPGRAM_API_KEY", "")
        self.endpoint = os.getenv("DEEPGRAM_ENDPOINT", "https://api.deepgram.com/v1/listen")
        self.is_configured = bool(self.api_key and len(self.api_key) > 5)

    async def transcribe_chunk(self, audio_chunk: bytes) -> Optional[str]:
        # Streaming chunk transcription is passed over websocket in production
        return None

    async def transcribe_audio(self, audio_bytes: bytes) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "transcript": "",
                "language": "en",
                "confidence": 0.0,
                "error": "Deepgram API key not configured",
            }

        try:
            headers = {
                "Authorization": f"Token {self.api_key}",
                "Content-Type": "audio/wav",
            }
            params = {
                "model": "nova-2",
                "smart_format": "true",
                "detect_language": "true",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.endpoint,
                    params=params,
                    headers=headers,
                    content=audio_bytes,
                )
                resp.raise_for_status()
                data = resp.json()
                channel = data.get("results", {}).get("channels", [{}])[0]
                alt = channel.get("alternatives", [{}])[0]
                return {
                    "transcript": alt.get("transcript", ""),
                    "confidence": alt.get("confidence", 0.9),
                    "language": data.get("results", {}).get("detected_language", "en"),
                }
        except Exception as e:
            logger.error(f"Deepgram transcription error: {e}")
            return {"transcript": "", "language": "en", "confidence": 0.0, "error": str(e)}
