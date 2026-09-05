from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class BaseLLMProvider(ABC):
    """Abstract interface for LLM reasoning and intent parsing."""

    @abstractmethod
    async def parse_intent_and_constraints(
        self,
        user_utterance: str,
        conversation_context: List[Dict[str, str]],
        existing_constraints: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Extract intent, tool selection, entities, constraints, and detected language."""
        pass

    @abstractmethod
    async def generate_response(
        self,
        user_utterance: str,
        tool_result: Optional[Dict[str, Any]],
        task_version: int,
        conversation_context: List[Dict[str, str]],
    ) -> str:
        """Generate concise, natural spoken-language response suitable for Rime TTS."""
        pass
