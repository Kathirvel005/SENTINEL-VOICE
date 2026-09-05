from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator


class BaseSTTProvider(ABC):
    """Abstract interface for Speech-to-Text providers."""

    @abstractmethod
    async def transcribe_chunk(self, audio_chunk: bytes) -> Optional[str]:
        """Transcribe an incoming streaming chunk of audio."""
        pass

    @abstractmethod
    async def transcribe_audio(self, audio_bytes: bytes) -> Dict[str, Any]:
        """Transcribe a complete buffer of audio. Returns text, language, confidence."""
        pass
